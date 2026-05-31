import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-border", className)} role="separator" {...props} />;
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />;
}

/** A soft, calming section container used across the app shell. */
export function Section({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6", className)} {...props} />;
}
