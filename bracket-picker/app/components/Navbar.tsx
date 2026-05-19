"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

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

  function linkClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return `px-3 py-2 rounded-xl transition ${
      isActive
        ? "bg-white text-green-950 font-semibold"
        : "text-white hover:bg-white/10"
    }`;
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

          <div className="hidden md:flex gap-2 text-sm items-center flex-wrap justify-end">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>

            <Link href="/rules" className={linkClass("/rules")}>
              Rules
            </Link>

            <Link href="/picks" className={linkClass("/picks")}>
              Picks
            </Link>

            <Link href="/leaderboard" className={linkClass("/leaderboard")}>
              Leaderboard
            </Link>

            <Link href="/schedule" className={linkClass("/schedule")}>
              Schedule
            </Link>

            <Link href="/groups" className={linkClass("/groups")}>
              Groups
            </Link>

            <Link href="/bracket" className={linkClass("/bracket")}>
              Bracket
            </Link>

            <Link href="/league" className={linkClass("/league")}>
              Leagues
            </Link>

            <Link href="/profile" className={linkClass("/profile")}>
              Profile
            </Link>

            <Link href="/payment" className={linkClass("/payment")}>
              Payment
            </Link>

            {isAdmin && (
              <>
                <Link href="/admin" className={linkClass("/admin")}>
                  Admin
                </Link>

                <Link
                  href="/admin/matches"
                  className={linkClass("/admin/matches")}
                >
                  Edit Matches
                </Link>

                <Link
                  href="/admin/bracket"
                  className={linkClass("/admin/bracket")}
                >
                  Edit Bracket
                </Link>
              </>
            )}

            <button
              onClick={signOut}
              className="text-sm px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 grid gap-3 text-sm bg-white/10 border border-white/10 rounded-2xl p-4">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              href="/rules"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/rules")}
            >
              Rules
            </Link>

            <Link
              href="/picks"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/picks")}
            >
              Picks
            </Link>

            <Link
              href="/leaderboard"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/leaderboard")}
            >
              Leaderboard
            </Link>

            <Link
              href="/schedule"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/schedule")}
            >
              Schedule
            </Link>

            <Link
              href="/groups"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/groups")}
            >
              Groups
            </Link>

            <Link
              href="/bracket"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/bracket")}
            >
              Bracket
            </Link>

            <Link
              href="/league"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/league")}
            >
              Leagues
            </Link>

            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/profile")}
            >
              Profile
            </Link>

            <Link
              href="/payment"
              onClick={() => setMenuOpen(false)}
              className={linkClass("/payment")}
            >
              Payment
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={linkClass("/admin")}
                >
                  Admin
                </Link>

                <Link
                  href="/admin/matches"
                  onClick={() => setMenuOpen(false)}
                  className={linkClass("/admin/matches")}
                >
                  Edit Matches
                </Link>

                <Link
                  href="/admin/bracket"
                  onClick={() => setMenuOpen(false)}
                  className={linkClass("/admin/bracket")}
                >
                  Edit Bracket
                </Link>
              </>
            )}

            <button
              onClick={signOut}
              className="text-left px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
