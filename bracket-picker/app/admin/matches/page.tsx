"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

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

type MatchForm = {
  fifa_match_number: string;
  home_team: string;
  away_team: string;
  start_time: string;
  round: string;
  stage: string;
  group_name: string;
  venue: string;
  city: string;
  home_score: string;
  away_score: string;
  status: string;
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [forms, setForms] = useState<Record<string, MatchForm>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all");

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
      loadMatches();
    }

    checkAdminAndLoad();
  }, []);

  async function loadMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    const matchData = data || [];
    setMatches(matchData);

    const startingForms: Record<string, MatchForm> = {};

    matchData.forEach((match) => {
      startingForms[match.id] = {
        fifa_match_number: match.fifa_match_number?.toString() || "",
        home_team: match.home_team || "",
        away_team: match.away_team || "",
        start_time: match.start_time
          ? new Date(match.start_time).toISOString().slice(0, 16)
          : "",
        round: match.round || "",
        stage: match.stage || "",
        group_name: match.group_name || "",
        venue: match.venue || "",
        city: match.city || "",
        home_score: match.home_score?.toString() || "",
        away_score: match.away_score?.toString() || "",
        status: match.status || "scheduled",
      };
    });

    setForms(startingForms);
    setLoading(false);
  }

  function updateForm(matchId: string, field: keyof MatchForm, value: string) {
    setForms((current) => ({
      ...current,
      [matchId]: {
        fifa_match_number: current[matchId]?.fifa_match_number || "",
        home_team: current[matchId]?.home_team || "",
        away_team: current[matchId]?.away_team || "",
        start_time: current[matchId]?.start_time || "",
        round: current[matchId]?.round || "",
        stage: current[matchId]?.stage || "",
        group_name: current[matchId]?.group_name || "",
        venue: current[matchId]?.venue || "",
        city: current[matchId]?.city || "",
        home_score: current[matchId]?.home_score || "",
        away_score: current[matchId]?.away_score || "",
        status: current[matchId]?.status || "scheduled",
        [field]: value,
      },
    }));
  }

  function calculateWinner(
    homeTeam: string,
    awayTeam: string,
    homeScore: number | null,
    awayScore: number | null,
  ) {
    if (homeScore === null || awayScore === null) {
      return null;
    }

    if (homeScore > awayScore) return homeTeam;
    if (awayScore > homeScore) return awayTeam;
    return "draw";
  }

  async function saveMatch(match: Match) {
    const form = forms[match.id];

    if (!form) {
      alert("Form not found.");
      return;
    }

    if (!form.home_team.trim() || !form.away_team.trim()) {
      alert("Home team and away team are required.");
      return;
    }

    if (!form.start_time) {
      alert("Start time is required.");
      return;
    }

    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (form.home_score !== "") {
      homeScore = Number(form.home_score);
    }

    if (form.away_score !== "") {
      awayScore = Number(form.away_score);
    }

    if (
      (homeScore !== null && homeScore < 0) ||
      (awayScore !== null && awayScore < 0)
    ) {
      alert("Scores cannot be negative.");
      return;
    }

    if (
      (homeScore !== null && !Number.isInteger(homeScore)) ||
      (awayScore !== null && !Number.isInteger(awayScore))
    ) {
      alert("Scores must be whole numbers.");
      return;
    }

    if (
      (homeScore !== null && awayScore === null) ||
      (homeScore === null && awayScore !== null)
    ) {
      alert("Enter both scores, or leave both blank.");
      return;
    }

    const winner = calculateWinner(
      form.home_team.trim(),
      form.away_team.trim(),
      homeScore,
      awayScore,
    );

    const { error } = await supabase
      .from("matches")
      .update({
        fifa_match_number:
          form.fifa_match_number === "" ? null : Number(form.fifa_match_number),
        home_team: form.home_team.trim(),
        away_team: form.away_team.trim(),
        start_time: new Date(form.start_time).toISOString(),
        round: form.round.trim() || null,
        stage: form.stage.trim() || null,
        group_name: form.group_name.trim() || null,
        venue: form.venue.trim() || null,
        city: form.city.trim() || null,
        home_score: homeScore,
        away_score: awayScore,
        status: form.status,
        winner,
      })
      .eq("id", match.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Match updated!");
    loadMatches();
  }

  async function createMatch() {
    const { error } = await supabase.from("matches").insert({
      home_team: "TBD",
      away_team: "TBD",
      start_time: new Date().toISOString(),
      round: "Group Stage",
      stage: "Group Stage",
      status: "scheduled",
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("New match created!");
    loadMatches();
  }

  async function deleteMatch(matchId: string) {
    const confirmed = confirm(
      "Are you sure you want to delete this match? This may affect predictions.",
    );

    if (!confirmed) return;

    const { error } = await supabase.from("matches").delete().eq("id", matchId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Match deleted.");
    loadMatches();
  }

  async function recalculateGroupStandings() {
    const { data: groupMatches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("stage", "Group Stage")
      .eq("status", "finished");

    if (matchError) {
      console.error(matchError);
      alert(matchError.message);
      return;
    }

    const standings = new Map<
      string,
      {
        group_name: string;
        team_name: string;
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        goal_difference: number;
        points: number;
      }
    >();

    function getKey(groupName: string, teamName: string) {
      return `${groupName}-${teamName}`;
    }

    function ensureTeam(groupName: string, teamName: string) {
      const key = getKey(groupName, teamName);

      if (!standings.has(key)) {
        standings.set(key, {
          group_name: groupName,
          team_name: teamName,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        });
      }

      return standings.get(key)!;
    }

    for (const match of groupMatches || []) {
      if (
        !match.group_name ||
        match.home_score === null ||
        match.away_score === null
      ) {
        continue;
      }

      const home = ensureTeam(match.group_name, match.home_team);
      const away = ensureTeam(match.group_name, match.away_team);

      home.played += 1;
      away.played += 1;

      home.goals_for += match.home_score;
      home.goals_against += match.away_score;

      away.goals_for += match.away_score;
      away.goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (match.away_score > match.home_score) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    }

    const rows = Array.from(standings.values()).map((team) => ({
      ...team,
      goal_difference: team.goals_for - team.goals_against,
      updated_at: new Date().toISOString(),
    }));

    if (rows.length === 0) {
      alert("No finished group stage matches found.");
      return;
    }

    const { error: standingsError } = await supabase
      .from("group_standings")
      .upsert(rows, {
        onConflict: "group_name,team_name",
      });

    if (standingsError) {
      console.error(standingsError);
      alert(standingsError.message);
      return;
    }

    alert("Group standings recalculated!");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading match manager...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="text-green-100">
            You do not have permission to edit matches.
          </p>
        </div>
      </main>
    );
  }

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    if (filter === "scheduled") return match.status === "scheduled";
    if (filter === "live") return match.status === "live";
    if (filter === "finished") return match.status === "finished";
    if (filter === "group-stage") return match.stage === "Group Stage";
    if (filter === "knockout") return match.stage === "Knockout";
    if (filter === "final") return match.round === "Final";

    return true;
  });

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Match Manager</h1>
            <p className="text-green-100">
              Edit global World Cup match info, kickoff times, venues, scores,
              and status.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={recalculateGroupStandings}
              className="bg-green-500 px-6 py-3 rounded-xl font-semibold"
            >
              Recalculate Groups
            </button>

            <button
              type="button"
              onClick={createMatch}
              className="bg-white text-green-950 px-6 py-3 rounded-xl font-semibold"
            >
              Add Match
            </button>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-6">
          <p className="text-green-100 mb-3">Filter matches</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", value: "all" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Live", value: "live" },
              { label: "Finished", value: "finished" },
              { label: "Group Stage", value: "group-stage" },
              { label: "Knockout", value: "knockout" },
              { label: "Final", value: "final" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                  filter === option.value
                    ? "bg-white text-green-950"
                    : "border border-white text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredMatches.length === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <p className="text-green-100">
                No matches found for this filter.
              </p>
            </div>
          )}
          {filteredMatches.map((match) => {
            const form = forms[match.id];

            return (
              <div
                key={match.id}
                className="bg-white/10 border border-white/20 rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-green-100">
                      {match.fifa_match_number
                        ? `Match ${match.fifa_match_number}`
                        : "Match"}
                    </p>
                    <h2 className="text-2xl font-bold">
                      {match.home_team} vs {match.away_team}
                    </h2>
                  </div>

                  <div className="text-sm text-green-100">
                    Status: {match.status}
                    {match.winner ? ` • Winner: ${match.winner}` : ""}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-green-100">
                      FIFA Match #
                    </label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      type="number"
                      min={1}
                      value={form?.fifa_match_number || ""}
                      onChange={(e) =>
                        updateForm(
                          match.id,
                          "fifa_match_number",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Home Team</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      value={form?.home_team || ""}
                      onChange={(e) =>
                        updateForm(match.id, "home_team", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Away Team</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      value={form?.away_team || ""}
                      onChange={(e) =>
                        updateForm(match.id, "away_team", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Start Time</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      type="datetime-local"
                      value={form?.start_time || ""}
                      onChange={(e) =>
                        updateForm(match.id, "start_time", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Round</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      placeholder="Group Stage, Final, etc."
                      value={form?.round || ""}
                      onChange={(e) =>
                        updateForm(match.id, "round", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Stage</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      placeholder="Group Stage, Knockout"
                      value={form?.stage || ""}
                      onChange={(e) =>
                        updateForm(match.id, "stage", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Group</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      placeholder="Group A"
                      value={form?.group_name || ""}
                      onChange={(e) =>
                        updateForm(match.id, "group_name", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Venue</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      placeholder="Stadium name"
                      value={form?.venue || ""}
                      onChange={(e) =>
                        updateForm(match.id, "venue", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">City</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      placeholder="City"
                      value={form?.city || ""}
                      onChange={(e) =>
                        updateForm(match.id, "city", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Home Score</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      type="number"
                      min={0}
                      value={form?.home_score || ""}
                      onChange={(e) =>
                        updateForm(match.id, "home_score", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Away Score</label>
                    <input
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      type="number"
                      min={0}
                      value={form?.away_score || ""}
                      onChange={(e) =>
                        updateForm(match.id, "away_score", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-green-100">Status</label>
                    <select
                      className="w-full rounded-xl px-4 py-3 text-black mt-1"
                      value={form?.status || "scheduled"}
                      onChange={(e) =>
                        updateForm(match.id, "status", e.target.value)
                      }
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="live">live</option>
                      <option value="finished">finished</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => saveMatch(match)}
                    className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
                  >
                    Save Match
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMatch(match.id)}
                    className="bg-red-500 px-4 py-2 rounded-xl font-semibold"
                  >
                    Delete Match
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
