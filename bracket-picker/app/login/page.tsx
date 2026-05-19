"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function signUp() {
    if (!username.trim()) {
      alert("Enter a username.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      alert("Account created! Check your email to confirm your account.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      username: username.trim(),
    });

    if (profileError) {
      alert(profileError.message);
      return;
    }

    alert("Account created! You can now sign in.");
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Sign In</h1>
        <p className="text-green-100 mb-6">
          Sign in or create an account to make your World Cup picks.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl px-4 py-3 text-black"
            placeholder="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full rounded-xl px-4 py-3 text-black"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <input
              className="w-full rounded-xl px-4 py-3 pr-24 text-black"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-green-950 font-semibold text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <a
            href="/forgot-password"
            className="text-sm text-green-100 underline"
          >
            Forgot your password?
          </a>

          <button
            onClick={signIn}
            className="w-full bg-white text-green-950 px-6 py-3 rounded-xl font-semibold"
          >
            Sign In
          </button>

          <button
            onClick={signUp}
            className="w-full border border-white px-6 py-3 rounded-xl font-semibold"
          >
            Create Account
          </button>
        </div>
      </div>
    </main>
  );
}
