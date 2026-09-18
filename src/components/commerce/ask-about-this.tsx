"use client";
import { Sparkles } from "lucide-react";
import { useUI } from "@/lib/store/ui";

const PROMPTS = ["Show similar styles", "Build an outfit around this", "Help me choose a size"];

export function AskAboutThis({ productId }: { productId: string }) {
  const openAssistant = useUI((s) => s.openAssistant);
  return (
    <div className="rounded-[var(--r-lg)] border border-line p-4">
      <button onClick={() => openAssistant({ productId })} className="group flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] text-fg">
          <Sparkles className="h-4 w-4 text-accent" /> Ask FabricNest about this
        </span>
        <span className="text-[12px] text-fg-muted group-hover:text-fg">Open</span>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => openAssistant({ productId, prefill: p })} className="tactile rounded-full border border-line px-3 py-1.5 text-[12px] text-fg-muted hover:border-line-strong hover:text-fg">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
