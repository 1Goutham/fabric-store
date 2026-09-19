"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/client/cn";

export function Toaster() {
  const { toasts, dismissToast } = useUI();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+12px)] z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="glass glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--r-lg)] px-4 py-3"
            role="status"
          >
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", t.tone === "danger" ? "bg-danger/20 text-danger" : t.tone === "success" ? "bg-ok/20 text-ok" : "bg-white/10 text-fg-soft")}>
              {t.tone === "danger" ? <AlertCircle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-fg-muted">{t.description}</p>}
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    dismissToast(t.id);
                  }}
                  className="link-underline mt-1.5 text-[13px] text-accent"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="-mr-1 rounded-full p-1 text-fg-faint hover:text-fg">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
