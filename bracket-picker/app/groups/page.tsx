"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type GroupStanding = {
  id: string;
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
};

export default function GroupsPage() {
  const [standings, setStandings] = useState<GroupStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStandings() {
      const { data, error } = await supabase
        .from("group_standings")
        .select("*")
        .order("group_name", { ascending: true })
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .order("goals_for", { ascending: false });

      if (error) {
        console.error(error);
        alert("Could not load group standings.");
        setLoading(false);
        return;
      }

      setStandings(data || []);
      setLoading(false);
    }

    loadStandings();
  }, []);

  const groupedStandings = standings.reduce<Record<string, GroupStanding[]>>(
    (groups, team) => {
      if (!groups[team.group_name]) {
        groups[team.group_name] = [];
      }

      groups[team.group_name].push(team);
      return groups;
    },
    {},
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading groups...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Group Standings</h1>
        <p className="text-green-100 mb-6">
          View group stage standings, points, goals, and tiebreakers.
        </p>

        <div className="space-y-8">
          {Object.keys(groupedStandings).length === 0 && (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
              <p className="text-green-100">No group standings found.</p>
            </div>
          )}

          {Object.entries(groupedStandings).map(([groupName, teams]) => (
            <div
              key={groupName}
              className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden"
            >
              <div className="bg-white/10 px-6 py-4">
                <h2 className="text-2xl font-bold">{groupName}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4">Team</th>
                      <th className="p-4">Pts</th>
                      <th className="p-4">P</th>
                      <th className="p-4">W</th>
                      <th className="p-4">D</th>
                      <th className="p-4">L</th>
                      <th className="p-4">GF</th>
                      <th className="p-4">GA</th>
                      <th className="p-4">GD</th>
                    </tr>
                  </thead>

                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.id} className="border-t border-white/10">
                        <td className="p-4 font-semibold">{team.team_name}</td>
                        <td className="p-4 font-bold">{team.points}</td>
                        <td className="p-4">{team.played}</td>
                        <td className="p-4">{team.wins}</td>
                        <td className="p-4">{team.draws}</td>
                        <td className="p-4">{team.losses}</td>
                        <td className="p-4">{team.goals_for}</td>
                        <td className="p-4">{team.goals_against}</td>
                        <td className="p-4">
                          {team.goal_difference > 0
                            ? `+${team.goal_difference}`
                            : team.goal_difference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
