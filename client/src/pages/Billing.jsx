import { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

/* ── Simulated usage data ────────────────────────────────── */
const USAGE = [
  { label: "Workspaces", used: 1, limit: 1, icon: "🏗️" },
  { label: "Projects", used: 2, limit: 3, icon: "📋" },
  { label: "Members", used: 3, limit: 5, icon: "👥" },
  { label: "AI Credits", used: 187, limit: 250, icon: "✨" },
];

/* ── Plan definitions ────────────────────────────────────── */
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    badge: "CURRENT PLAN",
    highlight: false,
    recommended: false,
    features: [
      "1 workspace",
      "3 projects",
      "5 team members",
      "250 AI credits / month",
      "Community support",
      "Basic analytics",
    ],
    cta: null,
    accent: "border-zinc-800",
    bg: "bg-zinc-950/40",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    badge: "RECOMMENDED",
    highlight: true,
    recommended: true,
    features: [
      "Unlimited workspaces",
      "Unlimited projects",
      "15 team members",
      "2,500 AI credits / month",
      "Priority support",
      "Advanced analytics & Engineer’s Space",
      "Custom integrations",
      "Code review AI assist",
    ],
    cta: "Upgrade to Pro",
    accent: "border-emerald-700/50",
    bg: "bg-gradient-to-br from-emerald-950/30 to-zinc-950/60",
  },
  {
    name: "Team",
    price: "$29",
    period: "/month per seat",
    badge: "ENTERPRISE",
    highlight: false,
    recommended: false,
    features: [
      "Everything in Pro",
      "Unlimited members",
      "Unlimited AI credits",
      "SSO & SAML",
      "Audit logs & compliance",
      "Dedicated account manager",
      "99.9% SLA guarantee",
      "Custom onboarding",
    ],
    cta: "Contact Sales",
    accent: "border-violet-800/40",
    bg: "bg-gradient-to-br from-violet-950/20 to-zinc-950/60",
  },
];

export default function Billing() {
  const { id } = useParams();
  const [upgradeNotice, setUpgradeNotice] = useState(null);

  const handleUpgrade = (planName) => {
    setUpgradeNotice(planName);
    setTimeout(() => setUpgradeNotice(null), 3000);
  };

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl">
          {/* ── Header ─────────────────────────────────────── */}
          <div className="mb-8 border-b border-zinc-900 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Billing & Plans
              </h1>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono">
                Free Tier
              </span>
            </div>
            <p className="text-zinc-500 text-xs font-mono mt-1">
              Workspace {id?.slice(-6)} · Manage your subscription, usage, and payment details.
            </p>
          </div>

          {/* ── Upgrade toast ──────────────────────────────── */}
          {upgradeNotice && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3 animate-pulse">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-emerald-300 text-xs font-mono">
                Stripe integration coming soon — {upgradeNotice} upgrade queued.
              </p>
            </div>
          )}

          {/* ── Current plan overview ──────────────────────── */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-900/30 flex items-center justify-center text-lg select-none">
                  ⚡
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-tight">Free Plan</h2>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Active since May 2026</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-white tracking-tight">$0</span>
                <span className="text-xs text-zinc-500 font-mono ml-1">/mo</span>
              </div>
            </div>

            {/* ── Usage meters ─────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {USAGE.map((item) => {
                const pct = Math.round((item.used / item.limit) * 100);
                const isHigh = pct >= 80;
                return (
                  <div
                    key={item.label}
                    className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono font-bold">
                        {item.icon} {item.label}
                      </span>
                      <span className={`text-[9px] font-mono font-bold ${isHigh ? "text-amber-400" : "text-zinc-400"}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900/60 rounded-full h-1.5 overflow-hidden border border-zinc-800/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHigh ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1.5">
                      {item.used} <span className="text-zinc-700">of</span> {item.limit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Plan tiers ─────────────────────────────────── */}
          <div className="mb-8">
            <h2 className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider font-mono mb-4">
              Available Plans
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative ${plan.bg} border ${plan.accent} rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/40 ${
                    plan.recommended ? "ring-1 ring-emerald-500/20" : ""
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span
                      className={`absolute -top-2.5 left-4 text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full font-mono ${
                        plan.badge === "CURRENT PLAN"
                          ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                          : plan.badge === "RECOMMENDED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}

                  {/* Price */}
                  <div className="mt-3">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{plan.period}</span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">{plan.name}</h3>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-zinc-400">
                        <span className={`mt-0.5 flex-shrink-0 ${plan.recommended ? "text-emerald-400" : "text-zinc-600"}`}>
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.cta ? (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                        plan.recommended
                          ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                          : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl text-center text-xs text-zinc-600 bg-zinc-900/30 border border-zinc-800/40 font-mono">
                      Current plan
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom sections ─────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Payment method */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">💳</span>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Payment Method
                </h2>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-center text-lg mb-3">
                  🔒
                </div>
                <p className="text-xs text-zinc-400 font-semibold mb-1">No payment method on file</p>
                <p className="text-[10px] text-zinc-600 font-mono mb-4">
                  Add a card when you're ready to upgrade.
                </p>
                <button
                  onClick={() => handleUpgrade("Payment setup")}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-bold px-4 py-2 rounded-xl transition"
                >
                  Add Payment Method
                </button>
              </div>
            </div>

            {/* Billing history */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">📄</span>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Billing History
                </h2>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="px-4 py-2 bg-zinc-900/20 border-b border-zinc-800/40 grid grid-cols-3 gap-2">
                  <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono font-bold">Date</span>
                  <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono font-bold">Amount</span>
                  <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono font-bold text-right">Status</span>
                </div>
                {/* Empty state */}
                <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-zinc-500 font-semibold mb-1">No invoices yet</p>
                  <p className="text-[10px] text-zinc-600 font-mono">
                    Invoices will appear here after your first payment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── FAQ / help nudge ────────────────────────────── */}
          <div className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800/40 border border-zinc-700/30 flex items-center justify-center text-sm">
                💬
              </div>
              <div>
                <p className="text-xs text-zinc-300 font-semibold">Need help choosing a plan?</p>
                <p className="text-[10px] text-zinc-600 font-mono">
                  Reach out to our team — we're happy to help find the right fit.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade("Support inquiry")}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold px-4 py-2 rounded-xl transition flex-shrink-0"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
