'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scissors, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await authService.signIn({ email, password });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setIsDemoLoading(true);
    try {
      await authService.demoSignIn();
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enter demo workshop');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-11 h-11 rounded-lg bg-[#881337] flex items-center justify-center text-white mx-auto shadow-2xs">
          <Scissors className="w-5 h-5 rotate-45" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Boutique Management
        </h1>
        <p className="text-xs text-stone-500">
          Sign in to your boutique workshop & orders
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-stone-200 rounded-lg sm:px-8 space-y-5 shadow-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="owner@boutique.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-10 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-xs">
              <Link href="/forgot-password" className="text-[#881337] hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isDemoLoading}
              className="w-full h-9 flex items-center justify-center gap-2 border border-stone-200 hover:bg-stone-50 rounded text-xs font-medium text-stone-700 transition-colors cursor-pointer"
            >
              <span>{isDemoLoading ? 'Loading workshop...' : 'Explore Workshop Without Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>

          <div className="text-center pt-1 border-t border-stone-100">
            <p className="text-xs text-stone-500">
              New boutique?{' '}
              <Link href="/register" className="text-[#881337] font-semibold hover:underline">
                Create Shop Account &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
