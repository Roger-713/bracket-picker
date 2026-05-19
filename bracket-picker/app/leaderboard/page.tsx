"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Prediction = {
  id: string;
  user_id: string;
  points_awarded: number | null;
  exact_score_correct: boolean | null;
  score_error: number | null;
};

type Profile = {
  id: string;
  username: string | null;
};

type LeaderboardPlayer = {
  user_id: string;
  username: string;
  points: number;
  picks: number;
  exactFinalScore: number;
  finalScoreError: number | null;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueName, setLeagueName] = useState("");
  const [totalPool, setTotalPool] = useState(0);
  const [paidPlayers, setPaidPlayers] = useState(0);

  useEffect(() => {
    async function getLeaderboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const activeLeagueId = localStorage.getItem("activeLeagueId");

      if (!activeLeagueId) {
        alert("Choose an active league first.");
        window.location.href = "/league";
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from("league_members")
        .select("league_id")
        .eq("user_id", user.id)
        .eq("league_id", activeLeagueId)
        .maybeSingle();

      if (membershipError) {
        console.error("Membership error:", membershipError);
        alert("Could not check your league.");
        setLoading(false);
        return;
      }

      if (!membership) {
        alert("You are not a member of this league.");
        localStorage.removeItem("activeLeagueId");
        window.location.href = "/league";
        return;
      }

      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", membership.league_id)
        .single();

      if (!leagueError && league) {
        setLeagueName(league.name);
      }

      const { data: payments, error: paymentsError } = await supabase
        .from("league_payments")
        .select("amount, payment_status")
        .eq("league_id", membership.league_id);

      if (paymentsError) {
        console.error(paymentsError);
      } else {
        const paidPayments = (payments || []).filter(
          (payment) => payment.payment_status === "paid",
        );

        setPaidPlayers(paidPayments.length);

        const pool = paidPayments.reduce(
          (total, payment) => total + Number(payment.amount || 0),
          0,
        );

        setTotalPool(pool);
      }

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("id, user_id, points_awarded, exact_score_correct, score_error")
        .eq("league_id", membership.league_id);

      if (predictionError) {
        console.error("Prediction error:", predictionError);
        alert(predictionError.message);
        setLoading(false);
        return;
      }

      const userIds = [...new Set((predictions || []).map((p) => p.user_id))];

      let profiles: Profile[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profileError) {
          console.error("Profile error:", profileError);
          alert(profileError.message);
          setLoading(false);
          return;
        }

        profiles = profileData || [];
      }

      const profileMap = new Map<string, string>();

      profiles.forEach((profile) => {
        profileMap.set(profile.id, profile.username || "Unknown Player");
      });

      const leaderboardMap = new Map<string, LeaderboardPlayer>();

      (predictions || []).forEach((prediction: Prediction) => {
        const userId = prediction.user_id;
        const username = profileMap.get(userId) || "Unknown Player";

        if (!leaderboardMap.has(userId)) {
          leaderboardMap.set(userId, {
            user_id: userId,
            username,
            points: 0,
            picks: 0,
            exactFinalScore: 0,
            finalScoreError: null,
          });
        }

        const player = leaderboardMap.get(userId)!;

        player.points += prediction.points_awarded || 0;
        player.picks += 1;

        if (prediction.exact_score_correct) {
          player.exactFinalScore += 1;
        }

        if (prediction.score_error !== null) {
          player.finalScoreError =
            player.finalScoreError === null
              ? prediction.score_error
              : player.finalScoreError + prediction.score_error;
        }
      });

      const sortedPlayers = Array.from(leaderboardMap.values()).sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        if (b.exactFinalScore !== a.exactFinalScore) {
          return b.exactFinalScore - a.exactFinalScore;
        }

        const aError = a.finalScoreError ?? Number.MAX_SAFE_INTEGER;
        const bError = b.finalScoreError ?? Number.MAX_SAFE_INTEGER;

        if (aError !== bError) {
          return aError - bError;
        }

        return b.picks - a.picks;
      });

      setPlayers(sortedPlayers);
      setLoading(false);
    }

    getLeaderboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading leaderboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>

        {leagueName && (
          <p className="text-green-100 mb-6">League: {leagueName}</p>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Paid Players</p>
            <h2 className="text-4xl font-bold">{paidPlayers}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Prize Pool</p>
            <h2 className="text-4xl font-bold">${totalPool}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Payout</p>
            <h2 className="text-2xl font-bold">Winner Takes All</h2>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Picks Made</th>
                  <th className="p-4">Exact Final Score</th>
                  <th className="p-4">Final Score Error</th>
                </tr>
              </thead>

              <tbody>
                {players.length === 0 && (
                  <tr>
                    <td className="p-4 text-green-100" colSpan={6}>
                      No picks have been saved in this league yet.
                    </td>
                  </tr>
                )}

                {players.map((player, index) => (
                  <tr key={player.user_id} className="border-t border-white/10">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-semibold">{player.username}</td>
                    <td className="p-4">{player.points}</td>
                    <td className="p-4">{player.picks}</td>
                    <td className="p-4">
                      {player.exactFinalScore > 0 ? "Yes" : "No"}
                    </td>
                    <td className="p-4">
                      {player.finalScoreError === null
                        ? "--"
                        : player.finalScoreError}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-green-100 mt-4">
          Tie-breakers: total points, exact Final score, then lowest Final score
          error.
        </p>
      </div>
    </main>
  );
}
