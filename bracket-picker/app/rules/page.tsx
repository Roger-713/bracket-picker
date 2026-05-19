export default function RulesPage() {
  return (
    <main className="min-h-screen bg-green-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">League Rules</h1>
        <p className="text-green-100 mb-8">
          Here&apos;s how picks, points, payments, and tie-breakers work.
        </p>

        <div className="space-y-6">
          <section className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Scoring</h2>
            <ul className="list-disc list-inside space-y-2 text-green-100">
              <li>Each correct match winner pick is worth 1 point.</li>
              <li>Incorrect picks are worth 0 points.</li>
              <li>Group stage matches can be picked as either team or draw.</li>
              <li>Knockout/Final matches cannot be picked as a draw.</li>
            </ul>
          </section>

          <section className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Pick Deadlines</h2>
            <ul className="list-disc list-inside space-y-2 text-green-100">
              <li>Picks lock once the match starts.</li>
              <li>Once a match is locked, picks cannot be changed.</li>
              <li>Make sure your picks are saved before kickoff.</li>
            </ul>
          </section>

          <section className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Final Score Tie-Breaker</h2>
            <ul className="list-disc list-inside space-y-2 text-green-100">
              <li>The Final score guess is used only as a tie-breaker.</li>
              <li>
                The team you pick to win the Final must have the higher score.
              </li>
              <li>
                If players tie in points, exact Final score is used first.
              </li>
              <li>If still tied, lowest Final score error wins.</li>
            </ul>
          </section>

          <section className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Prize Pool</h2>
            <ul className="list-disc list-inside space-y-2 text-green-100">
              <li>
                Payments are handled outside the website and manually confirmed
                by the admin.
              </li>
              <li>Entry fees are tracked manually by the league admin.</li>
              <li>The prize pool only includes confirmed paid players.</li>
              <li>
                The league is winner takes all unless the admin announces
                otherwise.
              </li>
              <li>Payment status can be viewed on the Payment page.</li>
            </ul>
          </section>

          <section className="bg-white/10 border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-3">Important Note</h2>
            <p className="text-green-100">
              This site is for tracking a private friend league. Payments are
              not processed through the website, and all payment confirmations
              are handled manually by the league admin.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
