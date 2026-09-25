import React, { useEffect, useMemo, useRef, useState } from 'react';
import { saveSession, logEvent, updateProfileAdaptation } from '../db/db';
import { GAME_DATA, PEOPLE, CULTURE, LIFE_INTERESTS, PLACES, REGION_VISUALS } from './data';
import { speakText } from '../services/speech';
import { choicesForDifficulty, nextAdaptation } from '../services/analytics';
import MemoryPairs from './MemoryPairs';
import ConversationMoments from './ConversationMoments';
import FamiliarFacesGame from './FamiliarFacesGame';

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function say(text, language) {
  return speakText(text, language);
}

export default function Game({ gameId, profile, onDone, onBack }) {
  if (gameId === 'familiar-faces') {
    return <FamiliarFacesGame profile={profile} onDone={onDone} onBack={onBack} />;
  }
  if (gameId === 'memory-pairs') {
    return <MemoryPairs profile={profile} onDone={onDone} onBack={onBack} />;
  }
  if (gameId === 'stories-from-home' || gameId === 'garden-moments') {
    return <ConversationMoments gameId={gameId} profile={profile} onDone={onDone} onBack={onBack} />;
  }

  const meta = GAME_DATA[gameId] || { title: 'Familiar Activity', icon: '🌱', desc: '', rounds: 4 };
  const startedAt = useRef(Date.now());
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [hint, setHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [companion, setCompanion] = useState(false);

  // Dementia constraint: Default to 2 choices (or 3 maximum if stretch mode)
  const choiceCount = choicesForDifficulty(
    profile,
    gameId,
    localStorage.getItem('CARE_COMFORT_MODE') !== 'false'
  );

  const question = useMemo(
    () => makeQuestion(gameId, round, profile, choiceCount),
    [gameId, round, profile.favoritePerson, profile.region, choiceCount]
  );

  useEffect(() => {
    logEvent(profile.id, 'game_start', { gameId });
  }, [gameId, profile.id]);

  function answer(value) {
    if (chosen !== null) return;
    const isCorrect = value === question.answer;
    const nextScore = score + (isCorrect ? 20 : 0);
    const nextCorrect = correct + Number(isCorrect);
    setChosen(value);
    setScore(nextScore);
    setCorrect(nextCorrect);
    setFeedback(
      isCorrect
        ? '🌸 Lovely choice! Let us continue together.'
        : '💚 That is okay. This is a gentle practice, not a test.'
    );
    logEvent(profile.id, 'answer', { gameId, round, correct: isCorrect, usedHint: hint });

    window.setTimeout(() => {
      if (round + 1 >= meta.rounds) {
        saveSession({
          profileId: profile.id,
          gameId,
          score: nextScore,
          correct: nextCorrect,
          rounds: meta.rounds,
          hintsUsed,
          difficulty: choiceCount,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
        });
        setFinished(true);
      } else {
        setRound((value) => value + 1);
        setChosen(null);
        setHint(false);
        setFeedback('');
      }
    }, 1500);
  }

  async function finishWithFeedback(feeling) {
    await logEvent(profile.id, 'game_feedback', { gameId, feeling });
    const adaptation = nextAdaptation(profile.adaptation?.[gameId], {
      correct,
      rounds: meta.rounds,
      feeling,
      hintsUsed
    });
    const updated = await updateProfileAdaptation(gameId, adaptation);
    onDone(updated);
  }

  if (finished) {
    return (
      <section className="card elder-card p-6 sm:p-10 text-center max-w-2xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
        <div className="text-6xl sm:text-7xl" aria-hidden="true">🌟</div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#14532d]">
          Thank You, {profile.name}
        </h2>
        <p className="text-xl sm:text-2xl text-[#374151] leading-relaxed">
          You completed {meta.rounds} gentle moments together. There is no pass or fail.
        </p>

        <div className="pt-4 border-t-2 border-[#e2d9c8] space-y-4">
          <p className="font-black text-2xl text-[#14231a]">
            How did this feel today?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className="btn btn-soft min-h-[76px] flex flex-col items-center justify-center bg-[#fff1f2] border-2 border-[#fda4af]"
              onClick={() => finishWithFeedback('hard')}
            >
              <span className="text-3xl" aria-hidden="true">🌧️</span>
              <span className="text-lg font-black mt-1 text-[#9f1239]">A little hard</span>
            </button>
            <button
              className="btn btn-soft min-h-[76px] flex flex-col items-center justify-center bg-[#fffbeb] border-2 border-[#fcd34d]"
              onClick={() => finishWithFeedback('okay')}
            >
              <span className="text-3xl" aria-hidden="true">🌤️</span>
              <span className="text-lg font-black mt-1 text-[#92400e]">It was okay</span>
            </button>
            <button
              className="btn btn-soft min-h-[76px] flex flex-col items-center justify-center bg-[#ecfdf5] border-2 border-[#6ee7b7]"
              onClick={() => finishWithFeedback('enjoyed')}
            >
              <span className="text-3xl" aria-hidden="true">☀️</span>
              <span className="text-lg font-black mt-1 text-[#065f46]">I enjoyed it</span>
            </button>
          </div>
        </div>

        <button
          className="btn btn-primary w-full text-xl min-h-[72px] mt-4"
          onClick={() => onDone(profile)}
        >
          Return to Activities
        </button>
      </section>
    );
  }

  return (
    <main className="card elder-card p-6 sm:p-10 max-w-2xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
      {/* Return Button */}
      <button
        onClick={onBack}
        className="btn btn-soft min-h-[56px] px-4 text-lg font-black flex items-center gap-2"
      >
        <span className="text-2xl" aria-hidden="true">⬅️</span>
        <span>Back to Activities</span>
      </button>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#e2d9c8] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl" aria-hidden="true">{meta.icon}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#14532d]">
                {meta.title}
              </h1>
              <p className="text-base text-[#4a584e]">
                One gentle step at a time.
              </p>
            </div>
          </div>
          <div className="game-region-strip mt-3" aria-label={`Visual memories from ${profile.region}`}>
            <span aria-hidden="true">{REGION_VISUALS[profile.region] || '🌿 🧺 🌄 🎶'}</span>
            <span>{profile.region} Memories</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ecfdf5] border-2 border-[#a7f3d0] px-4 py-2 text-center self-start sm:self-center">
          <div className="text-xs font-bold text-[#065f46] uppercase">Progress</div>
          <div className="text-xl font-black text-[#047857]">
            {round + 1} of {meta.rounds}
          </div>
        </div>
      </header>

      {/* Family Companion Tip Toggle */}
      <div>
        <button
          className="btn btn-soft min-h-[54px] w-full text-base font-black flex items-center justify-center gap-2"
          onClick={() => setCompanion((value) => !value)}
          aria-pressed={companion}
        >
          <span aria-hidden="true">👥</span>
          <span>{companion ? 'Playing Together (Companion Tip Shown)' : 'Playing with Family or Companion?'}</span>
        </button>
        {companion && (
          <p className="companion-note mt-3">
            <b>Companion tip:</b> Read the question slowly. If needed, press "Hear the Question" or tap "Show a hint". Celebrate the moment, not the score.
          </p>
        )}
      </div>

      {/* Question Prompt Section */}
      <section className="rounded-2xl bg-[#fefbf2] border-3 border-[#e5d5b5] p-6 space-y-4">
        <p className="text-2xl sm:text-3xl font-black text-[#14231a] leading-snug">
          {question.prompt}
        </p>

        {/* Read Aloud Action */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => say(question.prompt, profile.language)}
            className="btn btn-soft min-h-[60px] text-lg font-black flex items-center gap-2"
          >
            <span className="text-2xl" aria-hidden="true">🔊</span>
            <span>Hear the Question</span>
          </button>
          {question.voice && (
            <button
              onClick={() => say(question.voice, profile.language)}
              className="btn btn-soft min-h-[60px] text-lg font-black flex items-center gap-2"
            >
              <span className="text-2xl" aria-hidden="true">🔊</span>
              <span>Hear Again</span>
            </button>
          )}
        </div>

        {hint && (
          <div className="mt-3 p-4 rounded-xl bg-[#ecfdf5] border-2 border-[#10b981] text-lg text-[#065f46] font-bold">
            💡 <b>A gentle hint:</b> {question.hint}
          </div>
        )}
      </section>

      {/* Chunky, Large Choice Buttons (Strictly 2 or 3 large cards) */}
      <div className="grid grid-cols-1 gap-4 pt-2">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => answer(option)}
            disabled={chosen !== null}
            className={`game-choice text-left min-h-[84px] text-xl sm:text-2xl font-black ${
              chosen !== null && option === question.answer
                ? 'bg-[#d1fae5] border-[#059669] text-[#064e3b]'
                : chosen === option
                ? 'bg-[#fef3c7] border-[#d97706] text-[#78350f]'
                : 'bg-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Hint Trigger */}
      {chosen === null && !hint && (
        <button
          className="btn btn-soft min-h-[58px] w-full text-lg font-bold flex items-center justify-center gap-2"
          onClick={() => {
            setHint(true);
            setHintsUsed((value) => value + 1);
            logEvent(profile.id, 'game_hint', { gameId, round });
          }}
        >
          <span aria-hidden="true">💡</span>
          <span>Show a gentle hint</span>
        </button>
      )}

      {feedback && (
        <div className="voice-status text-xl text-center" role="status">
          {feedback}
        </div>
      )}

      <footer className="text-center text-sm font-bold text-[#64748b] pt-2">
        CARE is for connection, warmth, and cognitive stimulation. It does not test or diagnose memory.
      </footer>
    </main>
  );
}

function makeQuestion(id, round, profile, choiceCount) {
  if (id === 'family-match') {
    const person = profile.favoritePerson?.trim() || PEOPLE[round % PEOPLE.length];
    const options = shuffle([
      person,
      ...PEOPLE.filter((value) => value !== person).slice(0, choiceCount - 1)
    ]);
    return {
      prompt: 'Which familiar person would you like to think about today?',
      options,
      answer: person,
      hint:
        person === profile.favoritePerson?.trim()
          ? 'This is the special person you named when setting up CARE.'
          : 'Think of a close family member.'
    };
  }
  if (id === 'culture-memory') {
    const matching =
      CULTURE.find(([region]) => region === profile.region) || CULTURE[round % CULTURE.length];
    const [region, festival] = matching;
    const options = shuffle([
      festival,
      ...CULTURE.map(([, value]) => value)
        .filter((value) => value !== festival)
        .slice(0, choiceCount - 1)
    ]);
    return {
      prompt: `Which celebration is connected with ${region}?`,
      options,
      answer: festival,
      hint: `It is a familiar festival from ${region}.`
    };
  }
  if (id === 'name-place') {
    const place = PLACES[round % PLACES.length];
    return {
      prompt: 'Which of these is a familiar place in Northeast India?',
      options: shuffle([place, 'Jaipur', 'Pune', 'Surat'].slice(0, choiceCount)),
      answer: place,
      hint: 'Think of places close to the hills, valleys, and rivers of the Northeast.'
    };
  }
  if (id === 'everyday-skills') {
    const selected = profile.activities?.length
      ? profile.activities
      : LIFE_INTERESTS.map((item) => item.id);
    const questions = [
      {
        category: 'farm',
        prompt: 'What might you carry seeds or fresh vegetables in?',
        answer: 'A basket',
        options: ['A basket', 'A pillow', 'A slipper'],
        hint: 'Think of something woven and useful for the field or garden.'
      },
      {
        category: 'food',
        prompt: 'What might you take when going to buy fresh vegetables?',
        answer: 'A shopping bag',
        options: ['A shopping bag', 'A blanket', 'A toothbrush'],
        hint: 'Think of carrying fresh food home.'
      },
      {
        category: 'craft',
        prompt: 'What can be used to make a handwoven cloth?',
        answer: 'Thread',
        options: ['Thread', 'Soap', 'A key'],
        hint: 'Think of a loom, needle, or handwork.'
      },
      {
        category: 'music',
        prompt: 'What can bring people together at a celebration?',
        answer: 'A familiar song',
        options: ['A familiar song', 'A traffic signal', 'A password'],
        hint: 'Think of voices, rhythm, and sharing.'
      },
      {
        category: 'family',
        prompt: 'What makes a family visit feel warm and happy?',
        answer: 'Talking together',
        options: ['Talking together', 'A locked door', 'A silent phone'],
        hint: 'Think of sharing stories and tea.'
      },
      {
        category: 'work',
        prompt: 'What helps when arranging items for a small shop or home?',
        answer: 'Sorting them together',
        options: ['Sorting them together', 'Throwing them away', 'Turning off the light'],
        hint: 'Think of putting similar things in simple order.'
      }
    ];
    const relevant = questions.filter((question) => selected.includes(question.category));
    const question = (relevant.length ? relevant : questions)[
      round % (relevant.length || questions.length)
    ];
    return { ...question, options: shuffle(question.options.slice(0, choiceCount)) };
  }
  if (id === 'sequence-story') {
    const routines = [
      ['Wake up', 'Have tea & breakfast', 'Rest'],
      ['Prepare tea', 'Greet family', 'Sleep']
    ];
    const routine = routines[round % routines.length];
    return {
      prompt: 'What usually comes first in this familiar day?',
      options: shuffle(routine.slice(0, choiceCount)),
      answer: routine[0],
      hint: 'Think about the beginning of the morning.'
    };
  }
  if (id === 'local-greetings') {
    const greetings = [
      { language: 'as-IN', name: 'Assamese', phrase: 'নমস্কাৰ', sound: 'Nomoskar' },
      { language: 'mni-IN', name: 'Manipuri', phrase: 'খুরুমজারি', sound: 'Khurumjari' },
      { language: 'brx-IN', name: 'Bodo', phrase: 'खुलुमबाई', sound: 'Khulumbai' },
      { language: 'ne-IN', name: 'Nepali', phrase: 'नमस्ते', sound: 'Namaste' },
      { language: 'en-IN', name: 'English', phrase: 'Good morning', sound: 'Good morning' }
    ];
    const preferred =
      greetings.find((item) => item.language === profile.language) ||
      greetings.find((item) => item.language === 'en-IN');
    const current = greetings[(greetings.indexOf(preferred) + round) % greetings.length];
    const options = shuffle([
      current.sound,
      ...greetings
        .filter((item) => item.sound !== current.sound)
        .map((item) => item.sound)
        .slice(0, choiceCount - 1)
    ]);
    return {
      prompt: `Which warm greeting is spoken in ${current.name}?`,
      options,
      answer: current.sound,
      hint: `${current.phrase} is written in the local script.`,
      voice: current.sound
    };
  }
  if (id === 'festival-treasures') {
    const treasures = {
      Assam: ['Bihu', 'pepa'],
      Manipur: ['Lai Haraoba', 'pena'],
      Meghalaya: ['Wangala', 'drum'],
      Nagaland: ['Hornbill Festival', 'shawl'],
      Mizoram: ['Chapchar Kut', 'bamboo'],
      Tripura: ['Garia Puja', 'drum'],
      'Arunachal Pradesh': ['Losar', 'prayer flag'],
      Sikkim: ['Pang Lhabsol', 'prayer flag']
    };
    const [festival, object] = treasures[profile.region] || treasures.Assam;
    const pairs = [
      ['Bihu', 'pepa'],
      ['Lai Haraoba', 'pena'],
      ['Wangala', 'drum'],
      ['Hornbill Festival', 'shawl'],
      ['Chapchar Kut', 'bamboo'],
      ['Garia Puja', 'drum'],
      ['Losar', 'prayer flag'],
      ['Pang Lhabsol', 'prayer flag']
    ];
    const current =
      pairs[(pairs.findIndex((pair) => pair[0] === festival) + round + pairs.length) % pairs.length];
    const options = shuffle([
      current[1],
      ...pairs
        .filter((pair) => pair[1] !== current[1])
        .map((pair) => pair[1])
        .slice(0, choiceCount - 1)
    ]);
    return {
      prompt: `Which familiar item is connected with ${current[0]}?`,
      options,
      answer: current[1],
      hint: `Think about music, craft, or celebration from ${current[0]}.`
    };
  }
  if (id === 'market-memory') {
    const foods = {
      Assam: ['tea leaves', 'pitha', 'bamboo shoot'],
      Manipur: ['black rice', 'eromba', 'lotus stem'],
      Meghalaya: ['black sesame', 'bamboo shoot', 'pineapple'],
      Nagaland: ['smoked chilli', 'bamboo shoot', 'fresh greens'],
      Mizoram: ['bai greens', 'bamboo shoot', 'rice'],
      Tripura: ['pineapple', 'berma', 'bamboo shoot'],
      'Arunachal Pradesh': ['thukpa', 'buckwheat', 'bamboo shoot'],
      Sikkim: ['momos', 'cardamom', 'tea leaves']
    };
    const items = foods[profile.region] || foods.Assam;
    const answer = items[round % items.length];
    const options = shuffle([answer, ...['apple', 'bread', 'pasta'].slice(0, choiceCount - 1)]);
    return {
      prompt: `Which item might you recognise at a ${profile.region} market?`,
      options,
      answer,
      hint: 'Think of a familiar ingredient or food from home.'
    };
  }

  const phrases = ['Namaskar', 'Good morning', 'How are you?', 'See you tomorrow'];
  const phrase = phrases[round % phrases.length];
  return {
    prompt: 'Listen to the friendly phrase, then choose what you heard.',
    options: shuffle([phrase, ...phrases.filter((value) => value !== phrase).slice(0, choiceCount - 1)]),
    answer: phrase,
    hint: 'Press “Hear Again” as often as you need.',
    voice: phrase
  };
}
