// API client for Tactic Detector backend

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TACTIC_META = {
  urgency:     { label: 'Urgency',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '⏰' },
  authority:   { label: 'Authority',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '🎖️' },
  isolation:   { label: 'Isolation',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  icon: '🔒' },
  reciprocity: { label: 'Reciprocity',  color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🤝' },
  emotional:   { label: 'Emotional',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '💔' },
  benign:      { label: 'Benign',       color: '#4b5563', bg: 'rgba(75,85,99,0.15)',    icon: '✅' },
};

/**
 * Analyze a conversation transcript
 * @param {Array<{speaker: string, text: string}>} transcript
 * @returns {Promise<object>}
 */
export async function analyzeTranscript(transcript) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Run the built-in demo analysis
 * @returns {Promise<object>}
 */
export async function analyzeDemo() {
  const res = await fetch(`${BASE_URL}/analyze/demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Demo failed');
  return res.json();
}

/**
 * Parse a raw transcript string (one line per turn: "Speaker: text")
 */
export function parseTranscriptText(raw) {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return { speaker: 'Unknown', text: line };
      return {
        speaker: line.slice(0, colonIdx).trim(),
        text: line.slice(colonIdx + 1).trim(),
      };
    });
}
