"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type League = {
  id: string;
  name: string;
  entry_fee: number | null;
  payout_type: string | null;
};

type LeagueMember = {
  user_id: string;
};

type Profile = {
  id: string;
  username: string | null;
};

type LeaguePayment = {
  user_id: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
};

type PaymentRow = {
  user_id: string;
  username: string;
  amount: number;
  payment_status: string;
  payment_method: string | null;
};

export default function PaymentPage() {
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<League | null>(null);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [entryFeeInput, setEntryFeeInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPaymentPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
        setIsAdmin(true);
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

      const leagueId = activeLeagueId;

      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("id, name, entry_fee, payout_type")
        .eq("id", leagueId)
        .single();

      if (leagueError) {
        console.error(leagueError);
        alert("Could not load league.");
        setLoading(false);
        return;
      }

      setLeague(leagueData);
      setEntryFeeInput(leagueData.entry_fee?.toString() || "0");

      const { data: members, error: membersError } = await supabase
        .from("league_members")
        .select("user_id")
        .eq("league_id", leagueId);

      if (membersError) {
        console.error(membersError);
        alert("Could not load league members.");
        setLoading(false);
        return;
      }

      const userIds = (members || []).map(
        (member: LeagueMember) => member.user_id,
      );

      let profiles: Profile[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profileError) {
          console.error(profileError);
          alert("Could not load profiles.");
          setLoading(false);
          return;
        }

        profiles = profileData || [];
      }

      const { data: payments, error: paymentsError } = await supabase
        .from("league_payments")
        .select("user_id, amount, payment_status, payment_method")
        .eq("league_id", leagueId);

      if (paymentsError) {
        console.error(paymentsError);
        alert("Could not load payments.");
        setLoading(false);
        return;
      }

      const profileMap = new Map<string, string>();
      profiles.forEach((profile) => {
        profileMap.set(profile.id, profile.username || "Unknown Player");
      });

      const paymentMap = new Map<string, LeaguePayment>();
      (payments || []).forEach((payment: LeaguePayment) => {
        paymentMap.set(payment.user_id, payment);
      });

      const paymentRows: PaymentRow[] = userIds.map((userId) => {
        const payment = paymentMap.get(userId);

        return {
          user_id: userId,
          username: profileMap.get(userId) || "Unknown Player",
          amount: payment?.amount || 0,
          payment_status: payment?.payment_status || "unpaid",
          payment_method: payment?.payment_method || null,
        };
      });

      setRows(paymentRows);
      setLoading(false);
    }

    loadPaymentPage();
  }, []);

  function showMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  async function markAsPaid(userId: string) {
    if (!league) {
      alert("League not loaded.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
      alert("Only the admin can confirm payments.");
      return;
    }

    const amount = Number(league.entry_fee || 0);

    const { error } = await supabase.from("league_payments").upsert(
      {
        league_id: league.id,
        user_id: userId,
        amount,
        payment_status: "paid",
        payment_method: paymentMethod,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      },
      {
        onConflict: "league_id,user_id",
      },
    );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    showMessage("Payment marked as paid.");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  async function markAsUnpaid(userId: string) {
    if (!league) {
      alert("League not loaded.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
      alert("Only the admin can update payments.");
      return;
    }

    const { error } = await supabase.from("league_payments").upsert(
      {
        league_id: league.id,
        user_id: userId,
        amount: 0,
        payment_status: "unpaid",
        payment_method: null,
        confirmed_by: null,
        confirmed_at: null,
      },
      {
        onConflict: "league_id,user_id",
      },
    );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    showMessage("Payment marked as unpaid.");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  async function updateEntryFee() {
    if (!league) {
      alert("League not loaded.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== process.env.NEXT_PUBLIC_ADMIN_USER_ID) {
      alert("Only the admin can update the entry fee.");
      return;
    }

    const newEntryFee = Number(entryFeeInput);

    if (newEntryFee < 0) {
      alert("Entry fee cannot be negative.");
      return;
    }

    const { error } = await supabase
      .from("leagues")
      .update({
        entry_fee: newEntryFee,
      })
      .eq("id", league.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    showMessage("Entry fee updated!");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-green-950 text-white flex items-center justify-center">
        <p>Loading payment info...</p>
      </main>
    );
  }

  const entryFee = Number(league?.entry_fee || 0);
  const paidRows = rows.filter((row) => row.payment_status === "paid");
  const totalPool = paidRows.reduce(
    (total, row) => total + Number(row.amount || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Payment</h1>

        {league && <p className="text-green-100 mb-6">League: {league.name}</p>}

        {message && (
          <div className="bg-green-400 text-green-950 rounded-2xl p-4 mb-6 font-semibold">
            {message}
          </div>
        )}

        {isAdmin && league && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">Admin Payment Settings</h2>
            <p className="text-green-100 mb-4">
              Update the entry fee for this league.
            </p>

            <div className="mt-6">
              <label className="flex flex-col gap-1 max-w-xs">
                <span className="text-sm text-green-100">
                  Payment Method for Mark Paid
                </span>

                <select
                  className="rounded-xl px-4 py-3 text-black"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                  <option value="cash_app">Cash App</option>
                  <option value="apple_cash">Apple Cash</option>
                  <option value="cash">Cash</option>
                </select>
              </label>

              <p className="text-sm text-green-100 mt-2">
                Select this before clicking Mark Paid for a player.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-green-100">Entry Fee</span>
                <input
                  className="w-32 rounded-xl px-4 py-3 text-black"
                  type="number"
                  min={0}
                  value={entryFeeInput}
                  onChange={(e) => setEntryFeeInput(e.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={updateEntryFee}
                className="bg-green-500 px-5 py-3 rounded-xl font-semibold"
              >
                Update Entry Fee
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Entry Fee</p>
            <h2 className="text-3xl font-bold">${entryFee}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Paid Players</p>
            <h2 className="text-3xl font-bold">
              {paidRows.length}/{rows.length}
            </h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Total Pool</p>
            <h2 className="text-3xl font-bold">${totalPool}</h2>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <p className="text-green-100">Payout</p>
            <h2 className="text-xl font-bold">Winner Takes All</h2>
          </div>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  {isAdmin && <th className="p-4">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td
                      className="p-4 text-green-100"
                      colSpan={isAdmin ? 5 : 4}
                    >
                      No league members found.
                    </td>
                  </tr>
                )}

                {rows.map((row) => (
                  <tr key={row.user_id} className="border-t border-white/10">
                    <td className="p-4 font-semibold">{row.username}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          row.payment_status === "paid"
                            ? "bg-green-400 text-green-950"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {row.payment_status}
                      </span>
                    </td>
                    <td className="p-4">${row.amount}</td>
                    <td className="p-4">{row.payment_method || "--"}</td>
                    {isAdmin && (
                      <td className="p-4">
                        {row.payment_status === "paid" ? (
                          <div className="flex items-center gap-3">
                            <span className="text-green-200 text-sm">
                              Confirmed
                            </span>

                            <button
                              type="button"
                              onClick={() => markAsUnpaid(row.user_id)}
                              className="bg-red-500 px-4 py-2 rounded-xl font-semibold text-sm"
                            >
                              Mark Unpaid
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markAsPaid(row.user_id)}
                            className="bg-green-500 px-4 py-2 rounded-xl font-semibold text-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-300/10 border border-yellow-300/30 rounded-2xl p-5 mt-6">
          <h2 className="text-lg font-bold text-yellow-100 mb-2">
            Payment Disclaimer
          </h2>

          <p className="text-sm text-yellow-50 leading-relaxed">
            Payments are not processed through this website. This page is only
            used by the league admin to manually track who has paid outside the
            app. The prize pool shown is based only on payments marked as
            confirmed by the admin.
          </p>
        </div>
      </div>
    </main>
  );
}
