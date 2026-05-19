"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated! You can now sign in.");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Update Password</h1>
        <p className="text-green-100 mb-6">Enter your new password below.</p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl px-4 py-3 text-black"
            placeholder="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={updatePassword}
            disabled={loading}
            className="w-full bg-white text-green-950 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </main>
  );
}
