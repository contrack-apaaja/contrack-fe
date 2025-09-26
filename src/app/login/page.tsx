"use client";

import React, { useState } from "react";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import Button from "../components/Button";
import Link from "next/link";
import api from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });

      if (!response.status || response.status !== 200) {
        throw new Error('Login failed');
      }

      const data = response.data as { token: string };
      console.log('Login successful:', data);

      // Save token to localStorage
      localStorage.setItem('token', data.token);

      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (error) {
      setError("Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthCard
        title="Masuk"
        subtitle="Silakan masuk untuk melanjutkan"
        footer={
          <span>
            Belum punya akun? <Link href="/register" className="underline">Daftar</Link>
          </span>
        }
      >
        {error && (
          <div className="text-sm text-red-500 -mt-2">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            name="password"
            label="Kata sandi"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" label="Masuk" loading={loading} className="w-full" />
        </form>
      </AuthCard>
    </div>
  );
}


