import { useState, useCallback, useEffect } from 'react';
import { analyzeTranscript, analyzeDemo, TACTIC_META } from './api';
import TranscriptInput from './components/TranscriptInput';
import TurnAnalysis from './components/TurnAnalysis';
import TacticTimeline from './components/TacticTimeline';
import RiskBadge from './components/RiskBadge';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiOnline, setApiOnline] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.ok)
      .then((ok) => setApiOnline(ok))
      .catch(() => setApiOnline(false));
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const handleAnalyze = useCallback(async (turns) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeTranscript(turns);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend server running on port 8000?');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDemo = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeDemo();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Demo failed. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="w-full min-h-screen flex flex-col relative selection:bg-indigo-500/30">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[500px] rounded-full blur-[150px] opacity-25 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, #4338ca 50%, transparent 80%)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="nav-fixed">
        <div className="nav-inner">
          {/* Logo */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition-all border-0 bg-transparent cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xs shadow-lg shadow-indigo-500/30">
              🛡️
            </div>
            <span className="font-black text-base tracking-tight text-white">
              Tactic<span className="text-indigo-400 font-normal">Detector</span>
            </span>
          </button>

          {/* Right Nav Options */}
          <div className="flex items-center gap-3">
            {/* Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{apiOnline ? 'Model Online' : 'Local Engine'}</span>
            </div>

            {/* Portfolio Link */}
            <a
              href="https://mdmehedihasan.us"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex text-xs font-medium px-3.5 py-1.5 rounded-full text-[var(--text-2)] hover:text-white hover:bg-white/10 transition-all decoration-0"
            >
              Md. Mehedi Hasan
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/meetmehedi/Tactic-Detector"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white border border-[var(--border)] transition-all flex items-center gap-1.5 decoration-0"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] text-xs transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="widescreen-container relative z-10 flex-1">
        {/* Minimal Hero */}
        <div className="hero-box animate-up">
          <h1 className="hero-title title-gradient">
            Social Engineering Tactic Detector
          </h1>

          <p className="hero-[#desc]">
            Analyze multi-turn conversations to identify manipulation strategies using DistilBERT & SHAP attribution heatmaps.
          </p>

          {/* Tactic Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-5">
            {Object.entries(TACTIC_META).map(([key, meta]) => {
              if (key === 'benign') return null;
              return (
                <div
                  key={key}
                  className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.color}35`,
                  }}
                  title={meta.desc}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl text-xs sm:text-sm font-medium bg-red-950/50 text-red-300 border border-red-800/60 flex items-center justify-between gap-3 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white font-bold bg-transparent border-0 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Content Area */}
        {!result ? (
          /* Input View (Futuristic Widescreen) */
          <div className="input-widescreen animate-up">
            <TranscriptInput onAnalyze={handleAnalyze} onDemo={handleDemo} loading={loading} />

            <footer className="mt-12 text-center text-xs text-[var(--text-3)] font-mono">
              Md. Mehedi Hasan • DistilBERT ML • SHAP Explainability Engine
            </footer>
          </div>
        ) : (
          /* Results View (Futuristic Widescreen Grid) */
          <div className="animate-up flex flex-col gap-6 w-full">
            {/* Top Toolbar */}
            <div className="card-futuristic p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <RiskBadge
                score={result.overall_risk_score}
                dominantTactic={result.dominant_tactic}
              />

              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>✏️</span> New Analysis
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid-widescreen">
              {/* Turn-by-Turn Analysis */}
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-2)] flex items-center gap-2">
                    <span>💬</span> Turn-by-Turn Analysis ({result.turns.length} turns)
                  </h2>
                  <span className="text-[11px] text-[var(--text-3)] font-mono">
                    {result.flagged_turn_ids?.length || 0} Flagged
                  </span>
                </div>

                <TurnAnalysis turns={result.turns} flaggedIds={result.flagged_turn_ids} />
              </div>

              {/* Sidebar Overview */}
              <div className="w-full">
                <TacticTimeline result={result} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
