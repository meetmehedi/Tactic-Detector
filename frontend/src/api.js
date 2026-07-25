// API client for Tactic Detector backend with GitHub Pages / Offline fallback

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TACTIC_META = {
  urgency: {
    label: 'Urgency',
    code: 'URG',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    desc: 'Artificial time pressure or deadline to force immediate action',
  },
  authority: {
    label: 'Authority',
    code: 'AUT',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    desc: 'Impersonates trusted officials, banks, or law enforcement',
  },
  isolation: {
    label: 'Isolation',
    code: 'ISO',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    desc: 'Discourages victim from consulting friends, family, or experts',
  },
  reciprocity: {
    label: 'Reciprocity',
    code: 'REC',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    desc: 'Leverages past favors or emotional obligations to extract compliance',
  },
  emotional: {
    label: 'Emotional',
    code: 'EMO',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    desc: 'Exploits fear, panic, romance, guilt, or sympathy',
  },
  benign: {
    label: 'Benign',
    code: 'BEN',
    color: '#6b7280',
    bg: 'rgba(75,85,99,0.15)',
    desc: 'Standard non-manipulative conversation',
  },
};

export const PRESET_SCENARIOS = [
  {
    id: 'romance',
    title: 'Romance Scam',
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
    title: 'Tech Support Scam',
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
    title: 'Bank Account Freeze',
    desc: 'Impersonating fraud protection department',
    text: `Scammer: Urgent Security Alert: Your Chase Bank card was used for a $1,450 transaction in Texas.
Victim: Wait, I didn't make that purchase!
Scammer: This is Officer Davis from Fraud Prevention. To block the transfer, speak your 6-digit verification PIN immediately.
Victim: Should I call the number on the back of my card first?
Scammer: Do not hang up or call anyone else! The fraud transfer will settle in 90 seconds if you do not verify now.`,
  },
  {
    id: 'job_offer',
    title: 'Fake Remote Job',
    desc: 'Check deposit & equipment fee extraction',
    text: `Recruiter: Congratulations! You have been selected for our Remote Executive Assistant role at $45/hr.
Candidate: Thank you! When do I start?
Recruiter: We will mail you a check for $3,500. Deposit it and wire $2,000 to our approved equipment vendor today.
Candidate: Can't the company send the equipment directly?
Recruiter: This is our standard procedure. Do this for me today so we can finalize your contract immediately.`,
  },
];

// Keyword triggers for client-side fallback
const TACTIC_PATTERNS = {
  urgency: /\b(urgent|immediately|right now|24 hours|deadline|2 hours|90 seconds|today|now|emergency|asap|settle|fast)\b/i,
  authority: /\b(officer|security|division|microsoft|chase|bank|fraud|federal|authorized|police|law|department|verification|agent)\b/i,
  isolation: /\b(don't tell|keep it|strictly between us|only one|do not hang up|call anyone else|secret|private)\b/i,
  reciprocity: /\b(favor|help|shared|procedure|give|fee|wire|deposit|send|gift|transfer|pay|code|passcode|pin)\b/i,
  emotional: /\b(love|scared|stranded|beautiful|trust|consequences|lose everything|scam|help me|fear|panic|please|jail|arrest)\b/i,
};

/**
 * Client-side heuristic analysis engine (Fallback when backend API is unreachable)
 */
function analyzeClientSide(transcript) {
  let totalScore = 0;
  const tacticCounts = {};

  const turns = transcript.map((t, idx) => {
    const text = t.text || '';
    // Strip punctuation to check tokens clean
    const words = text.split(/\s+/);
    const tacticsFound = new Set();
    let maxTurnWordScore = 0;

    const highlighted_tokens = words.map(w => {
      const cleanWord = w.replace(/[^a-zA-Z0-9]/g, '');
      let wordScore = 0;
      for (const [tactic, pattern] of Object.entries(TACTIC_PATTERNS)) {
        if (pattern.test(cleanWord)) {
          tacticsFound.add(tactic);
          wordScore = 0.65 + Math.random() * 0.25;
        }
      }
      maxTurnWordScore = Math.max(maxTurnWordScore, wordScore);
      return { token: w, score: wordScore };
    });

    const tacticsList = Array.from(tacticsFound);
    let turnRisk = 0.02;

    if (tacticsList.length > 0) {
      turnRisk = Math.min(0.4 + tacticsList.length * 0.2, 0.95);
      tacticsList.forEach(tac => {
        tacticCounts[tac] = (tacticCounts[tac] || 0) + 1;
      });
    } else {
      tacticsList.push('benign');
    }

    const tactic_scores = {
      urgency: TACTIC_PATTERNS.urgency.test(text) ? 0.78 : 0.02,
      authority: TACTIC_PATTERNS.authority.test(text) ? 0.85 : 0.02,
      isolation: TACTIC_PATTERNS.isolation.test(text) ? 0.72 : 0.02,
      reciprocity: TACTIC_PATTERNS.reciprocity.test(text) ? 0.64 : 0.02,
      emotional: TACTIC_PATTERNS.emotional.test(text) ? 0.81 : 0.02,
    };

    totalScore += turnRisk;

    return {
      turn_id: idx,
      speaker: t.speaker || 'Unknown',
      text,
      confidence: turnRisk,
      tactics: tacticsList,
      highlighted_tokens,
      tactic_scores,
    };
  });

  const flagged_turn_ids = turns.filter(t => !t.tactics.includes('benign')).map(t => t.turn_id);
  const overall_risk_score = turns.length > 0 ? (totalScore / turns.length) : 0.02;

  let dominant_tactic = null;
  let maxCount = 0;
  for (const [tac, cnt] of Object.entries(tacticCounts)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      dominant_tactic = tac;
    }
  }

  return {
    turns,
    overall_risk_score: flagged_turn_ids.length > 0 ? Math.max(overall_risk_score, 0.45) : Math.min(overall_risk_score, 0.1),
    dominant_tactic: flagged_turn_ids.length > 0 ? dominant_tactic : null,
    flagged_turn_ids,
  };
}

/**
 * Analyze a conversation transcript with automatic offline/GitHub Pages fallback
 * @param {Array<{speaker: string, text: string}>} transcript
 * @returns {Promise<object>}
 */
export async function analyzeTranscript(transcript) {
  try {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend server unavailable, running client-side fallback analyzer.', e);
  }

  // Return client-side inference result
  return analyzeClientSide(transcript);
}

/**
 * Run demo analysis with offline fallback
 * @returns {Promise<object>}
 */
export async function analyzeDemo() {
  const demoTranscript = parseTranscriptText(PRESET_SCENARIOS[0].text);
  return analyzeTranscript(demoTranscript);
}

/**
 * Parse raw transcript text (one line per turn: "Speaker: text")
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
