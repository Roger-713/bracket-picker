"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type LeagueMember = {
  league_id: string;
};

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  round: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  winner: string | null;
};

type PickForm = {
  picked_winner: string;
  predicted_home_score: string;
  predicted_away_score: string;
};

export default function PicksPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<string, PickForm>>({});
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
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

      const userLeagueId = activeLeagueId;
      setLeagueId(userLeagueId);

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .order("start_time", { ascending: true });

      if (matchError) {
        console.error(matchError);
        alert("Could not load matches.");
        setLoading(false);
        return;
      }

      setMatches(matchData || []);

      const { data: predictionData, error: predictionError } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("league_id", userLeagueId);

      if (predictionError) {
        console.error(predictionError);
        alert("Could not load your saved picks.");
      } else {
        const savedPicks: Record<string, PickForm> = {};

        predictionData?.forEach((prediction) => {
          savedPicks[prediction.match_id] = {
            picked_winner: prediction.picked_winner,
            predicted_home_score:
              prediction.predicted_home_score?.toString() || "",
            predicted_away_score:
              prediction.predicted_away_score?.toString() || "",
          };
        });

        setPicks(savedPicks);
      }

      setLoading(false);
    }

    loadPageData();
  }, []);

  function updatePick(matchId: string, field: keyof PickForm, value: string) {
    setPicks((current) => ({
      ...current,
      [matchId]: {
        picked_winner: current[matchId]?.picked_winner || "",
        predicted_home_score: current[matchId]?.predicted_home_score || "",
        predicted_away_score: current[matchId]?.predicted_away_score || "",
        [field]: value,
      },
    }));
  }

  function isMatchLocked(startTime: string) {
    return new Date() >= new Date(startTime);
  }

  function isFinalMatch(round: string | null) {
    return round?.toLowerCase() === "final";
  }

  function scoreMatchesWinner(
    match: Match,
    pickedWinner: string,
    homeScore: number,
    awayScore: number,
  ) {
    if (pickedWinner === match.home_team) {
      return homeScore > awayScore;
    }

    if (pickedWinner === match.away_team) {
      return awayScore > homeScore;
    }

    if (pickedWinner === "draw") {
      return homeScore === awayScore;
    }

    return false;
  }

  async function savePick(match: Match) {
    if (isMatchLocked(match.start_time)) {
      alert("This match has already started. Picks are locked.");
      return;
    }

    if (!leagueId) {
      alert("You need to join a league before saving picks.");
      window.location.href = "/join";
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You need to sign in before saving a pick.");
      window.location.href = "/login";
      return;
    }

    const pick = picks[match.id];

    if (!pick?.picked_winner) {
      alert("Pick a winner first.");
      return;
    }

    const finalMatch = isFinalMatch(match.round);

    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (finalMatch) {
      if (
        pick.predicted_home_score === "" ||
        pick.predicted_away_score === ""
      ) {
        alert("Enter your final score guess for the Final.");
        return;
      }

      homeScore = Number(pick.predicted_home_score);
      awayScore = Number(pick.predicted_away_score);

      if (homeScore < 0 || awayScore < 0) {
        alert("Scores cannot be negative.");
        return;
      }

      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
        alert("Scores must be whole numbers.");
        return;
      }

      if (
        !scoreMatchesWinner(match, pick.picked_winner, homeScore, awayScore)
      ) {
        alert("Your score guess must match the winner you picked.");
        return;
      }
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        league_id: leagueId,
        match_id: match.id,
        picked_winner: pick.picked_winner,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
      },
      {
        onConflict: "user_id,league_id,match_id",
      },
    );

    if (error) {
      console.error("Save pick error:", error);
      alert(error.message);
    } else {
      setMessage("Pick saved!");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading matches...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Make Your Picks</h1>
        {message && (
          <div className="bg-green-400 text-green-950 rounded-2xl p-4 mb-6 font-semibold">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {matches.length === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <p className="text-green-100">
                No matches found. Check Supabase or RLS settings.
              </p>
            </div>
          )}

          {matches.map((match) => {
            const currentPick = picks[match.id];
            const locked = isMatchLocked(match.start_time);
            const finalMatch = isFinalMatch(match.round);

            return (
              <div
                key={match.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-6"
              >
                <p className="text-green-100 mb-2">
                  {match.round} •{" "}
                  {new Date(match.start_time).toLocaleDateString()}
                </p>

                <h2 className="text-2xl font-bold mb-4">
                  {match.home_team} vs {match.away_team}
                </h2>

                {locked && (
                  <p className="text-sm text-red-200 mb-4">
                    Picks locked — this match has already started.
                  </p>
                )}

                {currentPick?.picked_winner && (
                  <p className="text-sm text-green-200 mb-4">
                    Saved pick: {currentPick.picked_winner}
                    {finalMatch &&
                      currentPick.predicted_home_score !== "" &&
                      currentPick.predicted_away_score !== "" &&
                      ` (${currentPick.predicted_home_score}-${currentPick.predicted_away_score})`}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      updatePick(match.id, "picked_winner", match.home_team)
                    }
                    className={`px-4 py-2 rounded-xl font-semibold ${
                      locked
                        ? "opacity-50 cursor-not-allowed border border-white/40"
                        : currentPick?.picked_winner === match.home_team
                          ? "bg-green-400 text-green-950"
                          : "bg-white text-green-950"
                    }`}
                  >
                    {match.home_team}
                  </button>

                  {!finalMatch && (
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() =>
                        updatePick(match.id, "picked_winner", "draw")
                      }
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        locked
                          ? "opacity-50 cursor-not-allowed border border-white/40"
                          : currentPick?.picked_winner === "draw"
                            ? "bg-green-400 text-green-950"
                            : "border border-white"
                      }`}
                    >
                      Draw
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      updatePick(match.id, "picked_winner", match.away_team)
                    }
                    className={`px-4 py-2 rounded-xl font-semibold ${
                      locked
                        ? "opacity-50 cursor-not-allowed border border-white/40"
                        : currentPick?.picked_winner === match.away_team
                          ? "bg-green-400 text-green-950"
                          : "border border-white"
                    }`}
                  >
                    {match.away_team}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {finalMatch && (
                    <>
                      <input
                        disabled={locked}
                        min={0}
                        className="w-24 rounded-xl px-3 py-2 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Home"
                        type="number"
                        value={currentPick?.predicted_home_score || ""}
                        onChange={(e) =>
                          updatePick(
                            match.id,
                            "predicted_home_score",
                            e.target.value,
                          )
                        }
                      />

                      <input
                        disabled={locked}
                        min={0}
                        className="w-24 rounded-xl px-3 py-2 text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Away"
                        type="number"
                        value={currentPick?.predicted_away_score || ""}
                        onChange={(e) =>
                          updatePick(
                            match.id,
                            "predicted_away_score",
                            e.target.value,
                          )
                        }
                      />
                    </>
                  )}

                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => savePick(match)}
                    className="bg-green-500 px-4 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locked ? "Locked" : "Save Pick"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
