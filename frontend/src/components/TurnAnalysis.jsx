import { useState } from 'react';
import { TACTIC_META } from '../api';

/* ─── Inline style card shell ─── */
const card = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '18px 20px',
  boxSizing: 'border-box',
  width: '100%',
  marginBottom: 0,
};

/* ─── Token Highlight ─── */
function TokenHighlight({ token, score }) {
  const [tip, setTip] = useState(false);
  if (score < 0.2) return <span>{token} </span>;

  const alpha = Math.min(score * 0.7, 0.85);
  const bg = score > 0.65
    ? `rgba(239,68,68,${alpha})`
    : score > 0.4
      ? `rgba(245,158,11,${alpha})`
      : `rgba(139,92,246,${alpha * 0.7})`;

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
        onClick={() => setTip(!tip)}
        style={{
          background: bg, color: score > 0.5 ? '#fff' : '#f3f4f6',
          borderRadius: 4, padding: '1px 5px', cursor: 'pointer',
          transition: 'filter 0.15s', display: 'inline',
        }}
      >
        {token}
      </span>
      {tip && (
        <span style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 6, zIndex: 30, padding: '3px 10px',
          fontSize: 11, fontFamily: 'var(--mono)',
          background: 'var(--surface-3)', color: 'var(--text-1)',
          border: '1px solid var(--border)', borderRadius: 8,
          whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          SHAP: {(score * 100).toFixed(0)}%
        </span>
      )}
      {' '}
    </span>
  );
}

/* ─── Tactic Badge ─── */
function TacticBadge({ tactic }) {
  const meta = TACTIC_META[tactic] || TACTIC_META.benign;
  return (
    <span
      title={meta.desc}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 100,
        fontSize: 11, fontWeight: 600,
        background: meta.bg, color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

export default function TurnAnalysis({ turns, flaggedIds }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedTurn, setExpandedTurn] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  const flaggedSet = new Set(flaggedIds || []);

  const filtered = turns.filter((turn) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!turn.text.toLowerCase().includes(q) && !turn.speaker.toLowerCase().includes(q)) return false;
    }
    if (activeFilter === 'all') return true;
    if (activeFilter === 'flagged') return flaggedSet.has(turn.turn_id);
    return turn.tactics?.includes(activeFilter);
  });

  /* Filter pill style */
  const pill = (active, color) => ({
    padding: '5px 13px', borderRadius: 100, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
    background: active ? (color || 'var(--accent)') : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-2)',
    transition: 'background 0.18s, color 0.18s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>

      {/* ── Filter Bar ── */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {/* Left: Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <button style={pill(activeFilter === 'all')} onClick={() => setActiveFilter('all')}>
            All Turns ({turns.length})
          </button>
          <button style={pill(activeFilter === 'flagged', '#ef4444')} onClick={() => setActiveFilter('flagged')}>
            🚨 Flagged ({flaggedSet.size})
          </button>
          {Object.entries(TACTIC_META).map(([key, meta]) => {
            if (key === 'benign') return null;
            const count = turns.filter((t) => t.tactics?.includes(key)).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  ...pill(activeFilter === key, meta.color),
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
              >
                {meta.icon} {meta.label} <span style={{ opacity: 0.65, fontSize: 10 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Legend + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowLegend(!showLegend)}
            style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
              background: 'var(--surface-2)', color: 'var(--text-2)',
              border: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            💡 Highlight Info
          </button>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '5px 30px 5px 12px', borderRadius: 100, fontSize: 12,
                background: 'var(--surface-2)', color: 'var(--text-1)',
                border: '1px solid var(--border)', outline: 'none', width: 160,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13,
                }}
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend Drawer ── */}
      {showLegend && (
        <div style={{
          ...card,
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          <p style={{ fontWeight: 700, color: 'var(--accent-light)', marginBottom: 8 }}>ℹ️ Token Attribution (SHAP)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontFamily: 'var(--mono)', fontSize: 11 }}>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.5)', color: '#fff', fontWeight: 700 }}>High Risk (&gt;65%)</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.5)', color: '#fff', fontWeight: 700 }}>Medium Risk (40-65%)</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.4)', color: '#e9d5ff' }}>Low Risk (20-40%)</span>
          </div>
        </div>
      )}

      {/* ── Turn List ── */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: 'var(--text-2)', fontSize: 14, padding: 40 }}>
          No turns match the filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((turn, idx) => {
            const isFlagged = flaggedSet.has(turn.turn_id);
            const isScammer = turn.speaker.toLowerCase().includes('scam') || turn.speaker.toLowerCase().includes('caller') || turn.speaker === 'A';
            const isExpanded = expandedTurn === turn.turn_id;
            const speakerColor = isScammer ? '#ef4444' : '#3b82f6';

            return (
              <div
                id={`turn-${turn.turn_id}`}
                key={turn.turn_id}
                style={{
                  ...card,
                  borderColor: isFlagged ? 'rgba(239,68,68,0.3)' : 'var(--border)',
                  background: isFlagged ? 'rgba(239,68,68,0.04)' : 'var(--surface)',
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
                      background: isScammer ? 'rgba(239,68,68,0.18)' : 'rgba(59,130,246,0.18)',
                      color: speakerColor, border: `1px solid ${speakerColor}40`,
                    }}>
                      {turn.speaker[0] || 'U'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: speakerColor }}>{turn.speaker}</span>
                        <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>Turn #{turn.turn_id + 1}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isFlagged && (
                      <span style={{
                        padding: '3px 10px', borderRadius: 100,
                        fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 700,
                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}>
                        {(turn.confidence * 100).toFixed(0)}% risk
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedTurn(isExpanded ? null : turn.turn_id)}
                      style={{
                        padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: 'var(--surface-2)', color: 'var(--text-2)',
                        border: '1px solid var(--border)', cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? 'Hide ▲' : 'Scores ▼'}
                    </button>
                  </div>
                </div>

                {/* Turn Text */}
                <p style={{
                  fontSize: 13, lineHeight: 1.65, color: 'var(--text-1)',
                  marginBottom: 12, wordBreak: 'break-word', overflowWrap: 'anywhere',
                }}>
                  {turn.highlighted_tokens?.length > 0
                    ? turn.highlighted_tokens.map((ht, i) => (
                        <TokenHighlight key={i} token={ht.token} score={ht.score} />
                      ))
                    : turn.text}
                </p>

                {/* Tactic Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  {turn.tactics?.map((tactic) => (
                    <TacticBadge key={tactic} tactic={tactic} />
                  ))}
                </div>

                {/* Scores Drawer */}
                {isExpanded && turn.tactic_scores && (
                  <div style={{
                    marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8,
                  }}>
                    {Object.entries(turn.tactic_scores).map(([tactic, score]) => {
                      const meta = TACTIC_META[tactic] || TACTIC_META.benign;
                      const pct = Math.round(score * 100);
                      return (
                        <div key={tactic} style={{
                          background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
                            <span style={{ color: meta.color, fontWeight: 600 }}>{meta.icon} {meta.label}</span>
                            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-3)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: meta.color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
