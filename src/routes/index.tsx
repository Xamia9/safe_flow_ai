import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, LineChart, ListChecks, Sparkles, TrendingDown, Wallet, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveStage } from "@/hooks/useActiveStage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeFlow AI — Stress-test your personal cash flow" },
      { name: "description", content: "Simulate income shocks and unexpected costs month by month and see when your savings would run low. Guest-first, in VND." },
      { property: "og:title", content: "SafeFlow AI — Stress-test your personal cash flow" },
      { property: "og:description", content: "Forward-looking cash-flow resilience simulation for individuals." },
    ],
  }),
  component: Home,
});

function renderHighlighted(heading: string, highlight: string, isActive: boolean) {
  const idx = heading.indexOf(highlight);
  if (idx === -1) return heading;
  const before = heading.slice(0, idx);
  const after = heading.slice(idx + highlight.length);
  const highlightClass = isActive
    ? "story-highlight-active text-teal font-bold"
    : "story-highlight-inactive";
  return (
    <>
      {before}
      <span className={highlightClass}>{highlight}</span>
      {after}
    </>
  );
}

const stages = [
  {
    icon: Wallet,
    eyebrow: "Stage 1",
    heading: "Start with your financial picture",
    highlight: "financial picture",
    text: "Share a small set of essentials — income, essential expenses, savings, and mandatory debt payments. No transaction history needed, no bank connections required.",
  },
  {
    icon: TrendingDown,
    eyebrow: "Stage 2",
    heading: "Simulate possible futures",
    highlight: "possible futures",
    text: "Explore scenarios like reduced income, temporary income interruption, unexpected expenses, and combined financial shocks. These are hypothetical, not guaranteed predictions.",
  },
  {
    icon: LineChart,
    eyebrow: "Stage 3",
    heading: "Understand your financial risk",
    highlight: "financial risk",
    text: "SafeFlow AI's deterministic financial engine projects future balances and identifies potential pressure. The calculations determine the numbers and risk classifications — AI does not invent or recalculate them.",
  },
  {
    icon: Target,
    eyebrow: "Stage 4",
    heading: "Turn insights into action",
    highlight: "into action",
    text: "SafeFlow AI recommends relevant solution categories, lets you test supported adjustments, and uses AI to explain results and develop practical action steps. You remain in control of your decisions.",
  },
];

const originalSteps = [
  { icon: ClipboardList, title: "Enter your profile", text: "Income, essential costs, debt repayments, savings and the buffer you want to keep." },
  { icon: LineChart, title: "Run a scenario", text: "Reduce income by 0–100% and add one-off costs over 3, 6 or 12 months." },
  { icon: ListChecks, title: "Review your risk", text: "See your lowest balance, first shortfall month and a transparent Low / Medium / High rating." },
];

function Home() {
  const { activeIndex, setStageRef } = useActiveStage(stages.length);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">
            Cash-flow resilience simulator
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Know how long your money lasts —{" "}
            <span className="text-teal">before something goes wrong.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg opacity-80 sm:text-xl">
            SafeFlow AI projects your month-end balance under the shocks you
            choose, using clear, deterministic formulas. No sign-up required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-teal text-navy hover:bg-teal/90"
            >
              <Link to="/simulate/input">
                Start a simulation <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Scroll-Driven Storytelling Section */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        {/* Progress indicator */}
        <div
          className="sticky top-16 z-20 mx-auto flex max-w-6xl items-center gap-2 px-4 py-4 sm:px-6"
          aria-hidden
        >
          <span className="mr-3 text-xs font-medium uppercase tracking-wider opacity-50">
            The workflow
          </span>
          {stages.map((_, i) => (
            <span
              key={i}
              className={`story-progress-dot h-2 rounded-full ${
                activeIndex === i
                  ? "story-progress-dot-active"
                  : "story-progress-dot-inactive"
              }`}
            />
          ))}
        </div>

        {/* Stages */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {stages.map((stage, i) => {
            const isActive = activeIndex === i;
            return (
              <div
                key={stage.eyebrow}
                ref={setStageRef(i)}
                data-stage-index={i}
                className="flex min-h-[55vh] flex-col justify-center py-16 sm:min-h-[50vh] sm:py-20 lg:min-h-[60vh] lg:flex-row lg:items-center lg:gap-16 lg:py-24"
              >
                {/* Visual side */}
                <div className="mb-6 lg:mb-0 lg:w-2/5">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl border transition-all duration-500 ${
                      isActive
                        ? "border-teal/50 bg-teal/10 opacity-100"
                        : "border-white/10 bg-white/5 opacity-40"
                    }`}
                  >
                    <stage.icon
                      className={`h-9 w-9 transition-colors duration-500 ${
                        isActive ? "text-teal" : "text-navy-foreground/40"
                      }`}
                      aria-hidden
                    />
                  </div>
                </div>

                {/* Text side */}
                <div className="lg:w-3/5">
                  <p
                    className={`story-stage text-sm font-semibold uppercase tracking-wider ${
                      isActive
                        ? "story-stage-active text-teal"
                        : "story-stage-inactive"
                    }`}
                  >
                    {stage.eyebrow}
                  </p>
                  <h2
                    className={`story-stage mt-3 text-3xl font-bold leading-tight sm:text-4xl ${
                      isActive ? "story-stage-active" : "story-stage-inactive"
                    }`}
                  >
                    {renderHighlighted(stage.heading, stage.highlight, isActive)}
                  </h2>
                  <p
                    className={`story-stage mt-5 text-lg leading-relaxed ${
                      isActive ? "story-stage-active" : "story-stage-inactive"
                    }`}
                  >
                    {stage.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom transition into light section */}
        <div className="h-24 bg-gradient-to-b from-navy to-transparent" />
      </section>

      {/* Preserved "How it works" section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {originalSteps.map((s, i) => (
            <li key={s.title} className="rounded-xl border bg-card p-6">
              <s.icon className="h-6 w-6 text-teal" aria-hidden />
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">What SafeFlow does</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Projects month-end balances from your own figures</li>
              <li>Compares a baseline with your chosen scenario</li>
              <li>Explains exactly why a risk level was assigned</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">What it does not do</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>No probabilities, credit scores or investment advice</li>
              <li>No account or bank connection required</li>
              <li>Your data is not stored on a server</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-navy px-6 py-12 text-center text-navy-foreground sm:px-12 sm:py-16">
          <Sparkles className="mx-auto h-8 w-8 text-teal" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            Ready to stress-test your cash flow?
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-80">
            Run your first simulation in under two minutes. Guest-first, no
            sign-up, no data leaves your browser.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-teal text-navy hover:bg-teal/90"
            >
              <Link to="/simulate/input">
                Start a simulation <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
