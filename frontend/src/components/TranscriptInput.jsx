import { useState, useRef } from 'react';
import { parseTranscriptText, PRESET_SCENARIOS } from '../api';

const PLACEHOLDER_TEXT = `Scammer: Hello, this is Chase Fraud Prevention calling. Your account has been flagged.
Victim: Oh no, what happened?
Scammer: We detected suspicious activity. You must verify your account details immediately or lose access.
Victim: How do I fix this?
Scammer: Don't tell anyone about this call. Just read your 6-digit passcode to me right now.`;

export default function TranscriptInput({ onAnalyze, onDemo, loading }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('text'); // 'text' | 'json'
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
        if (!turns?.length) throw new Error('JSON must contain a "transcript" array of turns.');
      } else {
        turns = parseTranscriptText(text);
        if (!turns.length) throw new Error('Could not parse transcript. Use "Speaker: text" per line format.');
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
    <div className="card-futuristic p-6 sm:p-8 flex flex-col gap-6 shadow-2xl transition-all">
      {/* Top Controls: Presets & Format Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider mr-1">
            Presets:
          </span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-indigo-950/40 text-[var(--text-2)] hover:text-white border border-[var(--border)] hover:border-indigo-500/40 transition-all duration-200 cursor-pointer"
            >
              {preset.title}
            </button>
          ))}
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] self-start sm:self-auto">
          {['text', 'json'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border-0 cursor-pointer ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-2)] hover:text-[var(--text-1)] bg-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div
          className={`relative rounded-2xl transition-all duration-200 ${
            dragActive ? 'ring-2 ring-indigo-500 bg-indigo-950/20' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === 'json'
                ? '{\n  "transcript": [\n    {"speaker": "Scammer", "text": "Urgent alert..."},\n    {"speaker": "Victim", "text": "What do I do?"}\n  ]\n}'
                : PLACEHOLDER_TEXT
            }
            rows={10}
            className="w-full rounded-2xl p-5 text-sm outline-none font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all leading-relaxed"
          />

          <div className="absolute bottom-4 right-4 text-[11px] font-mono text-[var(--text-3)] pointer-events-none">
            {text.split('\n').filter((l) => l.trim()).length} turns • {text.length} chars
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-3 rounded-2xl text-xs font-medium bg-red-950/40 text-red-300 border border-red-800/50 flex items-center gap-2 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-5 py-3 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text-1)] border border-[var(--border)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>📎</span> Attach File
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <button
            type="button"
            onClick={onDemo}
            disabled={loading}
            className="px-5 py-3 rounded-full text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>▶</span> Quick Demo
          </button>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex-1 py-3 px-8 rounded-full text-sm font-bold text-white transition-all shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-0 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing Transcript…
              </>
            ) : (
              <>
                <span>⚡</span> Analyze Social Tactics
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
