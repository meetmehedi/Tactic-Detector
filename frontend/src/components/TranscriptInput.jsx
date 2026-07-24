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
    if (!text.trim()) { setError('Please paste a transcript or pick a preset scenario.'); return; }
    try {
      let turns;
      if (mode === 'json') {
        const parsed = JSON.parse(text);
        turns = Array.isArray(parsed) ? parsed : parsed.transcript;
        if (!turns?.length) throw new Error('JSON must contain a "transcript" array of turns.');
      } else {
        turns = parseTranscriptText(text);
        if (!turns.length) throw new Error('Could not parse transcript. Use "Speaker: text" per line.');
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
    <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col gap-6 shadow-2xl transition-all">
      {/* Top Title & Presets */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>✍️</span> Transcript Input
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Paste conversation turns or pick a pre-loaded real scam scenario
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 self-start sm:self-auto">
            {['text', 'json'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  mode === m
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m} Format
              </button>
            ))}
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 self-center font-medium mr-1">Presets:</span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/50 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-200"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea & Drag Drop */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          className={`relative rounded-2xl transition-all duration-200 ${
            dragActive ? 'ring-2 ring-purple-500 bg-purple-950/20' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
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
            rows={9}
            className="w-full rounded-2xl p-5 text-sm resize-none outline-none font-mono bg-slate-950/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all duration-200 leading-relaxed"
          />

          <div className="absolute bottom-3 right-4 text-[11px] font-mono text-slate-500 pointer-events-none">
            {text.split('\n').filter(l => l.trim()).length} turns • {text.length} chars
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-xs font-medium bg-red-950/40 text-red-300 border border-red-800/50 flex items-center gap-2 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-5 py-3 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-slate-500 transition-all flex items-center justify-center gap-2 shadow-sm"
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
            className="px-5 py-3 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <span>▶</span> Quick Demo
          </button>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex-1 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: loading
                ? 'rgba(124, 58, 237, 0.3)'
                : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            }}
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
