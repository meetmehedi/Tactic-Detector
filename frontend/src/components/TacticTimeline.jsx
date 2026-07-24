import { TACTIC_META } from '../api';

function RiskMeter({ score }) {
  const pct = Math.round(score * 100);
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference * (1 - score);

  const color = score > 0.7 ? '#ef4444' : score > 0.4 ? '#f59e0b' : '#10b981';
  const label = score > 0.7 ? 'High Risk' : score > 0.4 ? 'Moderate' : 'Low Risk';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* Background ring */}
          <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          {/* Foreground ring */}
          <circle
            cx="55" cy="55" r="45" fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            className="risk-ring transition-all duration-1000"
            style={{ '--offset': offset, filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function TacticTimeline({ result }) {
  if (!result) return null;

  const { turns, overall_risk_score, dominant_tactic, flagged_turn_ids } = result;

  // Compute per-tactic counts
  const tacticCounts = {};
  for (const turn of turns) {
    for (const t of (turn.tactics || [])) {
      if (t !== 'benign') tacticCounts[t] = (tacticCounts[t] || 0) + 1;
    }
  }
  const sortedTactics = Object.entries(tacticCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-4">
      {/* Risk Score */}
      <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3 animate-fade-in">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          Overall Risk
        </h3>
        <RiskMeter score={overall_risk_score} />
        <div className="w-full text-center">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {flagged_turn_ids?.length || 0} of {turns.length} turns flagged
          </p>
        </div>
      </div>

      {/* Dominant Tactic */}
      {dominant_tactic && (
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
            Primary Tactic
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TACTIC_META[dominant_tactic]?.icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: TACTIC_META[dominant_tactic]?.color }}>
                {TACTIC_META[dominant_tactic]?.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Most frequent</p>
            </div>
          </div>
        </div>
      )}

      {/* Tactic Distribution */}
      {sortedTactics.length > 0 && (
        <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>
            Tactic Breakdown
          </p>
          <div className="flex flex-col gap-2.5">
            {sortedTactics.map(([tactic, count]) => {
              const meta = TACTIC_META[tactic] || TACTIC_META.benign;
              const barWidth = `${(count / turns.length) * 100}%`;
              return (
                <div key={tactic}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs flex items-center gap-1" style={{ color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{count}x</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: barWidth, background: meta.color, boxShadow: `0 0 6px ${meta.color}66` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Turn timeline dots */}
      <div className="glass rounded-xl p-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>
          Conversation Map
        </p>
        <div className="flex flex-wrap gap-1.5">
          {turns.map((turn, i) => {
            const isFlagged = flagged_turn_ids?.includes(turn.turn_id);
            const mainTactic = turn.tactics?.find(t => t !== 'benign') || 'benign';
            const meta = TACTIC_META[mainTactic];
            return (
              <div
                key={i}
                title={`Turn ${i + 1}: ${turn.speaker} — ${turn.tactics?.join(', ')}`}
                className="w-4 h-4 rounded-sm cursor-pointer transition-transform hover:scale-125"
                style={{
                  background: isFlagged ? meta.color : 'rgba(255,255,255,0.1)',
                  boxShadow: isFlagged ? `0 0 4px ${meta.color}88` : 'none',
                }}
              />
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          Hover a square to see the turn details
        </p>
      </div>
    </div>
  );
}
