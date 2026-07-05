import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 prose prose-invert prose-zinc max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Use</h1>
      <p className="text-sm text-amber-400/90 mb-8 not-prose">
        This is a plain-language beta policy, not legal advice.
      </p>

      <section className="space-y-4 text-zinc-300 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold text-white">Beta software</h2>
        <p>
          Companion Passport is experimental beta software. Features may change, break, or
          be removed without notice. Use it at your own discretion.
        </p>

        <h2 className="text-xl font-semibold text-white">No crisis support</h2>
        <p>
          This app is not a crisis service. If you are in danger or need immediate help,
          contact local emergency services or a qualified professional. Do not rely on the
          companion for emergencies.
        </p>

        <h2 className="text-xl font-semibold text-white">No professional advice</h2>
        <p>
          The companion does not provide medical, legal, financial, or therapeutic advice.
          AI responses may be incorrect or inappropriate. Always verify important
          information with qualified humans.
        </p>

        <h2 className="text-xl font-semibold text-white">Not a replacement for relationships</h2>
        <p>
          Companion Passport is a tool for exploration and personalization. It is not a
          substitute for real human connection, friendship, or professional care.
        </p>

        <h2 className="text-xl font-semibold text-white">Your responsibility</h2>
        <p>
          You are responsible for what you share in chat, what memories you approve, and
          how you use AI mode. Do not share passwords, API keys, or sensitive personal
          data you would not want processed by an AI provider.
        </p>

        <h2 className="text-xl font-semibold text-white">AI may be wrong</h2>
        <p>
          AI responses are generated probabilistically and may be inaccurate, biased, or
          nonsensical. Memory suggestions may miss context or suggest incorrect facts.
          Review everything before approving.
        </p>

        <h2 className="text-xl font-semibold text-white">Adult-only use</h2>
        <p>
          You must be 18 or older to use this beta. We do not support minors or explicit
          sexual content in this product.
        </p>

        <h2 className="text-xl font-semibold text-white">Robot waitlist</h2>
        <p>
          Joining the robot waitlist expresses interest in a possible future product. It
          does not guarantee availability, pricing, timing, or features. Physical
          companions remain exploratory.
        </p>

        <p className="text-zinc-500 pt-4">
          By using Companion Passport during the beta, you acknowledge these limitations.
        </p>

        <p className="not-prose pt-4 flex gap-4">
          <Link href="/privacy" className="text-violet-400 hover:text-violet-300">
            Privacy policy
          </Link>
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
