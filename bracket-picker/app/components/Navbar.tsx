"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
        setIsAdmin(true);
      }
    }

    checkAdmin();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="bg-green-950 text-white border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-bold text-xl">
            World Cup Pick&apos;em
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden border border-white/20 px-4 py-2 rounded-xl"
          >
            Menu
          </button>

          <div className="hidden md:flex gap-5 text-sm items-center">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/rules">Rules</Link>
            <Link href="/picks">Picks</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/schedule">Schedule</Link>
            <Link href="/groups">Groups</Link>
            <Link href="/bracket">Bracket</Link>
            <Link href="/league">Leagues</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/payment">Payment</Link>

            {isAdmin && (
              <>
                <Link href="/admin">Admin</Link>
                <Link href="/admin/matches">Edit Matches</Link>
                <Link href="/admin/bracket">Edit Bracket</Link>
              </>
            )}

            <button onClick={signOut} className="text-sm">
              Sign Out
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 grid gap-3 text-sm bg-white/10 border border-white/10 rounded-2xl p-4">
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>

            <Link href="/rules" onClick={() => setMenuOpen(false)}>
              Rules
            </Link>

            <Link href="/picks" onClick={() => setMenuOpen(false)}>
              Picks
            </Link>

            <Link href="/leaderboard" onClick={() => setMenuOpen(false)}>
              Leaderboard
            </Link>

            <Link href="/schedule" onClick={() => setMenuOpen(false)}>
              Schedule
            </Link>

            <Link href="/groups" onClick={() => setMenuOpen(false)}>
              Groups
            </Link>

            <Link href="/bracket" onClick={() => setMenuOpen(false)}>
              Bracket
            </Link>

            <Link href="/league" onClick={() => setMenuOpen(false)}>
              Leagues
            </Link>

            <Link href="/profile" onClick={() => setMenuOpen(false)}>
              Profile
            </Link>

            <Link href="/payment" onClick={() => setMenuOpen(false)}>
              Payment
            </Link>

            {isAdmin && (
              <>
                <Link href="/admin" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>

                <Link href="/admin/matches" onClick={() => setMenuOpen(false)}>
                  Edit Matches
                </Link>

                <Link href="/admin/bracket" onClick={() => setMenuOpen(false)}>
                  Edit Bracket
                </Link>
              </>
            )}

            <button onClick={signOut} className="text-left">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
