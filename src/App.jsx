import React, { useEffect, useState } from 'react';
import { getProfile, getStats, wipeVault } from './db/db';
import { loadCrypto } from './services/crypto';
import Onboarding from './components/Onboarding';
import PatientView from './components/PatientView';
import CaregiverDashboard from './components/CaregiverDashboard';
import VoiceMemory from './components/VoiceMemory';
import Game from './games/Game';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [game, setGame] = useState(null);
  const [viewMode, setViewMode] = useState('patient'); // 'patient' | 'caregiver'
  const [showVoiceMemory, setShowVoiceMemory] = useState(false);
  const [stats, setStats] = useState({ games: {}, totalPlays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'comfort-mode',
      localStorage.getItem('CARE_COMFORT_MODE') !== 'false'
    );
    Promise.all([getProfile(), loadCrypto()])
      .then(([p]) => {
        setProfile(p);
        if (p) {
          getStats(p.id).then(setStats);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Refresh stats when returning to dashboard or game completion
  const refreshStats = (profileId) => {
    if (profileId) {
      getStats(profileId).then(setStats);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf8f2] flex items-center justify-center p-6">
        <div className="card elder-card p-10 text-center max-w-md w-full bg-[#fffdf9] border-4 border-[#14532d]">
          <div className="text-6xl mb-4" aria-hidden="true">🌱</div>
          <h1 className="text-3xl font-black text-[#14532d]">CARE</h1>
          <p className="text-xl text-[#374151] mt-3 font-bold">
            Opening your private CARE vault…
          </p>
          <div className="mt-6 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-[#14532d] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={(p) => { setProfile(p); refreshStats(p.id); }} />;
  }

  // Active Game View
  if (game) {
    return (
      <div className="min-h-screen bg-[#fbf8f2] py-6 px-4">
        <Game
          gameId={game}
          profile={profile}
          onDone={(updatedProfile) => {
            if (updatedProfile) setProfile(updatedProfile);
            refreshStats(profile.id);
            setGame(null);
          }}
          onBack={() => setGame(null)}
        />
      </div>
    );
  }

  // Dedicated Voice Memory Screen
  if (showVoiceMemory) {
    return (
      <div className="min-h-screen bg-[#fbf8f2] py-6 px-4">
        <VoiceMemory
          profile={profile}
          onBack={() => setShowVoiceMemory(false)}
        />
      </div>
    );
  }

  // Caregiver Dashboard View
  if (viewMode === 'caregiver') {
    return (
      <CaregiverDashboard
        profile={profile}
        onBack={() => setViewMode('patient')}
        onProfileUpdated={setProfile}
      />
    );
  }

  // Default Primary Patient View (Zero Cognitive Overload)
  return (
    <PatientView
      profile={profile}
      stats={stats}
      onStartGame={(gameId) => setGame(gameId)}
      onOpenVoiceMemory={() => setShowVoiceMemory(true)}
      onOpenCaregiver={() => setViewMode('caregiver')}
    />
  );
}
