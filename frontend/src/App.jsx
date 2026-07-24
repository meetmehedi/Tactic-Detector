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

  // Check backend health on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.ok)
      .then((ok) => setApiOnline(ok))
      .catch(() => setApiOnline(false));
  }, []);

  const handleAnalyze = useCallback(async (turns) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeTranscript(turns);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend running on port 8000?');
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
    <div className="min-h-screen text-slate-100 selection:bg-purple-500/30">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, #4f46e5 50%, transparent 80%)',
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Top Floating Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg shadow-lg shadow-purple-500/25">
              🛡️
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight gradient-text">
                TacticDetector
              </span>
              <span className="hidden sm:inline-block text-[10px] ml-2 px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 font-mono">
                v1.0 ML
              </span>
            </div>
          </div>

          {/* Right Links & Status */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                apiOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden xs:inline">{apiOnline ? 'API Online' : 'Offline / Local Mock'}</span>
            </div>

            <a
              href="https://github.com/meetmehedi/Tactic-Detector"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Hero Section */}
        <header className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-sm">
            <span>🧠</span> DistilBERT + SHAP Explainability Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 gradient-text leading-tight">
            Social Engineering Tactic Detector
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Analyze multi-turn conversation transcripts to identify manipulation strategies,
            quantify scam risk, and inspect token-level attribution highlights.
          </p>

          {/* Interactive Category Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            {Object.entries(TACTIC_META).map(([key, meta]) => {
              if (key === 'benign') return null;
              return (
                <div
                  key={key}
                  className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.color}40`,
                  }}
                  title={meta.desc}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
              );
            })}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl text-xs sm:text-sm font-medium bg-red-950/50 text-red-300 border border-red-800/60 shadow-lg flex items-center justify-between gap-3 animate-fade-in max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content: Input vs Results */}
        {!result ? (
          /* Input View */
          <div className="max-w-3xl mx-auto animate-fade-in">
            <TranscriptInput onAnalyze={handleAnalyze} onDemo={handleDemo} loading={loading} />

            <footer className="mt-8 text-center text-xs text-slate-500 font-mono">
              Cialdini Manipulation Taxonomy • Multi-label Classification • SHAP Heatmaps
            </footer>
          </div>
        ) : (
          /* Results View (Fully Responsive Grid) */
          <div className="animate-fade-in flex flex-col gap-6">
            {/* Top Toolbar */}
            <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <RiskBadge
                score={result.overall_risk_score}
                dominantTactic={result.dominant_tactic}
              />

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-900/30 hover:bg-purple-800/40 text-purple-200 border border-purple-500/40 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>✏️</span> New Analysis
                </button>
              </div>
            </div>

            {/* Main Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Turn-by-Turn Analysis (Left Column on Desktop, Bottom on Mobile) */}
              <div className="lg:col-span-8 order-2 lg:order-1 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span>💬</span> Turn-by-Turn Analysis ({result.turns.length} turns)
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {result.flagged_turn_ids?.length || 0} Flagged
                  </span>
                </div>

                <TurnAnalysis turns={result.turns} flaggedIds={result.flagged_turn_ids} />
              </div>

              {/* Overview Sidebar (Right Column on Desktop, Top Summary on Mobile) */}
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
