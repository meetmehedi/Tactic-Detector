import { TACTIC_META } from '../api';

function TokenHighlight({ token, score }) {
  if (score < 0.2) return <span>{token} </span>;

  const alpha = Math.min(score * 0.7, 0.7);
  // Find the tactic color for the highlight — use red for high-risk tokens
  const bg = score > 0.6
    ? `rgba(239,68,68,${alpha})`
    : score > 0.35
    ? `rgba(245,158,11,${alpha})`
    : `rgba(139,92,246,${alpha * 0.6})`;

  return (
    <span
      className="token-highlight"
      style={{ background: bg }}
      title={`Attribution score: ${score.toFixed(2)}`}
    >
      {token}{' '}
    </span>
  );
}

function TacticBadge({ tactic }) {
  const meta = TACTIC_META[tactic] || TACTIC_META.benign;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export default function TurnAnalysis({ turns, flaggedIds }) {
  const flaggedSet = new Set(flaggedIds || []);

  return (
    <div className="flex flex-col gap-3">
      {turns.map((turn, idx) => {
        const isFlagged = flaggedSet.has(turn.turn_id);
        const isScammer = turn.speaker.toLowerCase().includes('scam') ||
                          turn.speaker === 'A' ||
                          turn.speaker === 'Caller';
        const delay = `${idx * 60}ms`;

        return (
          <div
            key={turn.turn_id}
            className="animate-slide-up glass rounded-xl p-4 transition-all duration-300"
            style={{
              animationDelay: delay,
              borderColor: isFlagged ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)',
              ...(isFlagged && { animation: `pulse-glow 3s ease-in-out infinite, slide-up 0.4s ease ${delay} forwards` }),
            }}
          >
            {/* Speaker + Turn ID */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isScammer ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                    color: isScammer ? '#fca5a5' : '#93c5fd',
                    border: `1px solid ${isScammer ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  }}
                >
                  {turn.speaker[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: isScammer ? '#fca5a5' : '#93c5fd' }}>
                  {turn.speaker}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Turn {turn.turn_id + 1}</span>
              </div>

              {/* Confidence */}
              {isFlagged && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {(turn.confidence * 100).toFixed(0)}% risk
                </span>
              )}
            </div>

            {/* Token-highlighted text */}
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text)', lineHeight: '1.75' }}>
              {turn.highlighted_tokens?.length > 0
                ? turn.highlighted_tokens.map((ht, i) => (
                    <TokenHighlight key={i} token={ht.token} score={ht.score} />
                  ))
                : turn.text}
            </p>

            {/* Tactic badges */}
            {turn.tactics?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {turn.tactics.map(tactic => (
                  <TacticBadge key={tactic} tactic={tactic} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
