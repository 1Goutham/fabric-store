"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { api, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";

const OPTIONS = ["Minimal", "Relaxed", "Neutral", "Oversized", "Tailored", "Statement", "Linen", "Monochrome", "Workwear", "Weekend"];

/**
 * "Your style": derived labels (from behaviour) plus a light, optional set of
 * explicit chips. No questionnaire; it's fine to skip.
 */
export function StyleStrip({ derived, initialTags, compact }: { derived: string[]; initialTags: string[]; compact?: boolean }) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [saving, setSaving] = useState(false);

  const toggle = async (t: string) => {
    const next = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t].slice(0, 8);
    setTags(next);
    setSaving(true);
    try {
      await api.post("/api/signals", { type: "style", styleTags: next });
    } catch (err) {
      toast({ title: "Couldn't save your style", description: messageOf(err), tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {derived.length > 0 && !compact && (
        <p className="mb-4 text-[15px] text-fg-muted">
          From how you browse: <span className="text-fg">{derived.join(" · ")}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Style preferences" aria-busy={saving}>
        {OPTIONS.map((o) => {
          const on = tags.includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} onClick={() => toggle(o)} className={cn("tactile inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors", on ? "border-fg bg-fg text-bg" : "border-line text-fg-soft hover:border-line-strong hover:text-fg")}>
              {on && <Check className="h-3 w-3" />}
              {o}
            </button>
          );
        })}
      </div>
      {!compact && <p className="meta mt-3">Optional. Picks here nudge what we show you first.</p>}
    </div>
  );
}
