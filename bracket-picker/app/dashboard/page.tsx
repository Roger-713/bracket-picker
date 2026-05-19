"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  round: string | null;
  status: string;
};

type Prediction = {
  id: string;
  user_id: string;
  points_awarded: number | null;
};

type LeaderboardPlayer = {
  user_id: string;
  points: number;
  picks: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [leagueName, setLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [picksMade, setPicksMade] = useState(0);
  const [picksLeft, setPicksLeft] = useState(0);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [totalPool, setTotalPool] = useState(0);
  const [paidPlayers, setPaidPlayers] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
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
        console.error(membershipError);
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

      const leagueId = activeLeagueId;

      const { data: league } = await supabase
        .from("leagues")
        .select("name, join_code")
        .eq("id", leagueId)
        .single();

      if (league) {
        setLeagueName(league.name);
        setJoinCode(league.join_code);
      }

      const { data: payments, error: paymentsError } = await supabase
        .from("league_payments")
        .select("amount, payment_status")
        .eq("league_id", leagueId);

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

      const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select("id, home_team, away_team, start_time, round, status")
        .order("start_time", { ascending: true });

      if (matchError) {
        console.error(matchError);
        alert(matchError.message);
        setLoading(false);
        return;
      }

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("id, user_id, points_awarded")
        .eq("league_id", leagueId);

      if (predictionError) {
        console.error(predictionError);
        alert(predictionError.message);
        setLoading(false);
        return;
      }

      const userPredictions = (predictions || []).filter(
        (prediction) => prediction.user_id === user.id,
      );

      const userPoints = userPredictions.reduce(
        (total, prediction) => total + (prediction.points_awarded || 0),
        0,
      );

      setPoints(userPoints);
      setPicksMade(userPredictions.length);
      setPicksLeft(
        Math.max((matches || []).length - userPredictions.length, 0),
      );

      const upcomingMatch =
        (matches || []).find(
          (match) => new Date(match.start_time) > new Date(),
        ) || null;

      setNextMatch(upcomingMatch);

      const leaderboardMap = new Map<string, LeaderboardPlayer>();

      (predictions || []).forEach((prediction: Prediction) => {
        if (!leaderboardMap.has(prediction.user_id)) {
          leaderboardMap.set(prediction.user_id, {
            user_id: prediction.user_id,
            points: 0,
            picks: 0,
          });
        }

        const player = leaderboardMap.get(prediction.user_id)!;
        player.points += prediction.points_awarded || 0;
        player.picks += 1;
      });

      const sortedPlayers = Array.from(leaderboardMap.values()).sort(
        (a, b) => b.points - a.points || b.picks - a.picks,
      );

      const userRank =
        sortedPlayers.findIndex((player) => player.user_id === user.id) + 1;

      setRank(userRank > 0 ? userRank : null);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function copyJoinCode() {
    if (!joinCode) return;

    await navigator.clipboard.writeText(joinCode);
    alert("Join code copied!");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>

        {leagueName && (
          <p className="text-green-100 mb-6">League: {leagueName}</p>
        )}

        {joinCode && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-green-100">Share this code with friends</p>
              <h2 className="text-3xl font-bold tracking-widest">{joinCode}</h2>
            </div>

            <button
              type="button"
              onClick={copyJoinCode}
              className="bg-white text-green-950 px-6 py-3 rounded-xl font-semibold"
            >
              Copy Code
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Your Points</p>
            <h2 className="text-4xl font-bold">{points}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Your Rank</p>
            <h2 className="text-4xl font-bold">{rank ? `#${rank}` : "--"}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Picks Made</p>
            <h2 className="text-4xl font-bold">{picksMade}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Picks Left</p>
            <h2 className="text-4xl font-bold">{picksLeft}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Paid Players</p>
            <h2 className="text-4xl font-bold">{paidPlayers}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Prize Pool</p>
            <h2 className="text-4xl font-bold">${totalPool}</h2>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>

          <div className="flex flex-wrap gap-3">
            <a
              href="/rules"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              View Rules
            </a>

            <a
              href="/picks"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              Make Picks
            </a>

            <a
              href="/leaderboard"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              View Leaderboard
            </a>

            <a
              href="/payment"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              View Payment
            </a>

            <a
              href="/schedule"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              View Schedule
            </a>

            <a
              href="/league"
              className="border border-white px-5 py-3 rounded-xl font-semibold"
            >
              Change League
            </a>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-2">Next Match</h2>

          {nextMatch ? (
            <>
              <p className="text-green-100 mb-1">
                {nextMatch.round} •{" "}
                {new Date(nextMatch.start_time).toLocaleDateString()}
              </p>
              <p className="text-xl font-semibold">
                {nextMatch.home_team} vs {nextMatch.away_team}
              </p>
            </>
          ) : (
            <p className="text-green-100">No upcoming matches found.</p>
          )}
        </div>
      </div>
    </main>
  );
}
