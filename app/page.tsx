import Link from "next/link";
import { ArrowRight, Upload, Cpu, Copy, Check, Zap } from "lucide-react";

const PLANS = [
  { name: "Starter",  credits: 10,  price: "$9",  priceNote: "one-time", popular: false },
  { name: "Creator",  credits: 40,  price: "$29", priceNote: "one-time", popular: true  },
  { name: "Pro",      credits: 100, price: "$59", priceNote: "one-time", popular: false },
];

const STEPS = [
  {
    icon: Upload,
    title: "Upload your video",
    desc: "Drop any UGC video — MP4, MOV, or WebM up to 2 GB. It goes straight to our servers, never stored permanently.",
  },
  {
    icon: Cpu,
    title: "Gemini analyzes it",
    desc: "Google Gemini deconstructs every detail: lighting, camera motion, dialogue rhythm, micro-expressions, and authenticity cues.",
  },
  {
    icon: Copy,
    title: "Copy your prompt",
    desc: "Get a high-fidelity generation prompt ready to paste into Sora, Kling, or Runway. Swap in your own script with one click.",
  },
];

const FAQS = [
  {
    q: "What is a credit?",
    a: "One credit = one full video analysis. The rewrite feature (swapping your own script in) is always free once you have an analysis.",
  },
  {
    q: "How long does analysis take?",
    a: "Usually 1–3 minutes depending on video length. You can watch the progress in real time.",
  },
  {
    q: "What video formats are supported?",
    a: "MP4, MOV, and WebM up to 2 GB — which covers everything from iPhone footage to exported edits.",
  },
  {
    q: "Which AI video tools does the prompt work with?",
    a: "The prompts are optimized for Sora, but work great with Kling, Runway, and any other text-to-video model that accepts detailed scene descriptions.",
  },
  {
    q: "Do you store my videos?",
    a: "No. Videos are deleted from our servers immediately after Gemini finishes processing — usually within a few minutes.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Nav */}
      <nav className="border-b border-zinc-900 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">Prompt Please</span>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 px-3 py-1.5 rounded-full">
            <Zap size={11} />
            Powered by Google Gemini
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Turn any UGC video into a{" "}
            <span className="text-violet-400">perfect AI prompt</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Upload a video and get a high-fidelity generation prompt for Sora, Kling, or Runway — in minutes.
            Reverse-engineer any UGC style instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              Start for free <ArrowRight size={15} />
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-6 py-3"
            >
              Already have an account →
            </Link>
          </div>
          <p className="text-xs text-zinc-600">3 free credits on signup. No credit card required.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">How it works</p>
            <h2 className="text-3xl font-bold">Three steps to your prompt</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <step.icon size={18} className="text-violet-400" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-20 border-t border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Output</p>
            <h2 className="text-3xl font-bold">What's in your prompt</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["Full script transcription", "Word-for-word dialogue with tone, pauses, and breath cues"],
              ["Camera & device inference", "Inferred device model, lens distortion, aspect ratio, FPS"],
              ["Lighting analysis", "Color temperature, shadow quality, light source and direction"],
              ["Subject & performance", "Age, appearance, posture, micro-expressions, emotional baseline"],
              ["Audio authenticity cues", "Background noise, room reverb, mic quality"],
              ["Ready-to-paste prompt", "Formatted for Sora 2, Kling, and Runway — just copy and go"],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Pricing</p>
            <h2 className="text-3xl font-bold">Pay once, no subscription</h2>
            <p className="text-zinc-500 text-sm">Credits never expire. Start with 3 free on signup.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 space-y-5 ${
                  plan.popular
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-zinc-500 text-xs">{plan.priceNote}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Zap size={14} className="text-violet-400" />
                  {plan.credits} video analyses
                </div>
                <Link
                  href="/sign-up"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    plan.popular
                      ? "bg-violet-600 hover:bg-violet-500"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 border-t border-zinc-900 bg-zinc-900/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">FAQ</p>
            <h2 className="text-3xl font-bold">Common questions</h2>
          </div>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border-b border-zinc-800 pb-6 last:border-0">
                <p className="font-medium mb-2">{q}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-zinc-900 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to clone any video?</h2>
          <p className="text-zinc-500 text-sm">Start with 3 free analyses. No credit card needed.</p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-semibold transition-colors text-sm"
          >
            Get started free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <span>© 2026 Prompt Please</span>
          <span>promptplease.app</span>
        </div>
      </footer>

    </div>
  );
}
