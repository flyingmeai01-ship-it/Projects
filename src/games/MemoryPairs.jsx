import React, { useEffect, useMemo, useState } from 'react';
import { logEvent, saveSession } from '../db/db';
import { REGION_VISUALS } from './data';

const card = (icon, label, detail, theme) => ({ icon, label, detail, theme });

const REGIONAL_CARDS = {
  Assam: [
    card('🌾', 'Paddy field', 'Rice cultivation shapes many seasonal routines.', 'farm'),
    card('🍵', 'Tea garden', 'Tea gardens are part of Assam’s working landscape.', 'livelihood'),
    card('🪈', 'Pepa', 'The pepa is a familiar musical instrument heard during Bihu celebrations.', 'music'),
    card('🧣', 'Gamosa weave', 'A gamosa is a handwoven textile with many everyday and ceremonial uses.', 'craft'),
    card('🐬', 'River dolphin', 'The Brahmaputra is home to the endangered Gangetic river dolphin.', 'nature'),
    card('🛶', 'Brahmaputra boat', 'Rivers and ferries connect many communities across Assam.', 'place'),
    card('🌸', 'Bihu gathering', 'Bihu is celebrated through music, dance and community gathering.', 'festival'),
    card('🧺', 'Bamboo basket', 'Bamboo craft supports many daily tasks, including farming and markets.', 'craft')
  ],
  Manipur: [
    card('🛶', 'Loktak Lake boat', 'Loktak is known for its water routes and floating vegetation, called phumdi.', 'place'),
    card('🦌', 'Sangai deer', 'The Sangai is associated with the wetland landscape around Keibul Lamjao.', 'nature'),
    card('🌺', 'Shirui lily', 'The Shirui lily is Manipur’s state flower, seen in the Shirui hills.', 'nature'),
    card('🧺', 'Kauna basket', 'Kauna reed craft includes baskets and useful household items.', 'craft'),
    card('🧶', 'Handloom weave', 'Handloom and weaving are important expressions of skill and identity.', 'craft'),
    card('🎵', 'Pena music', 'The pena is a traditional string instrument of Manipur.', 'music'),
    card('🌾', 'Paddy field', 'Paddy fields are part of the valley’s familiar seasonal landscape.', 'farm'),
    card('🥬', 'Lotus stem', 'Lotus stem is a familiar ingredient in Manipuri food traditions.', 'food')
  ],
  Meghalaya: [
    card('🌉', 'Living root bridge', 'Some communities guide living roots over many years to form bridges.', 'place'),
    card('🥁', 'Wangala drum', 'Wangala is a harvest festival associated with Garo communities.', 'festival'),
    card('🍍', 'Pineapple', 'Pineapple is a familiar crop in many hill areas.', 'farm'),
    card('🌧️', 'Monsoon rain', 'Meghalaya’s rain shapes forests, farms and everyday travel.', 'nature'),
    card('🪨', 'Balancing rock', 'Rock landscapes are a familiar part of the Khasi and Jaintia hills.', 'place'),
    card('🧺', 'Cane basket', 'Cane and bamboo are used for durable everyday crafts.', 'craft'),
    card('🌿', 'Forest garden', 'Home gardens and forest plants support food and local knowledge.', 'farm'),
    card('🎶', 'Community song', 'Music and gathering can keep stories and languages close.', 'music')
  ],
  Nagaland: [
    card('🧣', 'Handwoven shawl', 'Weaving traditions vary across Nagaland’s many communities.', 'craft'),
    card('🥁', 'Log drum', 'Log drums are associated with community music in some Naga traditions.', 'music'),
    card('🌾', 'Terrace field', 'Terraced farming is familiar across many hill landscapes.', 'farm'),
    card('🌶️', 'Smoked chilli', 'Smoked and fermented foods are part of many Naga kitchens.', 'food'),
    card('🎉', 'Hornbill Festival', 'The festival brings together diverse cultural expressions from across Nagaland.', 'festival'),
    card('🌿', 'Bamboo craft', 'Bamboo is shaped into useful household and farming items.', 'craft'),
    card('⛰️', 'Dzukou valley', 'The valley is known for its seasonal flowers and hill landscape.', 'place'),
    card('🧺', 'Market basket', 'Markets connect growers, craft workers and neighbours.', 'livelihood')
  ],
  Mizoram: [
    card('🎋', 'Bamboo dance', 'Bamboo is central to many practical crafts and performances.', 'music'),
    card('🥬', 'Bai greens', 'Bai is a familiar Mizo dish made with greens and other ingredients.', 'food'),
    card('🌾', 'Hill farm', 'Farming seasons shape family routines in many hill communities.', 'farm'),
    card('🧺', 'Bamboo basket', 'Bamboo baskets can be used for carrying, storing and sharing.', 'craft'),
    card('🎉', 'Chapchar Kut', 'Chapchar Kut is a spring festival celebrated in Mizoram.', 'festival'),
    card('⛰️', 'Mizo hills', 'Hills and valleys are part of Mizoram’s everyday landscape.', 'place'),
    card('🧶', 'Handloom cloth', 'Weaving carries colour, skill and community knowledge.', 'craft'),
    card('🎶', 'Community song', 'Songs can hold stories, language and shared memories.', 'music')
  ],
  Tripura: [
    card('🧺', 'Bamboo basket', 'Bamboo and cane craft are widely used in daily life.', 'craft'),
    card('🎉', 'Garia celebration', 'Garia Puja is observed by many Indigenous communities in Tripura.', 'festival'),
    card('🍍', 'Pineapple', 'Pineapple is an important fruit crop in Tripura.', 'farm'),
    card('🌾', 'Paddy field', 'Rice farming is part of many familiar rural routines.', 'farm'),
    card('🪡', 'Risa weave', 'Risa is a handwoven cloth in Tripuri textile traditions.', 'craft'),
    card('🐟', 'Fish market', 'Fish and market visits can be familiar community moments.', 'food'),
    card('🌿', 'Jhum garden', 'Jhum cultivation is practiced by some hill communities.', 'farm'),
    card('🎶', 'Folk music', 'Music and dance are shared through many community occasions.', 'music')
  ],
  'Arunachal Pradesh': [
    card('🏔️', 'Eastern Himalayan hills', 'Mountain paths, forests and rivers shape many local landscapes.', 'place'),
    card('🥣', 'Thukpa bowl', 'Thukpa is a familiar noodle soup in several Himalayan food traditions.', 'food'),
    card('🧶', 'Handwoven cloth', 'Textile traditions differ across Arunachal Pradesh’s many communities.', 'craft'),
    card('🌿', 'Orange orchard', 'Oranges and other crops are grown in different valleys.', 'farm'),
    card('🎋', 'Bamboo craft', 'Bamboo supports useful tools, baskets and household work.', 'craft'),
    card('🌾', 'Millet harvest', 'Millet is grown and prepared in several communities.', 'farm'),
    card('🌊', 'Siang River', 'The Siang is one of the major rivers shaping the region.', 'place'),
    card('🎶', 'Community song', 'Oral traditions help carry stories across generations.', 'music')
  ],
  Sikkim: [
    card('🌿', 'Cardamom pods', 'Large cardamom is an important crop in Sikkim.', 'farm'),
    card('🥟', 'Momo plate', 'Momos are a familiar shared food in Himalayan communities.', 'food'),
    card('🏔️', 'Kanchenjunga view', 'Kanchenjunga is a central part of Sikkim’s mountain landscape.', 'place'),
    card('🍵', 'Tea garden', 'Tea-growing areas are part of Sikkim’s agricultural life.', 'farm'),
    card('🧶', 'Handwoven cloth', 'Weaving and handcraft reflect diverse community traditions.', 'craft'),
    card('🌼', 'Rhododendron', 'Rhododendrons are familiar seasonal flowers in Himalayan landscapes.', 'nature'),
    card('🧺', 'Market basket', 'Markets are places to share food, produce and conversation.', 'livelihood'),
    card('🎶', 'Community song', 'Music can bring families and neighbours together.', 'music')
  ]
};

const SHARED_CARDS = [
  card('👨‍👩‍👧‍👦', 'Family gathering', 'A familiar visit can be a good time for stories and shared memories.', 'family'),
  card('🧑‍🌾', 'Farmer', 'Farming knowledge is often shared through generations.', 'farm'),
  card('🫖', 'Tea together', 'A warm drink can make conversation feel easier.', 'family'),
  card('🌄', 'Northeast sunrise', 'Hills, rivers and fields change beautifully through the day.', 'place')
];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

// Gentle progression for dementia: 2 pairs at level 1, max 4 pairs
function pairsForLevel(level) {
  return Math.min(2 + Math.floor((level - 1) / 3), 4);
}

export default function MemoryPairs({ profile, onDone, onBack }) {
  const [level, setLevel] = useState(1);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [lastMatch, setLastMatch] = useState(null);
  const [startedAt] = useState(Date.now());

  const cards = useMemo(() => {
    const source = [...(REGIONAL_CARDS[profile.region] || []), ...SHARED_CARDS];
    const selected = shuffle(source).slice(0, pairsForLevel(level));
    return shuffle(
      selected.flatMap((item, index) => [
        { id: `${level}-${index}-a`, pair: index, ...item },
        { id: `${level}-${index}-b`, pair: index, ...item }
      ])
    );
  }, [level, profile.region]);

  useEffect(() => {
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setLastMatch(null);
    logEvent(profile.id, 'memory_pairs_level_start', { level, region: profile.region });
  }, [level, profile.id, profile.region]);

  const complete = matched.length === cards.length / 2;

  function select(card) {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.pair) || complete)
      return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length !== 2) return;

    setMoves((value) => value + 1);
    const [firstId, secondId] = next;
    const first = cards.find((item) => item.id === firstId);
    const second = cards.find((item) => item.id === secondId);

    if (first.pair === second.pair) {
      window.setTimeout(() => {
        setMatched((value) => [...value, first.pair]);
        setLastMatch(first);
        setFlipped([]);
      }, 500);
    } else {
      window.setTimeout(() => setFlipped([]), 1200);
    }
  }

  async function nextLevel() {
    await logEvent(profile.id, 'memory_pairs_level_complete', { level, moves });
    if (level < 5) {
      setLevel((value) => value + 1);
      return;
    }
    await saveSession({
      profileId: profile.id,
      gameId: 'memory-pairs',
      score: 100,
      correct: level,
      rounds: level,
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
    });
    onDone(profile);
  }

  return (
    <main className="card elder-card p-6 sm:p-10 max-w-3xl mx-auto bg-[#fffdf9] border-4 border-[#14532d] shadow-xl space-y-6">
      {/* Return button */}
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
            <span className="text-4xl sm:text-5xl" aria-hidden="true">🃏</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#14532d]">
                Northeast Memory Pairs
              </h1>
              <p className="text-base text-[#4a584e]">
                Turn over two cards to find a pair. Take all the time you need.
              </p>
            </div>
          </div>
          <div className="game-region-strip mt-3">
            <span aria-hidden="true">{REGION_VISUALS[profile.region]}</span>
            <span>{profile.region} Memories</span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ecfdf5] border-2 border-[#a7f3d0] px-4 py-2 text-center self-start sm:self-center">
          <div className="text-xs font-bold text-[#065f46] uppercase">Round</div>
          <div className="text-xl font-black text-[#047857]">
            {level} of 5
          </div>
        </div>
      </header>

      {/* Cards Grid (Generous sizes, 2 to 4 pairs max) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {cards.map((item) => {
          const shown = flipped.includes(item.id) || matched.includes(item.pair);
          return (
            <button
              key={item.id}
              onClick={() => select(item)}
              aria-label={shown ? `${item.label}: ${item.detail}` : 'Turn over a memory card'}
              className={`memory-card min-h-[160px] ${
                shown ? 'memory-card-open' : 'memory-card-closed'
              }`}
            >
              <span className="text-5xl" aria-hidden="true">
                {shown ? item.icon : '🌱'}
              </span>
              {shown && (
                <>
                  <span className="block text-base font-black mt-2 text-[#14231a]">
                    {item.label}
                  </span>
                  <span className="memory-card-tag">{item.theme}</span>
                </>
              )}
            </button>
          );
        })}
      </section>

      {/* Memory Reminiscence Story Box */}
      {lastMatch && (
        <aside className="memory-story" role="status">
          <div className="flex items-center gap-2 text-xl font-black">
            <span>✨</span>
            <span>{lastMatch.label}</span>
          </div>
          <p className="mt-2 text-lg leading-relaxed">{lastMatch.detail}</p>
          <div className="mt-3 p-3 bg-white/70 rounded-xl border border-[#d97706]/40 text-base font-bold text-[#78350f]">
            💬 <b>Talk together:</b> Does this remind you of a familiar season, festival, person, or home recipe?
          </div>
        </aside>
      )}

      {/* Level Completion Banner */}
      {complete && (
        <section className="voice-status text-center p-6 space-y-4">
          <div className="text-4xl" aria-hidden="true">🌸</div>
          <p className="text-2xl font-black">
            Wonderful Matching!
          </p>
          <p className="text-lg">
            You completed this gentle round in {moves} turns.
          </p>
          <button
            className="btn btn-primary w-full text-xl min-h-[68px]"
            onClick={nextLevel}
          >
            {level === 5 ? 'Complete Activity' : 'Continue to Next Round'}
          </button>
        </section>
      )}

      <footer className="text-center text-sm font-bold text-[#64748b]">
        These cards celebrate everyday life in the North East. Enjoy the moment at your own pace.
      </footer>
    </main>
  );
}
