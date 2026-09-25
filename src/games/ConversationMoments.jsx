import React, { useEffect, useMemo, useState } from 'react';
import { logEvent, saveSession } from '../db/db';
import { REGION_VISUALS } from './data';

const REGION_MEMORIES = {
  Assam: {
    place: 'the Brahmaputra river or a tea garden in the morning',
    season: 'Bihu celebration time or the rice harvest season',
    craft: 'a warm gamosa weave or a bamboo basket',
    food: 'hot tea, pitha, or a visit to the local market'
  },
  Manipur: {
    place: 'Loktak Lake or the peaceful Imphal valley',
    season: 'the fresh rainy season or a festival day',
    craft: 'handloom weaving or kauna-reed craft',
    food: 'a family meal or fresh market vegetables'
  },
  Meghalaya: {
    place: 'a quiet hill path, pine forest, or living root bridge',
    season: 'the monsoon clouds or harvest time',
    craft: 'cane or bamboo basket work',
    food: 'fresh pineapple, garden vegetables, or a market visit'
  },
  Nagaland: {
    place: 'a village hill path or terraced field',
    season: 'harvest time or a community feast',
    craft: 'a handwoven shawl or bamboo craft',
    food: 'a warm kitchen smell or a market visit'
  },
  Mizoram: {
    place: 'a misty hill view or village path',
    season: 'spring flowers or a community festival',
    craft: 'bamboo work or handloom cloth',
    food: 'a shared family meal or fresh greens'
  },
  Tripura: {
    place: 'a home garden, paddy field, or village market',
    season: 'sweet pineapple season or celebration day',
    craft: 'risa weaving or bamboo craft',
    food: 'fresh fruit, fish, or a shared family meal'
  },
  'Arunachal Pradesh': {
    place: 'a mountain path or river valley',
    season: 'a harvest day or changing mountain weather',
    craft: 'a warm woven cloth or bamboo basket',
    food: 'a warm bowl of thukpa or fresh garden produce'
  },
  Sikkim: {
    place: 'a view of Kanchenjunga or a garden path',
    season: 'rhododendron season or cardamom harvest',
    craft: 'handwoven cloth or a market basket',
    food: 'warm momos, tea, or a family gathering'
  }
};

const GARDEN_STEPS = [
  'Choose one seed or plant to talk about.',
  'Think about gentle rain, sunshine, or morning water.',
  'Choose a woven basket, leaf, or vegetable you recognise.',
  'Share a familiar smell, colour, or sound from outdoors.',
  'Think of someone who enjoyed growing or cooking food.',
  'Finish with one thing that feels comforting today.'
];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function ConversationMoments({ gameId, profile, onDone, onBack }) {
  const isGarden = gameId === 'garden-moments';
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [startedAt] = useState(Date.now());

  const prompts = useMemo(() => {
    const local = REGION_MEMORIES[profile.region] || REGION_MEMORIES.Assam;
    return isGarden
      ? GARDEN_STEPS.map((text, index) => ({
          title: [
            'Seed and plant',
            'Weather memory',
            'Harvest basket',
            'Outdoor senses',
            'People together',
            'A calm finish'
          ][index],
          text,
          choices: shuffle(['🌱 A garden memory', '🧺 A market memory', '🍲 A kitchen memory']).slice(
            0,
            2
          )
        }))
      : [
          {
            title: 'A place from home',
            text: `Would you like to talk about ${local.place}?`,
            choices: ['🌄 A place I remember', '👂 I would rather listen']
          },
          {
            title: 'A familiar season',
            text: `Does ${local.season} bring a sound, colour, or person to mind?`,
            choices: ['🌦️ A season memory', '🤝 A person I remember']
          },
          {
            title: 'A skill or craft',
            text: `Would you like to share a thought about ${local.craft}?`,
            choices: ['🧶 A craft I remember', '👀 I would rather look']
          },
          {
            title: 'Food and togetherness',
            text: `Does ${local.food} bring a gentle memory?`,
            choices: ['🍽️ A food memory', '💚 Just sit together']
          },
          {
            title: 'A favourite sound',
            text: 'Would you like to think of a song, bird, river, or familiar voice?',
            choices: ['🎶 A sound I remember', '🌿 A quiet moment']
          },
          {
            title: 'One good thing',
            text: 'What feels comforting today: a person, place, food, or small routine?',
            choices: ['✨ Something comforting', '🤝 A shared moment']
          }
        ];
  }, [isGarden, profile.region]);

  const current = prompts[step];

  useEffect(() => {
    logEvent(profile.id, 'conversation_moment_start', { gameId, region: profile.region });
  }, [gameId, profile.id, profile.region]);

  async function continueMoment(choice) {
    setChosen(choice);
    await logEvent(profile.id, 'conversation_moment_choice', { gameId, step, choice });
    window.setTimeout(async () => {
      if (step + 1 < prompts.length) {
        setStep((value) => value + 1);
        setChosen(null);
        return;
      }
      await saveSession({
        profileId: profile.id,
        gameId,
        score: 0,
        correct: 0,
        rounds: prompts.length,
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      });
      onDone(profile);
    }, 800);
  }

  return (
    <main className="card elder-card p-6 sm:p-10 max-w-2xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
      <button
        onClick={onBack}
        className="btn btn-soft min-h-[56px] px-4 text-lg font-black flex items-center gap-2"
      >
        <span className="text-2xl" aria-hidden="true">⬅️</span>
        <span>Back to Activities</span>
      </button>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#e2d9c8] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl" aria-hidden="true">
              {isGarden ? '🌱' : '💬'}
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#14532d]">
                {isGarden ? 'Garden & Market Moments' : 'Stories from Home'}
              </h1>
              <p className="text-base text-[#4a584e]">
                No right or wrong answers. Choose what feels comfortable.
              </p>
            </div>
          </div>
          <div className="game-region-strip mt-3">
            <span aria-hidden="true">{REGION_VISUALS[profile.region]}</span>
            <span>{profile.region} Memories</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ecfdf5] border-2 border-[#a7f3d0] px-4 py-2 text-center self-start sm:self-center">
          <div className="text-xs font-bold text-[#065f46] uppercase">Moment</div>
          <div className="text-xl font-black text-[#047857]">
            {step + 1} of {prompts.length}
          </div>
        </div>
      </header>

      <section className="rounded-2xl bg-[#fefbf2] border-3 border-[#e5d5b5] p-6 space-y-3">
        <p className="text-sm font-black tracking-wider text-[#b45309] uppercase">
          {current.title}
        </p>
        <p className="text-2xl sm:text-3xl font-black leading-snug text-[#14231a]">
          {current.text}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 pt-2">
        {current.choices.map((choice) => (
          <button
            key={choice}
            disabled={Boolean(chosen)}
            onClick={() => continueMoment(choice)}
            className={`game-choice text-left min-h-[84px] text-xl sm:text-2xl font-black ${
              chosen === choice
                ? 'bg-[#d1fae5] border-[#059669] text-[#064e3b]'
                : 'bg-white'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>

      <div className="companion-note mt-4">
        <b>Companion tip:</b> Take your time, listen with a smile, and follow their rhythm. It is completely okay to simply sit quietly together.
      </div>
    </main>
  );
}
