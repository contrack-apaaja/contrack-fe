"use client";

import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2)}`;
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm text-foreground/80">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className="h-10 rounded-md border border-black/[.08] dark:border-white/[.145] bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;


