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
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background glow — only on input view */}
      {!result && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-160px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '480px',
            borderRadius: '50%',
            filter: 'blur(130px)',
            opacity: 0.18,
            background: 'radial-gradient(circle, #6366f1 0%, #4338ca 50%, transparent 80%)',
          }} />
        </div>
      )}

      {/* ── NAVBAR ── */}
      <header className="nav-fixed">
        <div className="nav-inner">
          {/* Logo */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}>
              <svg style={{ width: 16, height: 16, stroke: '#fff' }} viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              Tactic<span style={{ color: 'var(--accent)', fontWeight: 600 }}>Detector</span>
            </span>
          </button>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 100,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: apiOnline ? '#10b981' : '#f59e0b',
                display: 'inline-block',
              }} />
              <span className="hidden sm:inline">{apiOnline ? 'Model Online' : 'Local Engine'}</span>
            </div>

            {/* Portfolio */}
            <a
              href="https://mdmehedihasan.us"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'none',
                fontSize: 12, fontWeight: 500, padding: '6px 14px',
                borderRadius: 100, color: 'var(--text-2)',
                textDecoration: 'none', border: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
              className="sm:inline-flex"
            >
              Md. Mehedi Hasan
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/meetmehedi/Tactic-Detector"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, padding: '6px 14px',
                borderRadius: 100, color: 'var(--text-1)',
                textDecoration: 'none', border: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}
            >
              <svg style={{ width: 14, height: 14, fill: 'currentColor' }} viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                padding: '6px 10px', borderRadius: 100, fontSize: 13, cursor: 'pointer',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-1)',
              }}
            >
              {theme === 'dark' ? (
                <svg style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor' }} viewBox="0 0 24 24" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              ) : (
                <svg style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor' }} viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="widescreen-container" style={{ flex: 1, position: 'relative', zIndex: 1 }}>

        {/* ── INPUT VIEW ── */}
        {!result && (
          <div className="animate-up">
            {/* Hero */}
            <div className="hero-box">
              <h1 className="hero-title title-gradient">Social Engineering<br />Tactic Detector</h1>
              <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
                Detect manipulation tactics in conversations.
              </p>
              {/* Tactic pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {Object.entries(TACTIC_META).map(([key, meta]) => {
                  if (key === 'benign') return null;
                  return (
                    <span
                      key={key}
                      title={meta.desc}
                      style={{
                        padding: '4px 12px', borderRadius: 100, fontSize: 12,
                        fontWeight: 600, background: meta.bg, color: meta.color,
                        border: `1px solid ${meta.color}35`,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700 }}>[{meta.code}]</span> {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                maxWidth: 700, margin: '0 auto 24px',
                padding: '12px 16px', borderRadius: 14,
                background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                fontSize: 13,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span>{error}</span>
                </div>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            )}

            {/* Input Card */}
            <div className="input-widescreen">
              <TranscriptInput onAnalyze={handleAnalyze} onDemo={handleDemo} loading={loading} />
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: 24 }}>
                Developed by Md. Mehedi Hasan
              </p>
            </div>
          </div>
        )}

        {/* ── RESULTS VIEW ── */}
        {result && (
          <div className="animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

            {/* Results Toolbar */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12, width: '100%', boxSizing: 'border-box',
            }}>
              <RiskBadge score={result.overall_risk_score} dominantTactic={result.dominant_tactic} />
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 20px', borderRadius: 100,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                New Analysis
              </button>
            </div>

            {/* Grid: Turns + Sidebar */}
            <div className="grid-widescreen">
              {/* Left: Turn-by-Turn */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                    Turn-by-Turn Analysis ({result.turns.length} turns)
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                    {result.flagged_turn_ids?.length || 0} Flagged
                  </span>
                </div>
                <TurnAnalysis turns={result.turns} flaggedIds={result.flagged_turn_ids} />
              </div>

              {/* Right: Sidebar */}
              <div style={{ minWidth: 0 }}>
                <TacticTimeline result={result} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
