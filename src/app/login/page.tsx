"use client";

import { LoginForm } from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 bg-blue-600 relative p-8 overflow-hidden">
        <div className="absolute top-8 left-8 flex items-center gap-2 text-white text-xl font-bold z-10">
          <span>contract.</span>
        </div>

        <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full bg-blue-500 opacity-25"></div>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-400 opacity-25"></div>

      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white p-8">
        <LoginForm />
      </div>
    </div>
  );
}