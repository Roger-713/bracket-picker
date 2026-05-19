"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type League = {
  id: string;
  name: string;
  join_code: string;
};

type LeagueMember = {
  league_id: string;
};

export default function LeaguePage() {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeagues() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", user.id);

      if (membershipError) {
        console.error(membershipError);
        alert("Could not load your leagues.");
        setLoading(false);
        return;
      }

      const leagueIds = (memberships || []).map(
        (membership: LeagueMember) => membership.league_id,
      );

      if (leagueIds.length === 0) {
        setLeagues([]);
        setLoading(false);
        return;
      }

      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("id, name, join_code")
        .in("id", leagueIds);

      if (leagueError) {
        console.error(leagueError);
        alert("Could not load league details.");
        setLoading(false);
        return;
      }

      setLeagues(leagueData || []);
      setActiveLeagueId(localStorage.getItem("activeLeagueId"));
      setLoading(false);
    }

    loadLeagues();
  }, []);

  function setActiveLeague(leagueId: string) {
    localStorage.setItem("activeLeagueId", leagueId);
    setActiveLeagueId(leagueId);
    alert("Active league updated!");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading leagues...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">My Leagues</h1>
        <p className="text-green-100 mb-6">
          Choose which league you want to view for picks, leaderboard, payments,
          and dashboard.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <a
            href="/create-league"
            className="bg-white text-green-950 px-5 py-3 rounded-xl font-semibold"
          >
            Create League
          </a>

          <a
            href="/join"
            className="border border-white px-5 py-3 rounded-xl font-semibold"
          >
            Join League
          </a>
        </div>

        <div className="space-y-4">
          {leagues.length === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <p className="text-green-100">
                You are not in any leagues yet. Create or join a league first.
              </p>
            </div>
          )}

          {leagues.map((league) => {
            const isActive = activeLeagueId === league.id;

            return (
              <div
                key={league.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <h2 className="text-2xl font-bold">{league.name}</h2>
                  <p className="text-green-100">
                    Join Code: {league.join_code}
                  </p>

                  {isActive && (
                    <p className="text-green-300 text-sm mt-2">
                      Current active league
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveLeague(league.id)}
                  disabled={isActive}
                  className="bg-white text-green-950 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {isActive ? "Active" : "Set Active"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
