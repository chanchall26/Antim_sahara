import { cn } from "@/lib/utils";

/** A small hand-drawn diya/lotus motif used as a section divider. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 text-muted-foreground/50", className)} aria-hidden>
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-current sm:w-24" />
      <svg viewBox="0 0 40 24" className="h-5 w-8 shrink-0">
        {/* tiny flame */}
        <path
          d="M20 3c2 2.4 3 4.2 3 6a3 3 0 0 1-6 0c0-1.2.6-2.4 1.5-3.6C19.2 4.8 20 4 20 3Z"
          fill="var(--gold)"
          className="candle-flicker"
        />
        {/* lamp */}
        <path d="M11 14c2.6 2 5.8 3 9 3s6.4-1 9-3c-.9 2.8-4.4 4.6-9 4.6S11.9 16.8 11 14Z" fill="currentColor" />
        {/* side dots */}
        <circle cx="3" cy="12" r="1.4" fill="currentColor" />
        <circle cx="37" cy="12" r="1.4" fill="currentColor" />
      </svg>
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-current sm:w-24" />
    </div>
  );
}

/** A single decorative diya dot (for inline flourishes). */
export function DiyaDot({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-1.5 w-1.5 rounded-full bg-gold", className)} aria-hidden />
  );
}
