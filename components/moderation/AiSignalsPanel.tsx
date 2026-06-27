import type { ModerationFlags } from '@/types';
import { clsx } from 'clsx';

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800">
        <div
          className={clsx('h-1.5 rounded-full transition-all', color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-slate-400">{Math.round(value)}%</span>
    </div>
  );
}

function FlagRow({ label, value, invert = false }: { label: string; value: boolean; invert?: boolean }) {
  const bad = invert ? !value : value;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={clsx('text-xs font-medium', bad ? 'text-red-400' : 'text-emerald-400')}>
        {value ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

export function AiSignalsPanel({ flags, aiModel }: { flags: ModerationFlags; aiModel: string | null }) {
  const img    = flags.image;
  const text   = flags.text;
  const gemini = flags.gemini;
  const spam   = flags.spam;

  return (
    <div className="space-y-4">
      {/* AI Model */}
      {aiModel && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Pipeline</p>
          <p className="mt-0.5 text-xs font-mono text-blue-400">{aiModel}</p>
        </div>
      )}

      {/* Google Vision */}
      {img && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            Google Vision
            <span className="h-px flex-1 bg-slate-800" />
          </h4>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-0.5">
            <FlagRow label="Quality pass"     value={img.quality_pass     ?? true} />
            <FlagRow label="Is civic related" value={img.is_civic_related ?? true} />
            <FlagRow label="Is screenshot"    value={img.is_screenshot    ?? false} invert />
            <FlagRow label="Is selfie"        value={img.is_selfie        ?? false} invert />
            <FlagRow label="Has explicit"     value={img.has_explicit     ?? false} invert />
            {img.quality_issue && (
              <div className="pt-2">
                <span className="text-xs text-amber-400">Quality issue: {img.quality_issue}</span>
              </div>
            )}
            {img.confidence != null && (
              <div className="pt-2">
                <p className="text-[10px] text-slate-500 mb-1">Confidence</p>
                <Meter value={(img.confidence ?? 0) * 100} color="bg-blue-500" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gemini */}
      {gemini && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            Gemini Reasoning
            <span className="h-px flex-1 bg-slate-800" />
          </h4>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-3">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Category match</p>
                <Meter value={gemini.categoryMatch ?? 0} color={
                  (gemini.categoryMatch ?? 0) >= 70 ? 'bg-emerald-500' :
                  (gemini.categoryMatch ?? 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'
                } />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Title match</p>
                <Meter value={gemini.titleMatch ?? 0} color={
                  (gemini.titleMatch ?? 0) >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                } />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Spam probability</p>
                <Meter value={gemini.spamProbability ?? 0} color={
                  (gemini.spamProbability ?? 0) < 30 ? 'bg-emerald-500' :
                  (gemini.spamProbability ?? 0) < 60 ? 'bg-amber-500' : 'bg-red-500'
                } />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Reasoning confidence</p>
                <Meter value={gemini.reasoningConfidence ?? 0} color="bg-blue-500" />
              </div>
            </div>
            {gemini.explanation && (
              <div className="rounded border border-slate-700 bg-slate-800/50 px-3 py-2">
                <p className="text-xs italic text-slate-400">"{gemini.explanation}"</p>
              </div>
            )}
            {gemini.flags && gemini.flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {gemini.flags.map(f => (
                  <span key={f} className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-red-500/25">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Claude text */}
      {text && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            Claude Text
            <span className="h-px flex-1 bg-slate-800" />
          </h4>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-0.5">
            <FlagRow label="Profanity"       value={text.has_profanity       ?? false} invert />
            <FlagRow label="Hate speech"     value={text.has_hate_speech     ?? false} invert />
            <FlagRow label="Personal attack" value={text.has_personal_attack ?? false} invert />
            <FlagRow label="Death claim"     value={text.has_death_claim     ?? false} invert />
            <FlagRow label="Political slogan"value={text.has_political_slogan ?? false} invert />
            <FlagRow label="Is relevant"     value={text.is_relevant ?? true} />
            <FlagRow label="Is spam"         value={text.is_spam ?? false} invert />
            {text.reason && (
              <div className="pt-2">
                <p className="text-xs text-amber-400">{text.reason}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Spam */}
      {spam && spam.is_spam && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-xs font-medium text-red-400">⚠ Spam detected</p>
          <p className="mt-1 text-xs text-slate-400">{spam.reason}</p>
          <p className="mt-0.5 text-xs text-slate-500">{spam.recent_submissions} submissions in last hour</p>
        </div>
      )}
    </div>
  );
}
