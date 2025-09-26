"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from '@/services/api';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/register', { email, password });
            const data = response.data as {
                status: string;
                message: string;
                data: { user: object };
            };

            if (response.status !== 200 || data.status !== 'success') {
                throw new Error(data.message || 'Pendaftaran gagal.');
            }

            console.log('Registration successful:', data);
            router.push('/login');
        } catch (error) {
            console.error('Registration error:', error);
            setError("Pendaftaran gagal. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Daftar Akun Baru</h1>
                <p className="text-muted-foreground">Silakan isi data untuk melanjutkan</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="Masukkan email anda"
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password anda"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground"
                            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Konfirmasi password anda"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground"
                            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
                )}

                <Button type="submit" className="w-full" style={{ backgroundColor: "#137fec", color: "#fff" }} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        "Daftar"
                    )}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="underline">
                    Masuk
                </Link>
            </div>
        </div>
    );
}