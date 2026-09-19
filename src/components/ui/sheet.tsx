"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useReducedMotion } from "@/hooks/use-media";
import { IconButton } from "./button";

type Side = "right" | "left" | "bottom" | "center";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  width?: string;
  hideHeader?: boolean;
}

const spring = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 } as const;

/**
 * Glass sheet: side drawer on desktop, bottom sheet or centered modal as needed.
 * Handles focus, Escape, scroll lock and reduced motion.
 */
export function Sheet({ open, onClose, side = "right", title, description, children, className, width = "max-w-md", hideHeader }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus], input, button")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  const variants = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
    bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
    center: { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.98, y: 6 } },
  }[side];

  const position = {
    right: "inset-y-0 right-0 h-full w-full " + width,
    left: "inset-y-0 left-0 h-full w-full " + width,
    bottom: "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-[var(--r-xl)]",
    center: "left-1/2 top-1/2 w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-xl)] " + width,
  }[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.25 }} onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={reduced ? { duration: 0 } : side === "center" ? { duration: 0.22, ease: [0.16, 1, 0.3, 1] } : spring}
            className={cn("glass glass-strong absolute flex flex-col overflow-hidden", side === "center" && "max-h-[88dvh]", position, className)}
            style={side === "center" ? { transform: "translate(-50%,-50%)" } : undefined}
          >
            {!hideHeader && (
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 md:px-6">
                <div>
                  {title && <h2 className="headline text-lg">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
                </div>
                <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1">
                  <X className="h-4.5 w-4.5" />
                </IconButton>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
