import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const METRICS = [
  { label: "Tax savings surfaced", value: "$12.8M+" },
  { label: "Wallets monitored", value: "34,000+" },
  { label: "Chains supported", value: "12" },
  { label: "Avg. onboarding time", value: "58 sec" },
];

const FEATURES = [
  {
    title: "Agentic Tax Intelligence",
    description:
      "Continuously classifies transactions, updates cost basis, and surfaces harvest opportunities before year-end panic starts.",
    icon: "🧠",
  },
  {
    title: "Non-Custodial Permission Model",
    description:
      "Granular permissioning via MetaMask Smart Accounts keeps users in control while enabling automation where explicitly approved.",
    icon: "🛡️",
  },
  {
    title: "Gasless Execution Flow",
    description:
      "Harvest actions are relayed with stablecoin fee abstraction, removing ETH friction from the user journey.",
    icon: "⚡",
  },
  {
    title: "Audit-Grade Reporting",
    description:
      "Tax artifacts, summaries, and attestations are generated in a format designed for users, CPAs, and compliance workflows.",
    icon: "📑",
  },
];

const STEPS = [
  {
    title: "Connect Wallet",
    detail: "One-click wallet connect with modern account abstraction support.",
  },
  {
    title: "Grant Permissions",
    detail: "User-approved execution permissions with clear risk boundaries.",
  },
  {
    title: "Run Continuous Scan",
    detail:
      "Agent pipeline monitors portfolio and computes real-time tax posture.",
  },
  {
    title: "Capture Savings",
    detail: "Execute harvest opportunities and generate filing-ready outputs.",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070f] text-white">
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-taxfi-400 to-harvest font-bold text-slate-950">
              T
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">TaxFi</p>
              <p className="text-xs text-slate-400">
                AI Tax Optimization Platform
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a className="hover:text-white" href="#features">
              Features
            </a>
            <a className="hover:text-white" href="#workflow">
              Workflow
            </a>
            <a className="hover:text-white" href="#security">
              Security
            </a>
          </nav>

          <ConnectButton.Custom>
            {({ account, openConnectModal, mounted }) => {
              if (!mounted || !account) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="btn-primary text-sm px-5 py-2.5"
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {account.displayName}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-taxfi-300/40 bg-taxfi-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-taxfi-200">
              Next-generation crypto tax SaaS
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              The AI tax platform
              <span className="block bg-gradient-to-r from-taxfi-300 via-white to-harvest bg-clip-text text-transparent">
                built to save before you file
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              TaxFi is an execution-capable optimization layer for crypto
              portfolios: monitor risk, identify loss harvesting windows, and
              run compliant workflows with institutional UX.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ConnectButton.Custom>
                {({ account, openConnectModal, mounted }) =>
                  !mounted || !account ? (
                    <button
                      onClick={openConnectModal}
                      className="btn-primary px-6 py-3 text-sm"
                    >
                      Start in 60 seconds
                    </button>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="btn-primary px-6 py-3 text-sm"
                    >
                      Open Dashboard
                    </Link>
                  )
                }
              </ConnectButton.Custom>

              <a href="#workflow" className="btn-secondary px-6 py-3 text-sm">
                See workflow
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {METRICS.map((item) => (
                <div key={item.label} className="glass-panel p-4">
                  <p className="text-xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-b from-taxfi-500/10 to-transparent" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Live tax command center
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                From reactive filing to proactive alpha
              </h3>

              <div className="mt-8 space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-400">Harvestable losses</p>
                  <p className="mt-1 text-2xl font-semibold text-harvest">
                    $184,200
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-400">
                    Estimated tax saved (YTD)
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-taxfi-300">
                    $42,880
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-slate-400">
                    Compliance confidence score
                  </p>
                  <p className="mt-1 text-2xl font-semibold">97.4%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-6 py-14 lg:px-10"
        >
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Platform capabilities
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                Built for serious operators
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass-panel p-6">
                <div className="mb-4 text-2xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="mx-auto max-w-7xl px-6 py-14 lg:px-10"
        >
          <div className="glass-panel p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Workflow
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Operational in four steps
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {STEPS.map((step, idx) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-xs text-taxfi-300">STEP {idx + 1}</p>
                  <h4 className="mt-2 text-lg font-semibold">{step.title}</h4>
                  <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="security"
          className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-10"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div className="glass-panel p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Security posture
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                Trust architecture by design
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>
                  • Non-custodial wallet model with explicit user approvals
                </li>
                <li>• Scoped, revocable permission primitives</li>
                <li>• Onchain attestations for auditable reporting history</li>
                <li>
                  • Separation between read workflows and execution authority
                </li>
              </ul>
            </div>

            <div className="glass-panel p-8">
              <h3 className="text-xl font-semibold">
                Ready to launch your tax command center?
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Connect your wallet and move from reactive reporting to
                proactive tax optimization.
              </p>
              <div className="mt-6">
                <ConnectButton.Custom>
                  {({ account, openConnectModal, mounted }) =>
                    !mounted || !account ? (
                      <button
                        onClick={openConnectModal}
                        className="btn-primary w-full py-3 text-sm"
                      >
                        Connect Wallet
                      </button>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="btn-primary block w-full py-3 text-center text-sm"
                      >
                        Open Dashboard
                      </Link>
                    )
                  }
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
