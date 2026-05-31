import { cn } from "@/lib/utils";

/** A calm diya (oil lamp) — warmth and remembrance, not a clinical mark. */
export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          {/* flame */}
          <g className="candle-flicker">
            <path
              d="M24 8c3.5 4 5 7 5 10a5 5 0 0 1-10 0c0-2 .8-3.6 2-5.5C20.5 15 24 12 24 8Z"
              fill="url(#flame)"
            />
            <path d="M24 14c1.6 2 2.4 3.4 2.4 5a2.4 2.4 0 0 1-4.8 0c0-1.4 1-3 2.4-5Z" fill="#fff6e6" />
          </g>
          {/* lamp bowl */}
          <path
            d="M8 30c4.4 4 11 6 16 6s11.6-2 16-6c-1.5 5-7.5 9-16 9S9.5 35 8 30Z"
            fill="url(#bowl)"
          />
          <ellipse cx="24" cy="30" rx="17" ry="3.4" fill="#c2703d" opacity="0.35" />
          <defs>
            <linearGradient id="flame" x1="24" y1="8" x2="24" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f6b04e" />
              <stop offset="1" stopColor="#c2703d" />
            </linearGradient>
            <linearGradient id="bowl" x1="8" y1="30" x2="40" y2="39" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4c51bf" />
              <stop offset="1" stopColor="#0f766e" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      {withWord && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Antim Sahara
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            अंतिम सहारा
          </span>
        </span>
      )}
    </span>
  );
}
