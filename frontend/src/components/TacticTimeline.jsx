import { useState } from 'react';
import { TACTIC_META } from '../api';

/* ──────────────────────────────────────────
   Shared inline-style card
────────────────────────────────────────── */
const card = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '20px 22px',
  boxSizing: 'border-box',
  width: '100%',
};

function RiskMeter({ score }) {
  const pct = Math.round(score * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - score);
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? 'High Scam Risk' : score > 0.4 ? 'Moderate Risk' : 'Low / Benign';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="120" height="120" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r="45" fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="55" cy="55" r="45" fill="none"
            stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color}99)`, transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--mono)', color, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginTop: 3 }}>Risk Index</span>
        </div>
      </div>
      <span style={{
        padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        background: `${color}18`, color, border: `1px solid ${color}40`,
      }}>{label}</span>
    </div>
  );
}

export default function TacticTimeline({ result }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const { turns, overall_risk_score, dominant_tactic, flagged_turn_ids } = result;

  const tacticCounts = {};
  for (const turn of turns) {
    for (const t of turn.tactics || []) {
      if (t !== 'benign') tacticCounts[t] = (tacticCounts[t] || 0) + 1;
    }
  }
  const sortedTactics = Object.entries(tacticCounts).sort((a, b) => b[1] - a[1]);

  function handleScrollToTurn(turnId) {
    document.getElementById(`turn-${turnId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactic_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const label = (txt) => (
    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 14 }}>{txt}</p>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 84 }}>

      {/* ── Overall Risk ── */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        {label('Overall Risk Assessment')}
        <RiskMeter score={overall_risk_score} />
        <div style={{
          width: '100%', paddingTop: 14, marginTop: 4,
          borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: 'var(--text-2)',
        }}>
          <span>Flagged Turns:</span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#ef4444' }}>
            {flagged_turn_ids?.length || 0} / {turns.length}
          </span>
        </div>
      </div>

      {/* ── Dominant Tactic ── */}
      {dominant_tactic && (() => {
        const meta = TACTIC_META[dominant_tactic];
        return (
          <div style={card}>
            {label('Dominant Manipulation Strategy')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 28, padding: '8px 10px', borderRadius: 12,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }}>{meta?.icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: meta?.color }}>{meta?.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, lineClamp: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 220 }}>{meta?.desc}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Frequency Breakdown ── */}
      {sortedTactics.length > 0 && (
        <div style={card}>
          {label('Strategy Frequency Breakdown')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedTactics.map(([tactic, count]) => {
              const meta = TACTIC_META[tactic] || TACTIC_META.benign;
              const pct = Math.round((count / turns.length) * 100);
              return (
                <div key={tactic}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: meta.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)', fontSize: 11 }}>
                      {count} turns ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${pct}%`, background: meta.color,
                      boxShadow: `0 0 8px ${meta.color}88`,
                      transition: 'width 0.7s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Turn Map ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {label('Interactive Turn Map')}
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginTop: -12 }}>Click to jump</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
          {turns.map((turn, i) => {
            const isFlagged = flagged_turn_ids?.includes(turn.turn_id);
            const mainTactic = turn.tactics?.find((t) => t !== 'benign') || 'benign';
            const meta = TACTIC_META[mainTactic];
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleScrollToTurn(turn.turn_id)}
                title={`Turn #${i + 1} (${turn.speaker}): ${turn.tactics?.join(', ')}`}
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
                  background: isFlagged ? meta.color : 'var(--surface-2)',
                  color: isFlagged ? '#fff' : 'var(--text-3)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: isFlagged ? `0 0 6px ${meta.color}99` : 'none',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.25)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Export Buttons ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--text-1)',
            border: '1px solid var(--border)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✅ Copied!' : '📋 Copy Data'}
        </button>
        <button
          onClick={handleDownload}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--text-1)',
            border: '1px solid var(--border)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.2s',
          }}
        >
          📥 Export JSON
        </button>
      </div>
    </div>
  );
}
