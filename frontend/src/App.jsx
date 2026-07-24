import { useState, useCallback } from 'react';
import { analyzeTranscript, analyzeDemo } from './api';
import TranscriptInput from './components/TranscriptInput';
import TurnAnalysis from './components/TurnAnalysis';
import TacticTimeline from './components/TacticTimeline';
import RiskBadge from './components/RiskBadge';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = useCallback(async (turns) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analyzeTranscript(turns);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the backend running?');
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

  const handleReset = () => { setResult(null); setError(''); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div style={{
          position: 'absolute', top: '-20%', left: '30%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
            🛡️ AI-Powered Safety Research Tool
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #e8e8f0 0%, #a78bfa 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Social Engineering Tactic Detector
          </h1>
          <p className="text-base" style={{ color: 'var(--color-muted)' }}>
            Detect manipulation tactics in conversation transcripts using DistilBERT + SHAP explanations
          </p>
        </header>

        {/* Tactic legend */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { label: 'Urgency', color: '#f59e0b', icon: '⏰' },
            { label: 'Authority', color: '#3b82f6', icon: '🎖️' },
            { label: 'Isolation', color: '#8b5cf6', icon: '🔒' },
            { label: 'Reciprocity', color: '#10b981', icon: '🤝' },
            { label: 'Emotional', color: '#ef4444', icon: '💔' },
          ].map(t => (
            <span key={t.label}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
            >
              {t.icon} {t.label}
            </span>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠ {error}
          </div>
        )}

        {!result ? (
          /* Input view */
          <div className="max-w-2xl mx-auto">
            <TranscriptInput onAnalyze={handleAnalyze} onDemo={handleDemo} loading={loading} />
            <p className="text-xs text-center mt-4" style={{ color: 'var(--color-muted)' }}>
              Built with DistilBERT • SHAP explanations • Cialdini taxonomy
            </p>
          </div>
        ) : (
          /* Results view */
          <div className="animate-fade-in">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <RiskBadge score={result.overall_risk_score} dominantTactic={result.dominant_tactic} />
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ← New Analysis
              </button>
            </div>

            {/* Main layout: turns + sidebar */}
            <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 280px' }}>
              {/* Left: turn-by-turn analysis */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
                  Turn-by-Turn Analysis ({result.turns.length} turns)
                </h2>
                <TurnAnalysis turns={result.turns} flaggedIds={result.flagged_turn_ids} />
              </div>

              {/* Right: sidebar */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
                  Risk Overview
                </h2>
                <TacticTimeline result={result} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
