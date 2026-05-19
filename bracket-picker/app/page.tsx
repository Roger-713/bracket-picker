export default function Home() {
  return (
    <main className="min-h-screen bg-green-950 text-white flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">Bracket Picker</h1>
        <p className="text-lg text-green-100 mb-8">
          Pick winners, guess final scores, and compete with your friends all
          the way to the final.
        </p>

        <div className="flex gap-4 justify-center">
          <button className="bg-white text-green-950 px-6 py-3 rounded-xl font-semibold">
            Sign In
          </button>
          <button className="border border-white px-6 py-3 rounded-xl font-semibold">
            View Leaderboard
          </button>
        </div>
      </div>
    </main>
  );
}
