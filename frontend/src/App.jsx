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

  // Sync theme attribute on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check backend health
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
      setError(err.message || 'Demo failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen relative selection:bg-indigo-500/30">
      {/* Background Glow Mesh (mdmehedihasan.us style) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[140px] opacity-25 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, #818cf8 40%, transparent 75%)',
          }}
        />
      </div>

      {/* Floating Center Navbar (mdmehedihasan.us signature nav-pill) */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="nav-pill">
          {/* Logo / Home */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white hover:bg-white/10 transition-all"
          >
            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px]">
              🛡️
            </span>
            <span className="tracking-tight">TacticDetector</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-[var(--text-2)]">
            <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{apiOnline ? 'Model Online' : 'Local Engine'}</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          {/* Portfolio & GitHub Links */}
          <a
            href="https://mdmehedihasan.us"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-medium px-3 py-1.5 rounded-full text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/10 transition-all"
          >
            Md. Mehedi Hasan
          </a>

          <a
            href="https://github.com/meetmehedi/Tactic-Detector"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-medium px-3 py-1.5 rounded-full text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/10 transition-all"
          >
            GitHub
          </a>

          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="ml-1 p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Research Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 shadow-sm">
            <span>🔬</span> Md. Mehedihasan AI & ML Research Lab
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 gradient-text leading-tight">
            Social Engineering Tactic Detector
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-2)] leading-relaxed font-normal">
            Interpretable multi-label NLP system designed for social engineering classification,
            turn-by-turn conversational analysis, and SHAP token attribution heatmaps.
          </p>

          {/* Taxonomy Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            {Object.entries(TACTIC_META).map(([key, meta]) => {
              if (key === 'benign') return null;
              return (
                <div
                  key={key}
                  className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
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
            <button onClick={() => setError('')} className="text-red-400 hover:text-white font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!result ? (
          /* Input View */
          <div className="max-w-4xl mx-auto animate-fade-in">
            <TranscriptInput onAnalyze={handleAnalyze} onDemo={handleDemo} loading={loading} />

            <footer className="mt-12 text-center text-xs text-[var(--text-3)] font-mono">
              Designed by Md. Mehedi Hasan • DistilBERT Backbone • SHAP Explainability Architecture
            </footer>
          </div>
        ) : (
          /* Results View */
          <div className="animate-fade-in flex flex-col gap-6">
            {/* Top Toolbar */}
            <div className="glass p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <RiskBadge
                score={result.overall_risk_score}
                dominantTactic={result.dominant_tactic}
              />

              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>✏️</span> New Analysis
              </button>
            </div>

            {/* Main Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Turn-by-Turn Analysis (Left Column) */}
              <div className="lg:col-span-8 order-2 lg:order-1 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)] flex items-center gap-2">
                    <span>💬</span> Turn-by-Turn Transcript Analysis ({result.turns.length} turns)
                  </h2>
                  <span className="text-[11px] text-[var(--text-3)] font-mono">
                    {result.flagged_turn_ids?.length || 0} Flagged
                  </span>
                </div>

                <TurnAnalysis turns={result.turns} flaggedIds={result.flagged_turn_ids} />
              </div>

              {/* Sidebar Risk Summary (Right Column) */}
              <div className="lg:col-span-4 order-1 lg:order-2">
                <TacticTimeline result={result} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
