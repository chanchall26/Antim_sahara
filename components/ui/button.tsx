"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        primary:
          "sheen bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
        gradient:
          "sheen text-white shadow-[0_10px_34px_-10px_rgba(124,92,240,0.55)] hover:-translate-y-0.5 hover:shadow-[0_16px_44px_-10px_rgba(124,92,240,0.7)] bg-[linear-gradient(125deg,#6a4ff0_0%,#c0497f_52%,#cf6a2e_100%)] bg-[length:170%_170%] hover:bg-[position:100%_0]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:brightness-110 hover:-translate-y-0.5",
        accent: "bg-accent text-accent-foreground shadow-md hover:brightness-110 hover:-translate-y-0.5",
        soft: "bg-primary-soft text-primary hover:brightness-95",
        outline:
          "border-2 border-border bg-card text-foreground hover:bg-muted hover:border-primary/30",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-danger text-white shadow-md hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-4 text-sm rounded-xl",
        md: "h-12 px-5.5 text-base",
        lg: "h-14 px-8 text-lg rounded-2xl",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
