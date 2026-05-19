"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function JoinLeaguePage() {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function joinLeague() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You need to sign in before joining a league.");
      window.location.href = "/login";
      return;
    }

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .select("*")
      .eq("join_code", joinCode.trim().toUpperCase())
      .single();

    if (leagueError || !league) {
      alert("League not found. Check the join code.");
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from("league_members").upsert(
      {
        league_id: league.id,
        user_id: user.id,
      },
      {
        onConflict: "league_id,user_id",
      },
    );

    if (memberError) {
      alert(memberError.message);
      setLoading(false);
      return;
    }

    alert(`Joined ${league.name}!`);
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Join League</h1>
        <p className="text-green-100 mb-6">
          Enter your friend group&apos;s league code to join.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl px-4 py-3 text-black uppercase"
            placeholder="WORLD2026"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />

          <button
            type="button"
            onClick={joinLeague}
            disabled={loading}
            className="w-full bg-white text-green-950 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join League"}
          </button>
        </div>
      </div>
    </main>
  );
}
