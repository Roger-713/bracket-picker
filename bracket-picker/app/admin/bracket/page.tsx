"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type BracketSlot = {
  id: string;
  round: string;
  slot_number: number;
  team_a: string | null;
  team_b: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  winner: string | null;
};

type BracketForm = {
  team_a: string;
  team_b: string;
  team_a_score: string;
  team_b_score: string;
};

const roundOrder = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export default function AdminBracketPage() {
  const [slots, setSlots] = useState<BracketSlot[]>([]);
  const [forms, setForms] = useState<Record<string, BracketForm>>({});
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
      loadBracketSlots();
    }

    checkAdminAndLoad();
  }, []);

  async function loadBracketSlots() {
    const { data, error } = await supabase
      .from("bracket_slots")
      .select("*")
      .order("round", { ascending: true })
      .order("slot_number", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    const slotData = data || [];
    setSlots(slotData);

    const startingForms: Record<string, BracketForm> = {};

    slotData.forEach((slot) => {
      startingForms[slot.id] = {
        team_a: slot.team_a || "",
        team_b: slot.team_b || "",
        team_a_score: slot.team_a_score?.toString() || "",
        team_b_score: slot.team_b_score?.toString() || "",
      };
    });

    setForms(startingForms);
    setLoading(false);
  }

  function updateForm(slotId: string, field: keyof BracketForm, value: string) {
    setForms((current) => ({
      ...current,
      [slotId]: {
        team_a: current[slotId]?.team_a || "",
        team_b: current[slotId]?.team_b || "",
        team_a_score: current[slotId]?.team_a_score || "",
        team_b_score: current[slotId]?.team_b_score || "",
        [field]: value,
      },
    }));
  }

  function calculateWinner(
    teamA: string,
    teamB: string,
    teamAScore: number | null,
    teamBScore: number | null,
  ) {
    if (teamAScore === null || teamBScore === null) {
      return null;
    }

    if (teamAScore > teamBScore) return teamA;
    if (teamBScore > teamAScore) return teamB;

    return null;
  }

  async function saveSlot(slot: BracketSlot) {
    const form = forms[slot.id];

    if (!form) {
      alert("Form not found.");
      return;
    }

    const teamA = form.team_a.trim() || null;
    const teamB = form.team_b.trim() || null;

    let teamAScore: number | null = null;
    let teamBScore: number | null = null;

    if (form.team_a_score !== "") {
      teamAScore = Number(form.team_a_score);
    }

    if (form.team_b_score !== "") {
      teamBScore = Number(form.team_b_score);
    }

    if (
      (teamAScore !== null && teamAScore < 0) ||
      (teamBScore !== null && teamBScore < 0)
    ) {
      alert("Scores cannot be negative.");
      return;
    }

    if (
      (teamAScore !== null && !Number.isInteger(teamAScore)) ||
      (teamBScore !== null && !Number.isInteger(teamBScore))
    ) {
      alert("Scores must be whole numbers.");
      return;
    }

    if (
      (teamAScore !== null && teamBScore === null) ||
      (teamAScore === null && teamBScore !== null)
    ) {
      alert("Enter both scores, or leave both blank.");
      return;
    }

    const winner =
      teamA && teamB
        ? calculateWinner(teamA, teamB, teamAScore, teamBScore)
        : null;

    if (teamAScore !== null && teamBScore !== null && !winner) {
      alert("Knockout bracket matches cannot end in a draw.");
      return;
    }

    const { error } = await supabase
      .from("bracket_slots")
      .update({
        team_a: teamA,
        team_b: teamB,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        winner,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slot.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Bracket slot updated!");
    loadBracketSlots();
  }

  const groupedSlots = slots.reduce<Record<string, BracketSlot[]>>(
    (groups, slot) => {
      if (!groups[slot.round]) {
        groups[slot.round] = [];
      }

      groups[slot.round].push(slot);
      return groups;
    },
    {},
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading bracket editor...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="text-green-100">
            You do not have permission to edit the bracket.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Admin Bracket Editor</h1>
        <p className="text-green-100 mb-6">
          Update bracket teams, scores, and winners.
        </p>

        <div className="space-y-8">
          {roundOrder.map((round) => {
            const roundSlots = groupedSlots[round] || [];

            return (
              <section key={round}>
                <h2 className="text-2xl font-bold mb-4">{round}</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {roundSlots.length === 0 && (
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
                      <p className="text-green-100">No slots yet.</p>
                    </div>
                  )}

                  {roundSlots.map((slot) => {
                    const form = forms[slot.id];

                    return (
                      <div
                        key={slot.id}
                        className="bg-white/10 border border-white/20 rounded-2xl p-6"
                      >
                        <p className="text-green-100 mb-3">
                          Slot {slot.slot_number}
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-green-100">
                              Team A
                            </label>
                            <input
                              className="w-full rounded-xl px-4 py-3 text-black mt-1"
                              value={form?.team_a || ""}
                              onChange={(e) =>
                                updateForm(slot.id, "team_a", e.target.value)
                              }
                              placeholder="Team A"
                            />
                          </div>

                          <div>
                            <label className="text-sm text-green-100">
                              Team B
                            </label>
                            <input
                              className="w-full rounded-xl px-4 py-3 text-black mt-1"
                              value={form?.team_b || ""}
                              onChange={(e) =>
                                updateForm(slot.id, "team_b", e.target.value)
                              }
                              placeholder="Team B"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-green-100">
                                Team A Score
                              </label>
                              <input
                                className="w-full rounded-xl px-4 py-3 text-black mt-1"
                                type="number"
                                min={0}
                                value={form?.team_a_score || ""}
                                onChange={(e) =>
                                  updateForm(
                                    slot.id,
                                    "team_a_score",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="text-sm text-green-100">
                                Team B Score
                              </label>
                              <input
                                className="w-full rounded-xl px-4 py-3 text-black mt-1"
                                type="number"
                                min={0}
                                value={form?.team_b_score || ""}
                                onChange={(e) =>
                                  updateForm(
                                    slot.id,
                                    "team_b_score",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {slot.winner && (
                            <p className="text-green-200">
                              Current winner: {slot.winner}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => saveSlot(slot)}
                            className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
                          >
                            Save Slot
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
