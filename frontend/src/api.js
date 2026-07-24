// API client for Tactic Detector backend

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TACTIC_META = {
  urgency: {
    label: 'Urgency',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    icon: '⏰',
    desc: 'Artificial time pressure or deadline to force immediate action',
  },
  authority: {
    label: 'Authority',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    icon: '🎖️',
    desc: 'Impersonates trusted officials, banks, or law enforcement',
  },
  isolation: {
    label: 'Isolation',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    icon: '🔒',
    desc: 'Discourages victim from consulting friends, family, or experts',
  },
  reciprocity: {
    label: 'Reciprocity',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    icon: '🤝',
    desc: 'Leverages past favors or emotional obligations to extract compliance',
  },
  emotional: {
    label: 'Emotional',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    icon: '💔',
    desc: 'Exploits fear, panic, romance, guilt, or sympathy',
  },
  benign: {
    label: 'Benign',
    color: '#6b7280',
    bg: 'rgba(75,85,99,0.15)',
    icon: '✅',
    desc: 'Standard non-manipulative conversation',
  },
};

export const PRESET_SCENARIOS = [
  {
    id: 'romance',
    title: '💔 Romance Scam',
    desc: 'Offshore emergency & secret money transfer',
    text: `Scammer: Hey beautiful, I've been thinking about you all day. You're the only one who truly understands me.
Victim: Aw, that's sweet. I've been thinking about you too.
Scammer: I need to tell you something urgent. There's been an emergency with my account — I'm stranded and scared.
Victim: Oh no, what happened? Are you okay?
Scammer: I only need $2,000 for the release fee to fly home to be with you. You have 24 hours or I lose everything.
Scammer: Please don't tell anyone about this. Keep it strictly between us. You're the only one I trust.
Victim: I understand, I just want you safe.
Scammer: After everything we shared, act now please. The deadline is tonight. I love you.`,
  },
  {
    id: 'tech_support',
    title: '💻 Tech Support Scam',
    desc: 'Microsoft security alert & virus removal threat',
    text: `Scammer: Hello, this is Microsoft Security Division. We detected a critical virus on your computer.
Victim: Oh really? I didn't notice anything wrong.
Scammer: Our systems flagged your IP. This is an official government-level warning. Your account will be suspended in 2 hours.
Victim: Two hours? That sounds urgent...
Scammer: As a certified Microsoft technician, download our verification tool right now or your internet will be permanently blocked.
Victim: Is this safe? How do I know you're really from Microsoft?
Scammer: Ma'am, I am an authorized federal officer. Act now or face legal consequences.`,
  },
  {
    id: 'bank_phishing',
    title: '🏦 Bank Account Freeze',
    desc: 'Impersonating fraud protection department',
    text: `Scammer: Urgent Security Alert: Your Chase Bank card was used for a $1,450 transaction in Texas.
Victim: Wait, I didn't make that purchase!
Scammer: This is Officer Davis from Fraud Prevention. To block the transfer, speak your 6-digit verification PIN immediately.
Victim: Should I call the number on the back of my card first?
Scammer: Do not hang up or call anyone else! The fraud transfer will settle in 90 seconds if you do not verify now.`,
  },
  {
    id: 'job_offer',
    title: '💼 Fake Remote Job',
    desc: 'Check deposit & equipment fee extraction',
    text: `Recruiter: Congratulations! You have been selected for our Remote Executive Assistant role at $45/hr.
Candidate: Thank you! When do I start?
Recruiter: We will mail you a check for $3,500. Deposit it and wire $2,000 to our approved equipment vendor today.
Candidate: Can't the company send the equipment directly?
Recruiter: This is our standard procedure. Do this for me today so we can finalize your contract immediately.`,
  },
];

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
