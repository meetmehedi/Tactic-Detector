import { useState } from 'react';
import { TACTIC_META } from '../api';

function TokenHighlight({ token, score }) {
  const [showTooltip, setShowTooltip] = useState(false);
  if (score < 0.2) return <span>{token} </span>;

  const alpha = Math.min(score * 0.7, 0.85);
  const bg =
    score > 0.65
      ? `rgba(239, 68, 68, ${alpha})`
      : score > 0.4
      ? `rgba(245, 158, 11, ${alpha})`
      : `rgba(139, 92, 246, ${alpha * 0.7})`;

  const textColor = score > 0.5 ? '#ffffff' : '#f3f4f6';

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="token-highlight font-medium px-1 rounded transition-all duration-150"
        style={{ background: bg, color: textColor }}
      >
        {token}
      </span>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 px-2 py-1 text-[11px] font-mono rounded bg-slate-900 text-purple-200 border border-purple-500/40 shadow-xl whitespace-nowrap pointer-events-none animate-fade-in">
          SHAP score: {(score * 100).toFixed(0)}%
        </span>
      )}
      {' '}
    </span>
  );
}

function TacticBadge({ tactic }) {
  const meta = TACTIC_META[tactic] || TACTIC_META.benign;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm"
      style={{
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}
      title={meta.desc}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

export default function TurnAnalysis({ turns, flaggedIds }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTurn, setExpandedTurn] = useState(null);

  const flaggedSet = new Set(flaggedIds || []);

  // Filter turns
  const filteredTurns = turns.filter((turn) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = turn.text.toLowerCase().includes(q);
      const speakerMatch = turn.speaker.toLowerCase().includes(q);
      if (!textMatch && !speakerMatch) return false;
    }

    // Tactic category filter
    if (activeFilter === 'all') return true;
    if (activeFilter === 'flagged') return flaggedSet.has(turn.turn_id);
    return turn.tactics?.includes(activeFilter);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Filter & Search Bar */}
      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            All ({turns.length})
          </button>

          <button
            onClick={() => setActiveFilter('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'flagged'
                ? 'bg-red-600/30 text-red-200 border border-red-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
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
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                  activeFilter === key
                    ? 'shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                style={{
                  background: activeFilter === key ? meta.bg : 'transparent',
                  color: activeFilter === key ? meta.color : undefined,
                  border: `1px solid ${activeFilter === key ? meta.color + '60' : 'transparent'}`,
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[180px]">
          <input
            type="text"
            placeholder="Search turns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 focus:border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Turns List */}
      {filteredTurns.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-slate-400 text-sm">
          No turns match the current filter or search criteria.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTurns.map((turn, idx) => {
            const isFlagged = flaggedSet.has(turn.turn_id);
            const isScammer =
              turn.speaker.toLowerCase().includes('scam') ||
              turn.speaker.toLowerCase().includes('caller') ||
              turn.speaker === 'A';
            const isExpanded = expandedTurn === turn.turn_id;

            return (
              <div
                id={`turn-${turn.turn_id}`}
                key={turn.turn_id}
                className={`glass glass-interactive rounded-2xl p-5 transition-all duration-300 ${
                  isFlagged ? 'border-red-900/40 bg-red-950/10' : ''
                }`}
                style={{
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold uppercase shadow-sm"
                      style={{
                        background: isScammer
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(185,28,28,0.2))'
                          : 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(29,78,216,0.2))',
                        color: isScammer ? '#fca5a5' : '#93c5fd',
                        border: `1px solid ${
                          isScammer ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'
                        }`,
                      }}
                    >
                      {turn.speaker[0] || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-sm"
                          style={{ color: isScammer ? '#fca5a5' : '#93c5fd' }}
                        >
                          {turn.speaker}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          Turn #{turn.turn_id + 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFlagged && (
                      <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-red-950/70 text-red-400 border border-red-800/60 shadow-sm">
                        {(turn.confidence * 100).toFixed(0)}% risk
                      </span>
                    )}

                    {/* Expand Scores Button */}
                    <button
                      onClick={() => setExpandedTurn(isExpanded ? null : turn.turn_id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
                      title="View confidence scores per tactic"
                    >
                      {isExpanded ? 'Hide Scores ▲' : 'Scores ▼'}
                    </button>
                  </div>
                </div>

                {/* Text Content with SHAP Token Highlights */}
                <p className="text-sm leading-relaxed text-slate-200 font-normal mb-4">
                  {turn.highlighted_tokens?.length > 0
                    ? turn.highlighted_tokens.map((ht, i) => (
                        <TokenHighlight key={i} token={ht.token} score={ht.score} />
                      ))
                    : turn.text}
                </p>

                {/* Tactic Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/40">
                  {turn.tactics?.map((tactic) => (
                    <TacticBadge key={tactic} tactic={tactic} />
                  ))}
                </div>

                {/* Expandable Per-tactic Scores Drawer */}
                {isExpanded && turn.tactic_scores && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
                    {Object.entries(turn.tactic_scores).map(([tactic, score]) => {
                      const meta = TACTIC_META[tactic] || TACTIC_META.benign;
                      const pct = Math.round(score * 100);
                      return (
                        <div
                          key={tactic}
                          className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex flex-col gap-1"
                        >
                          <div className="flex justify-between items-center text-[11px]">
                            <span style={{ color: meta.color }} className="font-semibold">
                              {meta.icon} {meta.label}
                            </span>
                            <span className="font-mono text-slate-400">{pct}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: meta.color }}
                            />
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
