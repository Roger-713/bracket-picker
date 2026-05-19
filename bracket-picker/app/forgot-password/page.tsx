"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendResetEmail() {
    if (!email.trim()) {
      alert("Enter your email first.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent. Check your inbox.");
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Forgot Password</h1>
        <p className="text-green-100 mb-6">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl px-4 py-3 text-black"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="button"
            onClick={sendResetEmail}
            disabled={loading}
            className="w-full bg-white text-green-950 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>

          <a
            href="/login"
            className="block text-center text-green-100 underline"
          >
            Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
