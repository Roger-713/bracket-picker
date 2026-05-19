"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

type Prediction = {
  id: string;
  picked_winner: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
};

type ScoreForm = {
  home_score: string;
  away_score: string;
};

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreForm>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAndLoad() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.id !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      getMatches();
    }

    checkAdminAndLoad();
  }, []);

  async function getMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setMatches(data || []);

      const startingScores: Record<string, ScoreForm> = {};

      (data || []).forEach((match) => {
        startingScores[match.id] = {
          home_score: match.home_score?.toString() || "",
          away_score: match.away_score?.toString() || "",
        };
      });

      setScores(startingScores);
    }

    setLoading(false);
  }

  function updateScore(matchId: string, field: keyof ScoreForm, value: string) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home_score: current[matchId]?.home_score || "",
        away_score: current[matchId]?.away_score || "",
        [field]: value,
      },
    }));
  }

  function isFinalMatch(round: string | null) {
    return round?.toLowerCase() === "final";
  }

  function getWinner(match: Match, homeScore: number, awayScore: number) {
    if (homeScore > awayScore) return match.home_team;
    if (awayScore > homeScore) return match.away_team;
    return "draw";
  }

  function getScoreError(
    prediction: Prediction,
    actualHomeScore: number,
    actualAwayScore: number,
  ) {
    if (
      prediction.predicted_home_score === null ||
      prediction.predicted_away_score === null
    ) {
      return null;
    }

    return (
      Math.abs(prediction.predicted_home_score - actualHomeScore) +
      Math.abs(prediction.predicted_away_score - actualAwayScore)
    );
  }

  async function saveResult(match: Match) {
    const score = scores[match.id];

    if (!score || score.home_score === "" || score.away_score === "") {
      alert("Enter both scores first.");
      return;
    }

    const homeScore = Number(score.home_score);
    const awayScore = Number(score.away_score);

    if (homeScore < 0 || awayScore < 0) {
      alert("Scores cannot be negative.");
      return;
    }

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      alert("Scores must be whole numbers.");
      return;
    }

    const winner = getWinner(match, homeScore, awayScore);
    const finalMatch = isFinalMatch(match.round);

    if (finalMatch && winner === "draw") {
      alert(
        "The Final cannot end in a draw. Enter the final result after extra time/penalties using the winning team as higher.",
      );
      return;
    }

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        winner,
        status: "finished",
      })
      .eq("id", match.id);

    if (matchError) {
      console.error(matchError);
      alert(matchError.message);
      return;
    }

    const { data: predictions, error: predictionError } = await supabase
      .from("predictions")
      .select("id, picked_winner, predicted_home_score, predicted_away_score")
      .eq("match_id", match.id);

    if (predictionError) {
      console.error(predictionError);
      alert(predictionError.message);
      return;
    }

    for (const prediction of predictions || []) {
      const points = prediction.picked_winner === winner ? 1 : 0;

      let exactScoreCorrect = false;
      let scoreError: number | null = null;

      if (finalMatch) {
        exactScoreCorrect =
          prediction.predicted_home_score === homeScore &&
          prediction.predicted_away_score === awayScore;

        scoreError = getScoreError(prediction, homeScore, awayScore);
      }

      const { error: updateError } = await supabase
        .from("predictions")
        .update({
          points_awarded: points,
          exact_score_correct: exactScoreCorrect,
          score_error: scoreError,
        })
        .eq("id", prediction.id);

      if (updateError) {
        console.error(updateError);
        alert(updateError.message);
        return;
      }
    }

    alert("Result saved and points updated!");
    getMatches();
  }

  async function recalculateAllPoints() {
    const { data: finishedMatches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished");

    if (matchError) {
      console.error(matchError);
      alert(matchError.message);
      return;
    }

    if (!finishedMatches || finishedMatches.length === 0) {
      alert("No finished matches found.");
      return;
    }

    for (const match of finishedMatches) {
      if (
        match.home_score === null ||
        match.away_score === null ||
        !match.winner
      ) {
        continue;
      }

      const finalMatch = isFinalMatch(match.round);

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("id, picked_winner, predicted_home_score, predicted_away_score")
        .eq("match_id", match.id);

      if (predictionError) {
        console.error(predictionError);
        alert(predictionError.message);
        return;
      }

      for (const prediction of predictions || []) {
        const points = prediction.picked_winner === match.winner ? 1 : 0;

        let exactScoreCorrect = false;
        let scoreError: number | null = null;

        if (finalMatch) {
          exactScoreCorrect =
            prediction.predicted_home_score === match.home_score &&
            prediction.predicted_away_score === match.away_score;

          scoreError = getScoreError(
            prediction,
            match.home_score,
            match.away_score,
          );
        }

        const { error: updateError } = await supabase
          .from("predictions")
          .update({
            points_awarded: points,
            exact_score_correct: exactScoreCorrect,
            score_error: scoreError,
          })
          .eq("id", prediction.id);

        if (updateError) {
          console.error(updateError);
          alert(updateError.message);
          return;
        }
      }
    }

    alert("All points recalculated!");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading admin...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="text-green-100">
            You do not have permission to update match scores.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Admin</h1>
        <p className="text-green-100 mb-6">
          Enter final scores to update match results and leaderboard points.
        </p>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-2">Admin Tools</h2>
          <p className="text-green-100 mb-4">
            Use this if you edited match scores and need to refresh the
            leaderboard.
          </p>

          <button
            type="button"
            onClick={recalculateAllPoints}
            className="bg-white text-green-950 px-6 py-3 rounded-xl font-semibold"
          >
            Recalculate All Points
          </button>
        </div>

        <div className="space-y-4">
          {matches.map((match) => {
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

                <h2 className="text-2xl font-bold mb-2">
                  {match.home_team} vs {match.away_team}
                </h2>

                <p className="text-sm text-green-100 mb-2">
                  Status: {match.status}
                  {match.winner ? ` • Winner: ${match.winner}` : ""}
                </p>

                {finalMatch && (
                  <p className="text-sm text-yellow-100 mb-4">
                    Final match: exact score is used only as the tournament
                    tie-breaker. The Final cannot be saved as a draw.
                  </p>
                )}

                {!finalMatch && (
                  <p className="text-sm text-green-100 mb-4">
                    Regular match: points are awarded by winner/draw only.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span>{match.home_team}</span>
                    <input
                      className="w-20 rounded-xl px-3 py-2 text-black"
                      type="number"
                      min={0}
                      value={scores[match.id]?.home_score || ""}
                      onChange={(e) =>
                        updateScore(match.id, "home_score", e.target.value)
                      }
                    />
                  </label>

                  <span className="font-bold">-</span>

                  <label className="flex items-center gap-2">
                    <input
                      className="w-20 rounded-xl px-3 py-2 text-black"
                      type="number"
                      min={0}
                      value={scores[match.id]?.away_score || ""}
                      onChange={(e) =>
                        updateScore(match.id, "away_score", e.target.value)
                      }
                    />
                    <span>{match.away_team}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => saveResult(match)}
                    className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
                  >
                    Save Result
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
