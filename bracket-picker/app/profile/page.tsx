"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  username: string | null;
};

type League = {
  id: string;
  name: string;
  join_code: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email || "");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
      } else {
        setProfile(profileData);
      }

      const activeLeagueId = localStorage.getItem("activeLeagueId");

      if (activeLeagueId) {
        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("id, name, join_code")
          .eq("id", activeLeagueId)
          .single();

        if (leagueError) {
          console.error(leagueError);
        } else {
          setActiveLeague(leagueData);
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Profile</h1>
        <p className="text-green-100 mb-8">
          View your account and current league info.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Account</h2>

            <div className="space-y-3 text-green-100">
              <p>
                <span className="font-semibold text-white">Username:</span>{" "}
                {profile?.username || "No username"}
              </p>

              <p>
                <span className="font-semibold text-white">Email:</span> {email}
              </p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Active League</h2>

            {activeLeague ? (
              <div className="space-y-3 text-green-100">
                <p>
                  <span className="font-semibold text-white">League:</span>{" "}
                  {activeLeague.name}
                </p>

                <p>
                  <span className="font-semibold text-white">Join Code:</span>{" "}
                  {activeLeague.join_code}
                </p>

                <a
                  href="/league"
                  className="inline-block bg-white text-green-950 px-5 py-3 rounded-xl font-semibold mt-3"
                >
                  Change League
                </a>
              </div>
            ) : (
              <div>
                <p className="text-green-100 mb-4">
                  No active league selected.
                </p>

                <a
                  href="/league"
                  className="inline-block bg-white text-green-950 px-5 py-3 rounded-xl font-semibold"
                >
                  Choose League
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
