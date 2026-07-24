import { TACTIC_META } from '../api';

export default function RiskBadge({ score, dominantTactic }) {
  const pct = Math.round((score || 0) * 100);
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? '🚨 High Scam Risk' : score > 0.4 ? '⚠️ Moderate Risk' : '✅ Low / Benign';
  const meta = dominantTactic ? TACTIC_META[dominantTactic] : null;

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color: color,
        boxShadow: `0 0 20px ${color}15`,
      }}
    >
      <span>{label}</span>
      <span className="font-mono font-extrabold px-1.5 py-0.5 rounded bg-black/40 text-white">
        {pct}%
      </span>

      {meta && (
        <>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <span>Primary:</span>
            <span style={{ color: meta.color }} className="font-semibold">
              {meta.icon} {meta.label}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
