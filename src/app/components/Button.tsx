"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  label,
  loading,
  variant = "primary",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 h-10 px-4 py-2";
  const variants: Record<string, string> = {
    primary:
      "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
    secondary:
      "border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]",
    ghost: "hover:bg-black/5 dark:hover:bg-white/10",
  };

  const classes = `${base} ${variants[variant]} ${className}`.trim();

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? "Loading..." : label ?? children}
    </button>
  );
}

export default Button;


