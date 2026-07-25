import { TACTIC_META } from '../api';

export default function RiskBadge({ score, dominantTactic }) {
  const pct = Math.round((score || 0) * 100);
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? 'High Scam Risk' : score > 0.4 ? 'Moderate Risk' : 'Low Risk';
  const meta = dominantTactic ? TACTIC_META[dominantTactic] : null;

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md max-w-full"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color: color,
      }}
    >
      <span>{label}</span>
      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border)]">
        {pct}%
      </span>

      {meta && (
        <>
          <span className="text-[var(--text-3)] hidden sm:inline">•</span>
          <span className="flex items-center gap-1 font-medium text-[var(--text-2)]">
            <span>Primary:</span>
            <span style={{ color: meta.color }} className="font-semibold">
              {meta.label}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

