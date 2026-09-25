import React, { useEffect, useState } from 'react';
import { getEngagementAssessment, getStats, getVoiceNotes, wipeVault, logEvent, saveProfile } from '../db/db';
import { GAME_DATA } from '../games/data';
import { getSupportPlan } from '../services/analytics';
import { speakText } from '../services/speech';
import Settings from './Settings';

export default function CaregiverDashboard({ profile, onBack, onProfileUpdated }) {
  const [stats, setStats] = useState({ games: {}, totalPlays: 0, sessions: [] });
  const [assessment, setAssessment] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'settings'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speakingStatus, setSpeakingStatus] = useState('');

  useEffect(() => {
    getStats(profile.id).then(setStats);
    getEngagementAssessment(profile.id).then(setAssessment);
    getVoiceNotes(profile.id).then(setVoiceNotes);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [profile.id]);

  const supportPlan = assessment ? getSupportPlan(assessment) : null;

  async function handleReset() {
    if (window.confirm('Are you sure you want to delete all local CARE profile data, voice notes, and activity history from this device? This cannot be undone.')) {
      await wipeVault();
      window.location.reload();
    }
  }

  function handleSpeakNote(text) {
    speakText(text, profile.language, setSpeakingStatus);
  }

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#14231a] pb-16">
      {/* Caregiver Navigation Header */}
      <header className="bg-[#fffdfa] border-b-4 border-[#d6ccba] sticky top-0 z-20 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">🛡️</span>
              <span className="text-sm font-black tracking-widest text-[#14532d] uppercase">
                Caregiver & Clinical Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#14231a]">
              Care Overview for {profile.name}
            </h1>
            <p className="text-sm text-[#4a584e]">
              Region: <b>{profile.region}</b> • Language: <b>{profile.language}</b>
            </p>
          </div>

          {/* Quick Return to Patient View Button */}
          <button
            onClick={onBack}
            className="btn btn-primary self-start sm:self-center min-h-[60px] px-6 text-lg flex items-center gap-2"
          >
            <span className="text-2xl" aria-hidden="true">🏠</span>
            <span>Return to Patient View</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto flex gap-2 mt-4 pt-3 border-t border-[#e2d9c8] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn py-2 px-5 min-h-[52px] text-base ${
              activeTab === 'overview' ? 'btn-primary' : 'btn-soft'
            }`}
          >
            📊 Activity & Engagement
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`btn py-2 px-5 min-h-[52px] text-base ${
              activeTab === 'notes' ? 'btn-primary' : 'btn-soft'
            }`}
          >
            🎙️ Voice Notes ({voiceNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`btn py-2 px-5 min-h-[52px] text-base ${
              activeTab === 'settings' ? 'btn-primary' : 'btn-soft'
            }`}
          >
            ⚙️ Gateway & Vault Settings
          </button>
        </div>
      </header>

      {/* Main Caregiver Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {speakingStatus && (
          <div className="voice-status" role="status">
            {speakingStatus}
          </div>
        )}

        {/* TAB 1: OVERVIEW & ENGAGEMENT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Offline Sync & Vault Security Status Card */}
            <section className="card p-6 bg-[#fffdfa] border-3 border-[#c8beaa]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-black text-[#14231a] flex items-center gap-2">
                  <span>🔒</span> Offline Vault & Sync Status
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`sync-badge ${
                      isOnline ? 'sync-badge-online' : 'sync-badge-offline'
                    }`}
                  >
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        isOnline ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    />
                    {isOnline ? 'Network Connected' : 'Offline / Standalone Mode'}
                  </span>
                  <span className="sync-badge sync-badge-online">
                    ✓ PWA Cache Active
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#f4ede0] border-2 border-[#ded1be]">
                  <div className="text-sm font-bold text-[#5c4728]">Vault Protection</div>
                  <div className="text-lg font-black text-[#2e210e] mt-1">AES-256-GCM</div>
                  <div className="text-xs text-[#5c4728] mt-1">Encrypted on device</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f4ede0] border-2 border-[#ded1be]">
                  <div className="text-sm font-bold text-[#5c4728]">Local Records</div>
                  <div className="text-lg font-black text-[#2e210e] mt-1">
                    {stats.totalPlays} Sessions • {voiceNotes.length} Voice Notes
                  </div>
                  <div className="text-xs text-[#5c4728] mt-1">Dexie IndexedDB Store</div>
                </div>

                <div className="p-4 rounded-xl bg-[#f4ede0] border-2 border-[#ded1be]">
                  <div className="text-sm font-bold text-[#5c4728]">Data Privacy</div>
                  <div className="text-lg font-black text-[#2e210e] mt-1">Zero Cloud Exfiltration</div>
                  <div className="text-xs text-[#5c4728] mt-1">All data stays in your hands</div>
                </div>
              </div>
            </section>

            {/* Engagement & Support Path Card */}
            <section className="card p-6 bg-[#fffdfa] border-3 border-[#c8beaa]">
              <h2 className="text-2xl font-black text-[#14231a] mb-2">
                Engagement & Routine Check-in
              </h2>
              <p className="text-base text-[#4a584e] mb-4">
                Monitors frequency and comfort to recommend gentle support pacing. This is not a clinical diagnostic score.
              </p>

              {assessment ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="p-4 rounded-2xl bg-[#ecf5ee] border-2 border-[#c2ddc7]">
                      <div className="text-3xl font-black text-[#14532d]">
                        {assessment.recentActivities}
                      </div>
                      <div className="text-sm font-bold text-[#1f4e30] mt-1">
                        activities in 14 days
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fef7ee] border-2 border-[#f5dfb8]">
                      <div className="text-3xl font-black text-[#b45309]">
                        {assessment.activeDays}
                      </div>
                      <div className="text-sm font-bold text-[#78350f] mt-1">
                        active days
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f0f9ff] border-2 border-[#bae6fd]">
                      <div className="text-3xl font-black text-[#0369a1]">
                        {assessment.totalMinutes}
                      </div>
                      <div className="text-sm font-bold text-[#0c4a6e] mt-1">
                        total minutes engaged
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fdf2f8] border-2 border-[#fbcfe8]">
                      <div className="text-3xl font-black text-[#be185d]">
                        {assessment.averageMinutes}m
                      </div>
                      <div className="text-sm font-bold text-[#831843] mt-1">
                        average session length
                      </div>
                    </div>
                  </div>

                  {supportPlan && (
                    <div className="mt-6 rounded-2xl bg-[#f4f8f5] border-3 border-[#14532d] p-5">
                      <div className="inline-block bg-[#14532d] text-white text-xs font-black px-3 py-1 rounded-full uppercase mb-2">
                        {supportPlan.carePath}
                      </div>
                      <h3 className="text-2xl font-black text-[#0e3b20]">
                        {supportPlan.title}
                      </h3>
                      <p className="text-base text-[#1b4329] mt-2 leading-relaxed">
                        {supportPlan.reason}
                      </p>
                      <div className="mt-3 p-3 bg-white rounded-xl border border-[#c2ddc7]">
                        <span className="font-bold text-[#14532d]">Suggested Next Step: </span>
                        <span className="text-[#14231a]">{supportPlan.nextStep}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-lg text-slate-600">Loading engagement metrics…</p>
              )}
            </section>

            {/* Completed Activities Breakdown */}
            <section className="card p-6 bg-[#fffdfa] border-3 border-[#c8beaa]">
              <h2 className="text-2xl font-black text-[#14231a] mb-4">
                Activity Distribution ({stats.totalPlays} total plays)
              </h2>

              {stats.sessions && stats.sessions.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.games).map(([gameId, data]) => {
                    const meta = GAME_DATA[gameId] || { title: gameId, icon: '🎮' };
                    return (
                      <div
                        key={gameId}
                        className="p-4 rounded-xl bg-[#f9f7f2] border-2 border-[#ded8c9] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl" aria-hidden="true">{meta.icon}</span>
                          <div>
                            <div className="font-black text-lg">{meta.title}</div>
                            <div className="text-sm text-[#5a6b5e]">
                              {data.plays} times completed
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block bg-[#14532d] text-white text-sm font-black px-3 py-1 rounded-full">
                            {data.best} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-lg text-slate-500">
                  No activities completed yet. Start with a gentle session on the Patient View.
                </p>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: VOICE NOTES */}
        {activeTab === 'notes' && (
          <section className="card p-6 bg-[#fffdfa] border-3 border-[#c8beaa] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#14231a]">
                  Encrypted Voice Memories Vault
                </h2>
                <p className="text-base text-[#4a584e] mt-1">
                  Transcripts recorded by {profile.name} stored securely on this device.
                </p>
              </div>
              <span className="text-3xl" aria-hidden="true">🎙️</span>
            </div>

            {voiceNotes.length === 0 ? (
              <div className="text-center py-8 bg-[#f7f3ea] rounded-2xl p-6 border-2 border-dashed border-[#c8beaa]">
                <div className="text-5xl mb-2" aria-hidden="true">📝</div>
                <p className="text-xl font-bold text-[#4a584e]">No voice memories recorded yet.</p>
                <p className="text-base text-[#64748b] mt-1">
                  Use "Tell a Story or Memory" on the Patient View to record one.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {voiceNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-5 rounded-2xl bg-[#fcfaf5] border-2 border-[#d6ccba] space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm text-[#64748b]">
                      <span>📅 {new Date(note.createdAt).toLocaleString()}</span>
                      <span className="bg-[#dcfce7] text-[#166534] font-bold px-2 py-0.5 rounded">
                        Encrypted Locally
                      </span>
                    </div>

                    <p className="text-xl font-bold text-[#14231a] leading-relaxed">
                      "{note.text}"
                    </p>

                    <button
                      onClick={() => handleSpeakNote(note.text)}
                      className="btn btn-soft min-h-[50px] py-1 px-4 text-base font-bold flex items-center gap-2"
                    >
                      <span>🔊 Read Aloud</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: SETTINGS & GATEWAY CONFIG */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Settings
              profile={profile}
              onBack={() => setActiveTab('overview')}
              onProfileUpdated={onProfileUpdated}
            />

            {/* Reset / Clear Local Data */}
            <section className="card p-6 bg-[#fffdfa] border-3 border-[#fca5a5] mt-6">
              <h2 className="text-2xl font-black text-[#991b1b]">
                Local Storage & Profile Reset
              </h2>
              <p className="text-base text-[#7f1d1d] mt-2">
                Permanently wipes the encrypted IndexedDB vault, activity records, and regional cache on this device.
              </p>
              <button
                onClick={handleReset}
                className="btn btn-danger min-h-[64px] mt-4 w-full text-lg"
              >
                Delete Profile and Reset CARE Vault
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

