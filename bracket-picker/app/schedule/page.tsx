"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Match = {
  id: string;
  fifa_match_number: number | null;
  home_team: string;
  away_team: string;
  start_time: string;
  round: string | null;
  stage: string | null;
  group_name: string | null;
  venue: string | null;
  city: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  winner: string | null;
};

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, fifa_match_number, home_team, away_team, start_time, round, stage, group_name, venue, city, home_score, away_score, status, winner",
        )
        .order("start_time", { ascending: true });

      if (error) {
        console.error(error);
        alert("Could not load schedule.");
        setLoading(false);
        return;
      }

      setMatches(data || []);
      setLoading(false);
    }

    loadMatches();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading schedule...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">World Cup Schedule</h1>
        <p className="text-green-100 mb-6">
          View the official match schedule, scores, venues, and match status.
        </p>

        <div className="space-y-4">
          {matches.length === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <p className="text-green-100">No matches found.</p>
            </div>
          )}

          {matches.map((match) => {
            const hasScore =
              match.home_score !== null && match.away_score !== null;

            return (
              <div
                key={match.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-green-100 mb-2">
                      {match.fifa_match_number
                        ? `Match ${match.fifa_match_number} • `
                        : ""}
                      {match.round || match.stage || "Match"}{" "}
                      {match.group_name ? `• ${match.group_name}` : ""}
                    </p>

                    <h2 className="text-2xl font-bold">
                      {match.home_team} vs {match.away_team}
                    </h2>

                    <p className="text-green-100 mt-2">
                      {new Date(match.start_time).toLocaleString()}
                    </p>

                    {(match.venue || match.city) && (
                      <p className="text-green-100">
                        {match.venue || "Venue TBD"}
                        {match.city ? ` • ${match.city}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
                        match.status === "finished"
                          ? "bg-green-400 text-green-950"
                          : match.status === "live"
                            ? "bg-red-400 text-red-950"
                            : "bg-white/10 text-white"
                      }`}
                    >
                      {match.status}
                    </span>

                    {hasScore && (
                      <p className="text-3xl font-bold">
                        {match.home_score} - {match.away_score}
                      </p>
                    )}

                    {match.winner && (
                      <p className="text-green-100 mt-1">
                        Winner: {match.winner}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
