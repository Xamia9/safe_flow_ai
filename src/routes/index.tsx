import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadingEmphasis } from "@/hooks/useReadingEmphasis";
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

const steps = [
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
];

const doesBullets = [
  "Projects month-end balances from your own figures",
  "Compares a baseline with your chosen scenario",
  "Explains exactly why a risk level was assigned",
];

const doesNotBullets = [
  "No probabilities, credit scores or investment advice",
  "No account or bank connection required",
  "Your data is not stored on a server",
];

const GREEN = "text-[oklch(0.48_0.13_160)]";
const INACTIVE = "story-stage-inactive";
const ACTIVE = "story-stage-active";

function renderHighlighted(
  heading: string,
  highlight: string,
  isActive: boolean,
) {
  const idx = heading.indexOf(highlight);
  if (idx === -1) return heading;
  const before = heading.slice(0, idx);
  const after = heading.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span
        className={
          isActive ? "story-highlight-active" : "story-highlight-inactive"
        }
      >
        {highlight}
      </span>
      {after}
    </>
  );
}

function Home() {
  // 1 section heading + 4 steps × 3 emphasis units (eyebrow, heading, body) = 13
  // + 2 section headings + 3 + 3 bullets = 21 total
  const TOTAL_UNITS = 21;
  const { activeSet, setEmphasisRef } = useReadingEmphasis(TOTAL_UNITS);

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

  // Helper to compute emphasis unit indices for each step
  let unitIndex = 0;
  const nextUnit = () => unitIndex++;

  return (
    <>
      {/* Hero Section */}
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal">
            Cash-flow resilience simulator
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            Know how long your money lasts —{" "}
            <span className="text-teal">before something goes wrong.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-80 sm:max-w-3xl lg:max-w-4xl lg:text-lg">
            SafeFlow AI projects your month-end balance under the shocks you
            choose, using clear, deterministic formulas. No sign-up required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
        {/* Section heading — registered as emphasis unit 0 */}
        <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 lg:pt-16">
          {(() => {
            const idx = nextUnit();
            const isActive = activeSet.has(idx);
            return (
              <h2
                ref={setEmphasisRef(idx)}
                className={`story-stage text-2xl font-extrabold tracking-tight sm:text-3xl ${
                  isActive ? `${ACTIVE} text-navy` : INACTIVE
                }`}
              >
                How SafeFlow AI Works
              </h2>
            );
          })()}
        </div>

        {/* Steps as continuous narrative */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {steps.map((step) => {
            const eyebrowIdx = nextUnit();
            const headingIdx = nextUnit();
            const bodyIdx = nextUnit();
            const eyebrowActive = activeSet.has(eyebrowIdx);
            const headingActive = activeSet.has(headingIdx);
            const bodyActive = activeSet.has(bodyIdx);

            return (
              <div
                key={step.eyebrow}
                className="min-h-[40vh] py-10 sm:min-h-[35vh] sm:py-12 lg:py-14"
              >
                <p
                  ref={setEmphasisRef(eyebrowIdx)}
                  className={`story-stage text-xs font-semibold uppercase tracking-wider ${
                    eyebrowActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                  }`}
                >
                  {step.eyebrow}
                </p>
                <h3
                  ref={setEmphasisRef(headingIdx)}
                  className={`story-stage mt-3 text-xl font-bold leading-snug sm:text-2xl ${
                    headingActive ? `${ACTIVE} text-navy` : INACTIVE
                  }`}
                >
                  {renderHighlighted(
                    step.heading,
                    step.highlight,
                    headingActive,
                  )}
                </h3>
                <p
                  ref={setEmphasisRef(bodyIdx)}
                  className={`story-stage mt-3 text-base leading-relaxed ${
                    bodyActive ? ACTIVE : INACTIVE
                  }`}
                >
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* What SafeFlow does / does not do — within the storytelling section, before the slogan */}
        <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
          <div className="grid gap-8 pt-8 md:grid-cols-2 md:gap-12">
            {/* What SafeFlow does */}
            <div>
              {(() => {
                const headingIdx = nextUnit();
                const headingActive = activeSet.has(headingIdx);
                return (
                  <h3
                    ref={setEmphasisRef(headingIdx)}
                    className={`story-stage text-xl font-bold leading-snug sm:text-2xl ${
                      headingActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                    }`}
                  >
                    What SafeFlow does
                  </h3>
                );
              })()}
              <ul className="mt-4 space-y-3">
                {doesBullets.map((bullet) => {
                  const idx = nextUnit();
                  const isActive = activeSet.has(idx);
                  return (
                    <li
                      key={bullet}
                      ref={setEmphasisRef(idx)}
                      className={`story-stage flex gap-2.5 text-base leading-relaxed ${
                        isActive ? ACTIVE : INACTIVE
                      }`}
                    >
                      <span
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                          isActive ? GREEN : "bg-current opacity-60"
                        }`}
                        aria-hidden
                      />
                      <span>{bullet}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* What it does not do */}
            <div>
              {(() => {
                const headingIdx = nextUnit();
                const headingActive = activeSet.has(headingIdx);
                return (
                  <h3
                    ref={setEmphasisRef(headingIdx)}
                    className={`story-stage text-xl font-bold leading-snug sm:text-2xl ${
                      headingActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                    }`}
                  >
                    What it does not do
                  </h3>
                );
              })()}
              <ul className="mt-4 space-y-3">
                {doesNotBullets.map((bullet) => {
                  const idx = nextUnit();
                  const isActive = activeSet.has(idx);
                  return (
                    <li
                      key={bullet}
                      ref={setEmphasisRef(idx)}
                      className={`story-stage flex gap-2.5 text-base leading-relaxed ${
                        isActive ? ACTIVE : INACTIVE
                      }`}
                    >
                      <span
                        className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                          isActive ? GREEN : "bg-current opacity-60"
                        }`}
                        aria-hidden
                      />
                      <span>{bullet}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Slogan — the climax of the scrolling experience */}
        <div
          ref={sloganRef}
          className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20"
        >
          <p
            className={`story-slogan text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            See the risks. Understand your options.{" "}
            <span className={GREEN}>Move forward with confidence.</span>
          </p>

          {/* CTA — small, restrained */}
          <div
            className={`story-slogan mt-8 flex justify-center ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            <Button
              asChild
              size="lg"
              className="bg-navy text-navy-foreground hover:bg-navy/90"
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
