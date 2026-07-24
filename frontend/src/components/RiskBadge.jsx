import { TACTIC_META } from '../api';

export default function RiskBadge({ score, dominantTactic }) {
  const pct = Math.round((score || 0) * 100);
  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? '🚨 High Risk' : score > 0.4 ? '⚠️ Moderate Risk' : '✅ Low Risk';
  const meta = dominantTactic ? TACTIC_META[dominantTactic] : null;

  return (
    <div
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl font-medium text-sm"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}33`,
        color: color,
      }}
    >
      <span>{label}</span>
      <span className="font-mono font-bold">{pct}%</span>
      {meta && (
        <>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
        </>
      )}
    </div>
  );
}
