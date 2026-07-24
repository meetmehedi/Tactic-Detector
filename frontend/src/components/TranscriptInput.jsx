import { useState, useRef } from 'react';
import { parseTranscriptText, PRESET_SCENARIOS } from '../api';

const PLACEHOLDER_TEXT = `Scammer: Hello, this is Chase Fraud Prevention calling. Your account has been flagged.
Victim: Oh no, what happened?
Scammer: We detected suspicious activity. You must verify your account details immediately or lose access.
Victim: How do I fix this?
Scammer: Don't tell anyone about this call. Just read your 6-digit passcode to me right now.`;

export default function TranscriptInput({ onAnalyze, onDemo, loading }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef();

  function handleSubmit(e) {
    e?.preventDefault();
    setError('');
    if (!text.trim()) {
      setError('Please paste a transcript or select a preset scenario.');
      return;
    }
    try {
      let turns;
      if (mode === 'json') {
        const parsed = JSON.parse(text);
        turns = Array.isArray(parsed) ? parsed : parsed.transcript;
        if (!turns?.length) throw new Error('JSON must contain a "transcript" array.');
      } else {
        turns = parseTranscriptText(text);
        if (!turns.length) throw new Error('Could not parse. Use "Speaker: text" per line.');
      }
      onAnalyze(turns);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target.result);
      setMode(file.name.endsWith('.json') ? 'json' : 'text');
    };
    reader.readAsText(file);
  }

  function handlePreset(scenario) {
    setText(scenario.text);
    setMode('text');
    setError('');
  }

  return (
    <div
      className="input-card"
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
      }}
      style={dragActive ? { outline: '2px solid var(--accent)', outlineOffset: '-2px' } : undefined}
    >
      {/* ─── HEADER: Presets + Mode Toggle ─── */}
      <div className="input-card__header">
        {/* Preset Chips */}
        <div className="input-card__presets">
          <span className="input-card__preset-label">Presets:</span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset)}
              className="btn-preset"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        <div className="input-card__mode-toggle">
          {['text', 'json'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`btn-mode${mode === m ? ' active' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ─── BODY: Textarea ─── */}
      <div className="input-card__body">
        <div className="input-card__textarea-wrap">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'json'
                ? '{\n  "transcript": [\n    {"speaker": "Scammer", "text": "Urgent alert..."},\n    {"speaker": "Victim", "text": "What do I do?"}\n  ]\n}'
                : PLACEHOLDER_TEXT
            }
            className="input-card__textarea"
          />
          <div className="input-card__counter">
            {text.split('\n').filter((l) => l.trim()).length} turns · {text.length} chars
          </div>
        </div>

        {error && (
          <div className="input-card__error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ─── FOOTER: Action Buttons ─── */}
      <div className="input-card__footer">
        {/* Attach File */}
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
          <span>📎</span> Attach File
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.json"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {/* Quick Demo */}
        <button type="button" onClick={onDemo} disabled={loading} className="btn-demo">
          <span>▶</span> Quick Demo
        </button>

        {/* Analyze */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="btn-primary"
        >
          {loading ? (
            <>
              <svg
                style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
              Analyzing…
            </>
          ) : (
            <>⚡ Analyze Social Tactics</>
          )}
        </button>
      </div>
    </div>
  );
}
