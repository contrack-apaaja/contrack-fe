"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from '@/services/api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });

      const data = response.data as {
        status: string;
        message: string;
        data: { token: string; /* ... other user data */ };
      };

      if (response.status !== 200 || data.status !== 'success' || !data.data.token) {
        throw new Error(data.message || 'Email atau kata sandi salah.');
      }

      console.log('Login successful');
      localStorage.setItem('token', data.data.token);
      router.push('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError("Login gagal. Periksa kembali email dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Masuk</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Silakan masuk untuk melanjutkan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Kata sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

            <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: "#137fec", color: "#fff" }}
            disabled={loading}
            >
            {loading ? (
              <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
              </>
            ) : (
              "Masuk"
            )}
            </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link href="/register" className="underline">
            Daftar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}