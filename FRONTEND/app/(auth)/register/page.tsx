'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';
import { Scissors, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shopName.trim()) {
      setErrorMsg('Please enter your boutique or shop name.');
      return;
    }

    if (!ownerName.trim()) {
      setErrorMsg('Please enter the owner name.');
      return;
    }

    if (phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.signUp({
        email: email.trim(),
        password,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-1">
        <div className="w-11 h-11 rounded-lg bg-[#881337] flex items-center justify-center text-white mx-auto shadow-2xs">
          <Scissors className="w-5 h-5 rotate-45" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Create Boutique Account
        </h1>
        <p className="text-xs text-stone-500">
          Enter your shop details — these will appear dynamically on your dashboard, bills, and WhatsApp reports.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 border border-stone-200 rounded-lg sm:px-8 space-y-4 shadow-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Shop / Boutique Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Swapneri Dresses / Roopali Boutique"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Owner / Proprietor Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunita Deshmukh"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Shop Mobile *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-9 px-3 text-xs font-mono border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Shop Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. MG Road, Pune"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="owner@boutique.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Create Boutique & Go to Dashboard
              </Button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-stone-100">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#881337] font-semibold hover:underline">
                Sign in &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
