import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 prose prose-invert prose-zinc max-w-none">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-amber-400/90 mb-8 not-prose">
        This is a plain-language beta policy, not legal advice.
      </p>

      <section className="space-y-4 text-zinc-300 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <p>
          Companion Passport is an early beta. We designed it so you control what your
          companion remembers. This page explains how data is handled in the MVP.
        </p>

        <h2 className="text-xl font-semibold text-white">Local demo mode</h2>
        <p>
          Without signing in, your companion profile, chat history, passport memories,
          and waitlist entries are stored only in your browser (localStorage). We do not
          receive this data unless you sign up and migrate to the cloud.
        </p>

        <h2 className="text-xl font-semibold text-white">Cloud account mode</h2>
        <p>
          When you create an account, your companion profile, approved passport
          memories, memory suggestions, chat history, and waitlist submissions may be
          stored in Supabase (our database provider). Device settings such as Mock/AI
          mode preference stay on your device.
        </p>

        <h2 className="text-xl font-semibold text-white">Approved memories</h2>
        <p>
          Suggested memories from chat are never saved automatically. Only memories you
          explicitly approve are added to your Companion Passport.
        </p>

        <h2 className="text-xl font-semibold text-white">Chat and AI providers</h2>
        <p>
          In AI mode (not Mock), chat messages may be sent to the AI provider you select
          (e.g. OpenAI, Anthropic, Google). Those providers have their own privacy
          policies. Use Mock mode if you want device-only testing with no external API
          calls.
        </p>

        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <p>
          We collect privacy-conscious product analytics (e.g. page views, funnel steps,
          feature usage). We do not store raw chat messages or raw memory text in
          analytics. Anonymized events may be retained after you delete cloud companion
          data.
        </p>

        <h2 className="text-xl font-semibold text-white">Usage tracking and plans</h2>
        <p>
          If you have an account, we track monthly usage such as AI messages sent,
          memories approved, and companions created to enforce plan limits. Mock mode is
          unlimited and does not count against AI message limits. Logged-out demo usage
          is tracked locally on your device.
        </p>

        <h2 className="text-xl font-semibold text-white">Subscriptions and paid interest</h2>
        <p>
          Your plan tier (Free, Plus, Founder) and subscription status may be stored if
          you sign up. Paid plan interest submissions (when Stripe checkout is not yet
          live) may include optional email and reason — this is not a payment.
        </p>

        <h2 className="text-xl font-semibold text-white">Robot deposit intent</h2>
        <p>
          Robot early-access forms may ask about refundable deposit interest. No deposit
          or payment is collected in this beta — we only record buying intent for product
          research.
        </p>

        <h2 className="text-xl font-semibold text-white">Waitlist data</h2>
        <p>
          Robot waitlist submissions may include name, email, preferences, and notes you
          provide. This helps us understand interest in a future physical companion.
        </p>

        <h2 className="text-xl font-semibold text-white">Feedback</h2>
        <p>
          Feedback you submit may include a category, optional rating, message, and
          optional contact email (for logged-out testers). Do not include private chat
          content in feedback.
        </p>

        <h2 className="text-xl font-semibold text-white">Export and delete</h2>
        <p>
          You can export your data as JSON from Settings. You can clear local demo data
          or delete cloud companion data from your account. Deleting cloud data removes
          your companion profile, memories, suggestions, and chat history but not
          anonymized analytics events.
        </p>

        <h2 className="text-xl font-semibold text-white">Adult-only beta</h2>
        <p>
          Companion Passport is intended for adults 18+. This beta does not support
          minors, explicit sexual content, or crisis support.
        </p>

        <p className="text-zinc-500 pt-4">
          Questions? Use the feedback link in the footer or contact us through your beta
          invite channel.
        </p>

        <p className="not-prose pt-4">
          <Link href="/" className="text-violet-400 hover:text-violet-300">
            ← Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
