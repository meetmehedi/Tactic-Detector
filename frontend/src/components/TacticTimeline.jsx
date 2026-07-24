import { useState } from 'react';
import { TACTIC_META } from '../api';

function RiskMeter({ score }) {
  const pct = Math.round(score * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - score);

  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? 'High Scam Risk' : score > 0.4 ? 'Moderate Risk' : 'Low / Benign';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 110 110" className="transform -rotate-90">
          <circle
            cx="55"
            cy="55"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="9"
          />
          <circle
            cx="55"
            cy="55"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="risk-ring transition-all duration-1000"
            style={{
              '--offset': offset,
              filter: `drop-shadow(0 0 10px ${color}88)`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold font-mono tracking-tight" style={{ color }}>
            {pct}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
            Risk Index
          </span>
        </div>
      </div>

      <div
        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
        style={{
          background: `${color}18`,
          color: color,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function TacticTimeline({ result }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const { turns, overall_risk_score, dominant_tactic, flagged_turn_ids } = result;

  // Compute per-tactic counts
  const tacticCounts = {};
  for (const turn of turns) {
    for (const t of turn.tactics || []) {
      if (t !== 'benign') tacticCounts[t] = (tacticCounts[t] || 0) + 1;
    }
  }
  const sortedTactics = Object.entries(tacticCounts).sort((a, b) => b[1] - a[1]);

  function handleScrollToTurn(turnId) {
    const el = document.getElementById(`turn-${turnId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleCopyJSON() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJSON() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactic_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5 sticky top-24">
      {/* Overall Risk Score Card */}
      <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Overall Risk Assessment
        </h3>
        <RiskMeter score={overall_risk_score} />
        <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Flagged Turns:</span>
          <span className="font-mono font-bold text-red-400">
            {flagged_turn_ids?.length || 0} / {turns.length}
          </span>
        </div>
      </div>

      {/* Primary Tactic Card */}
      {dominant_tactic && (
        <div className="glass rounded-2xl p-5 animate-fade-in shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Dominant Manipulation Strategy
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800">
              {TACTIC_META[dominant_tactic]?.icon}
            </span>
            <div>
              <p
                className="font-bold text-base"
                style={{ color: TACTIC_META[dominant_tactic]?.color }}
              >
                {TACTIC_META[dominant_tactic]?.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {TACTIC_META[dominant_tactic]?.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tactic Breakdown Progress Bars */}
      {sortedTactics.length > 0 && (
        <div className="glass rounded-2xl p-5 shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Strategy Frequency Breakdown
          </p>
          <div className="flex flex-col gap-3">
            {sortedTactics.map(([tactic, count]) => {
              const meta = TACTIC_META[tactic] || TACTIC_META.benign;
              const barWidth = `${(count / turns.length) * 100}%`;
              return (
                <div key={tactic} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 font-semibold" style={{ color: meta.color }}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="font-mono text-slate-400">{count} turns ({Math.round((count/turns.length)*100)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: barWidth,
                        background: meta.color,
                        boxShadow: `0 0 8px ${meta.color}88`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Conversation Map */}
      <div className="glass rounded-2xl p-5 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Interactive Turn Map
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Click to jump</span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
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
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-125 hover:z-20 cursor-pointer"
                style={{
                  background: isFlagged ? meta.color : 'rgba(255,255,255,0.08)',
                  color: isFlagged ? '#000' : '#888',
                  boxShadow: isFlagged ? `0 0 6px ${meta.color}99` : 'none',
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyJSON}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy Data'}</span>
        </button>

        <button
          onClick={handleDownloadJSON}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all flex items-center justify-center gap-1.5"
        >
          <span>📥</span>
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
}
