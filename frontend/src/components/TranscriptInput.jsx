import { useState, useRef } from 'react';
import { parseTranscriptText } from '../api';

const PLACEHOLDER = `Scammer: Hello, this is your bank calling. Your account has been suspended.
Victim: Oh no, what happened?
Scammer: We detected suspicious activity. You must act immediately or lose all access.
Victim: How do I fix this?
Scammer: Don't tell anyone about this call. Just give me your account details right now.`;

export default function TranscriptInput({ onAnalyze, onDemo, loading }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text'); // 'text' | 'json'
  const [error, setError] = useState('');
  const fileRef = useRef();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!text.trim()) { setError('Please paste a transcript or upload a file.'); return; }
    try {
      let turns;
      if (mode === 'json') {
        const parsed = JSON.parse(text);
        turns = Array.isArray(parsed) ? parsed : parsed.transcript;
        if (!turns?.length) throw new Error('JSON must contain a "transcript" array.');
      } else {
        turns = parseTranscriptText(text);
        if (!turns.length) throw new Error('Could not parse transcript. Use "Speaker: text" format.');
      }
      onAnalyze(turns);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
      setMode(file.name.endsWith('.json') ? 'json' : 'text');
    };
    reader.readAsText(file);
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Paste Transcript</h2>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {['text', 'json'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                background: mode === m ? 'rgba(139,92,246,0.3)' : 'transparent',
                color: mode === m ? '#c4b5fd' : '#6b6b8a',
                border: mode === m ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
              }}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={mode === 'json' ? '{"transcript": [{"speaker": "A", "text": "..."}]}' : PLACEHOLDER}
          rows={10}
          className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all duration-200 font-mono"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8e8f0',
            lineHeight: '1.6',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠ {error}
          </p>
        )}

        <div className="flex gap-2">
          {/* File upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            📎 Upload File
          </button>
          <input ref={fileRef} type="file" accept=".txt,.json" className="hidden" onChange={handleFile} />

          {/* Demo */}
          <button
            type="button"
            onClick={onDemo}
            disabled={loading}
            className="flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            ▶ Run Demo
          </button>

          {/* Analyze */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: 'white',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Analyzing…
              </span>
            ) : '🔍 Analyze Transcript'}
          </button>
        </div>
      </form>
    </div>
  );
}
