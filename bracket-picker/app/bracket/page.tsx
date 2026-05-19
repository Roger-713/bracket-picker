"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

const roundOrder = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

export default function BracketPage() {
  const [slots, setSlots] = useState<BracketSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBracket() {
      const { data, error } = await supabase
        .from("bracket_slots")
        .select("*")
        .order("slot_number", { ascending: true });

      if (error) {
        console.error(error);
        alert("Could not load bracket.");
        setLoading(false);
        return;
      }

      setSlots(data || []);
      setLoading(false);
    }

    loadBracket();
  }, []);

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
        <p>Loading bracket...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">World Cup Bracket</h1>
        <p className="text-green-100 mb-6">
          Follow the knockout stage from the Round of 32 to the Final.
        </p>

        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[1000px]">
            {roundOrder.map((round) => {
              const roundSlots = groupedSlots[round] || [];

              return (
                <div key={round} className="space-y-4">
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                    <h2 className="font-bold text-lg">{round}</h2>
                  </div>

                  {roundSlots.length === 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-green-100">
                      No matches yet
                    </div>
                  )}

                  {roundSlots.map((slot) => {
                    const hasScore =
                      slot.team_a_score !== null && slot.team_b_score !== null;

                    return (
                      <div
                        key={slot.id}
                        className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden"
                      >
                        <div className="bg-white/10 px-4 py-2">
                          <p className="text-sm text-green-100">
                            Match {slot.slot_number}
                          </p>
                        </div>

                        <div className="p-4 space-y-3">
                          <div
                            className={`flex justify-between gap-3 ${
                              slot.winner === slot.team_a
                                ? "text-green-300 font-bold"
                                : ""
                            }`}
                          >
                            <span>{slot.team_a || "TBD"}</span>
                            {hasScore && <span>{slot.team_a_score}</span>}
                          </div>

                          <div
                            className={`flex justify-between gap-3 ${
                              slot.winner === slot.team_b
                                ? "text-green-300 font-bold"
                                : ""
                            }`}
                          >
                            <span>{slot.team_b || "TBD"}</span>
                            {hasScore && <span>{slot.team_b_score}</span>}
                          </div>

                          {slot.winner && (
                            <p className="text-sm text-green-100 border-t border-white/10 pt-3">
                              Winner: {slot.winner}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-green-100 mt-4">
          Bracket teams will update as knockout matchups are confirmed.
        </p>
      </div>
    </main>
  );
}
