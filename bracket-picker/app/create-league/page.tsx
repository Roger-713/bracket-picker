"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

function generateJoinCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }

  return code;
}

export default function CreateLeaguePage() {
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createLeague() {
    if (!leagueName.trim()) {
      alert("Enter a league name.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You need to sign in before creating a league.");
      window.location.href = "/login";
      return;
    }

    const joinCode = generateJoinCode();

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        name: leagueName.trim(),
        join_code: joinCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (leagueError) {
      console.error(leagueError);
      alert(leagueError.message);
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
      console.error(memberError);
      alert(memberError.message);
      setLoading(false);
      return;
    }

    alert(`League created! Join code: ${joinCode}`);
    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Create League</h1>
        <p className="text-green-100 mb-6">
          Create a private league and share the join code with your friends.
        </p>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl px-4 py-3 text-black"
            placeholder="League name"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
          />

          <button
            type="button"
            onClick={createLeague}
            disabled={loading}
            className="w-full bg-white text-green-950 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create League"}
          </button>
        </div>
      </div>
    </main>
  );
}
