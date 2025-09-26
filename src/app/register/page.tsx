"use client";

import React, { useState } from "react";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import Button from "../components/Button";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      // TODO: Integrate API endpoint
      await new Promise((r) => setTimeout(r, 800));
      console.log("register:", { name, email, password });
      // Redirect example: router.push("/login")
    } catch (err) {
      setError("Registrasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthCard
        title="Daftar"
        subtitle="Buat akun baru untuk memulai"
        footer={
          <span>
            Sudah punya akun? <Link href="/login" className="underline">Masuk</Link>
          </span>
        }
      >
        {error && (
          <div className="text-sm text-red-500 -mt-2">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="text"
            name="name"
            label="Nama"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <Input
            type="password"
            name="confirmPassword"
            label="Konfirmasi kata sandi"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" label="Daftar" loading={loading} className="w-full" />
        </form>
      </AuthCard>
    </div>
  );
}


