import React from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto border border-black/[.08] dark:border-white/[.145] rounded-xl p-6 bg-background/60 backdrop-blur">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-foreground/70 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-6 text-sm text-center">{footer}</div>}
    </div>
  );
}

export default AuthCard;


