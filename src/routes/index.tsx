import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveStage } from "@/hooks/useActiveStage";
import { useEffect, useRef, useState } from "react";

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

interface Stage {
  eyebrow: string;
  heading: string;
  highlight?: string;
  text: string;
}

const stages: Stage[] = [
  {
    eyebrow: "Step 1",
    heading: "Start with your financial picture",
    highlight: "financial picture",
    text: "Start with a few essential details about your income, living expenses, debt payments, and savings.",
  },
  {
    eyebrow: "Step 2",
    heading: "Explore possible futures",
    highlight: "possible futures",
    text: "Simulate income reductions, temporary interruptions, unexpected expenses, and combined financial shocks over the next 3, 6, or 12 months.",
  },
  {
    eyebrow: "Step 3",
    heading: "Understand your financial risk",
    highlight: "financial risk",
    text: "See how your projected balance changes over time, identify potential shortfalls, and understand why a risk level is assigned.",
  },
  {
    eyebrow: "Step 4",
    heading: "Turn insights into action",
    highlight: "into action",
    text: "Explore relevant solutions, test supported adjustments, and get AI-assisted explanations and practical next steps.",
  },
  {
    eyebrow: "What SafeFlow does",
    heading: "Clear projections you can trust",
    text: "Projects month-end balances from your own figures. Compares a baseline with your chosen scenario. Explains exactly why a risk level was assigned.",
  },
  {
    eyebrow: "What it does not do",
    heading: "Honest about its limits",
    text: "No probabilities, credit scores, or investment advice. No account or bank connection required. Your data is not stored on a server.",
  },
];

function renderHighlighted(heading: string, highlight: string | undefined, isRevealed: boolean) {
  if (!highlight) return heading;
  const idx = heading.indexOf(highlight);
  if (idx === -1) return heading;
  const before = heading.slice(0, idx);
  const after = heading.slice(idx + highlight.length);
  const highlightClass = isRevealed
    ? "story-highlight-active"
    : "story-highlight-inactive";
  return (
    <>
      {before}
      <span className={highlightClass}>{highlight}</span>
      {after}
    </>
  );
}

function Home() {
  const { activeIndex, revealed, setStageRef } = useActiveStage(stages.length);
  const sloganRef = useRef<HTMLDivElement>(null);
  const [sloganActive, setSloganActive] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const el = sloganRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setSloganActive(entry.isIntersecting);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Hero Section — unchanged */}
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

      {/* How SafeFlow AI Works — single scroll-driven storytelling section, white background */}
      <section className="bg-background">
        {/* Progress indicator */}
        <div
          className="sticky top-16 z-20 mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6"
          aria-hidden
        >
          {stages.map((_, i) => (
            <span
              key={i}
              className={`story-progress-dot h-1.5 rounded-full ${
                activeIndex === i
                  ? "story-progress-dot-active"
                  : "story-progress-dot-inactive"
              }`}
            />
          ))}
        </div>

        {/* Section heading */}
        <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 lg:pt-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
            How SafeFlow AI Works
          </h2>
        </div>

        {/* All six stages as continuous narrative */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {stages.map((stage, i) => {
            const isRevealed = revealed[i] ?? false;
            return (
              <div
                key={stage.eyebrow}
                ref={setStageRef(i)}
                data-stage-index={i}
                className="min-h-[45vh] py-12 sm:min-h-[40vh] sm:py-16 lg:py-20"
              >
                <p
                  className={`story-stage text-sm font-semibold uppercase tracking-wider ${
                    isRevealed
                      ? "story-stage-active text-[oklch(0.48_0.13_160)]"
                      : "story-stage-inactive"
                  }`}
                >
                  {stage.eyebrow}
                </p>
                <h3
                  className={`story-stage mt-4 text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl ${
                    isRevealed ? "story-stage-active text-navy" : "story-stage-inactive"
                  }`}
                >
                  {renderHighlighted(stage.heading, stage.highlight, isRevealed)}
                </h3>
                <p
                  className={`story-stage mt-4 text-lg leading-relaxed sm:text-xl ${
                    isRevealed ? "story-stage-active" : "story-stage-inactive"
                  }`}
                >
                  {stage.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Slogan — appears after all six stages */}
        <div
          ref={sloganRef}
          className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-32"
        >
          <p
            className={`story-slogan text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            See the risks. Understand your options.{" "}
            <span className="text-[oklch(0.48_0.13_160)]">
              Move forward with confidence.
            </span>
          </p>

          {/* CTA — navy background, white text, compact */}
          <div
            className={`story-slogan mt-10 flex justify-center ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            <Button
              asChild
              className="bg-navy text-white hover:bg-navy/90 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 rounded-lg px-6 py-2.5"
            >
              <Link to="/simulate/input">
                Start a Simulation <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
