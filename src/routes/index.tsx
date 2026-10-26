import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadingEmphasis } from "@/hooks/useReadingEmphasis";
import { useT } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { useEffect, useMemo, useRef, useState } from "react";

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

interface Step {
  eyebrowKey: TranslationKey;
  headingKey: TranslationKey;
  highlightKey: TranslationKey;
  textKey: TranslationKey;
}

const STEPS: Step[] = [
  { eyebrowKey: "home.step1Eyebrow", headingKey: "home.step1Heading", highlightKey: "home.step1Highlight", textKey: "home.step1Text" },
  { eyebrowKey: "home.step2Eyebrow", headingKey: "home.step2Heading", highlightKey: "home.step2Highlight", textKey: "home.step2Text" },
  { eyebrowKey: "home.step3Eyebrow", headingKey: "home.step3Heading", highlightKey: "home.step3Highlight", textKey: "home.step3Text" },
  { eyebrowKey: "home.step4Eyebrow", headingKey: "home.step4Heading", highlightKey: "home.step4Highlight", textKey: "home.step4Text" },
];

const DOES_KEYS: TranslationKey[] = ["home.doesBullet1", "home.doesBullet2", "home.doesBullet3"];
const DOES_NOT_KEYS: TranslationKey[] = ["home.doesNotBullet1", "home.doesNotBullet2", "home.doesNotBullet3"];

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
  const t = useT();
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

  // Assign emphasis unit indices:
  // Group 0: section heading (unit 0)
  // Groups 1-4: steps (units 1-12, 3 per step)
  // Group 5: both info columns — does heading + 3 bullets + does-not heading + 3 bullets (units 13-20)
  const groups = useMemo<number[][]>(() => [
    [0],                              // section heading
    [1, 2, 3],                        // step 1
    [4, 5, 6],                        // step 2
    [7, 8, 9],                        // step 3
    [10, 11, 12],                     // step 4
    [13, 14, 15, 16, 17, 18, 19, 20], // both info columns together
  ], []);

  const { activeSet, setEmphasisRef } = useReadingEmphasis(groups);

  let unitIndex = 0;
  const nextUnit = () => unitIndex++;

  return (
    <>
      {/* Hero Section */}
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">
            {t("home.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {t("home.heroTitle")}{" "}
            <span className="text-teal">{t("home.heroTitleHighlight")}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-80 sm:max-w-3xl lg:max-w-4xl">
            {t("home.heroBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-teal text-navy hover:bg-teal/90"
            >
              <Link to="/simulate/input">
                {t("home.startSimulation")} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How SafeFlow AI Works — scroll-driven storytelling, light background */}
      <section className="bg-background">
        {/* Section heading */}
        <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 lg:pt-24">
          {(() => {
            const idx = nextUnit();
            const isActive = activeSet.has(idx);
            return (
              <h2
                ref={setEmphasisRef(idx)}
                className={`story-stage text-3xl font-extrabold tracking-tight sm:text-4xl ${
                  isActive ? `${ACTIVE} text-navy` : INACTIVE
                }`}
              >
                {t("home.howItWorks")}
              </h2>
            );
          })()}
        </div>

        {/* Steps as continuous narrative */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {STEPS.map((step) => {
            const eyebrowIdx = nextUnit();
            const headingIdx = nextUnit();
            const bodyIdx = nextUnit();
            const eyebrowActive = activeSet.has(eyebrowIdx);
            const headingActive = activeSet.has(headingIdx);
            const bodyActive = activeSet.has(bodyIdx);
            const heading = t(step.headingKey);
            const highlight = t(step.highlightKey);

            return (
              <div
                key={step.eyebrowKey}
                className="min-h-[45vh] py-12 sm:min-h-[40vh] sm:py-16 lg:py-20"
              >
                <p
                  ref={setEmphasisRef(eyebrowIdx)}
                  className={`story-stage text-sm font-semibold uppercase tracking-wider ${
                    eyebrowActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                  }`}
                >
                  {t(step.eyebrowKey)}
                </p>
                <h3
                  ref={setEmphasisRef(headingIdx)}
                  className={`story-stage mt-4 text-2xl font-bold leading-snug sm:text-3xl ${
                    headingActive ? `${ACTIVE} text-navy` : INACTIVE
                  }`}
                >
                  {renderHighlighted(
                    heading,
                    highlight,
                    headingActive,
                  )}
                </h3>
                <p
                  ref={setEmphasisRef(bodyIdx)}
                  className={`story-stage mt-4 text-lg leading-relaxed ${
                    bodyActive ? ACTIVE : INACTIVE
                  }`}
                >
                  {t(step.textKey)}
                </p>
              </div>
            );
          })}
        </div>

        {/* What SafeFlow does / does not do — two columns on desktop, stacked on mobile */}
        <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
          <div className="grid gap-10 pt-10 md:grid-cols-2 md:gap-16">
            {/* What SafeFlow does */}
            <div>
              {(() => {
                const headingIdx = nextUnit();
                const headingActive = activeSet.has(headingIdx);
                return (
                  <h3
                    ref={setEmphasisRef(headingIdx)}
                    className={`story-stage text-2xl font-bold leading-snug ${
                      headingActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                    }`}
                  >
                    {t("home.whatDoes")}
                  </h3>
                );
              })()}
              <ul className="mt-5 space-y-4">
                {DOES_KEYS.map((key, i) => {
                  const idx = nextUnit();
                  const isActive = activeSet.has(idx);
                  const bullet = t(key);
                  return (
                    <li
                      key={i}
                      ref={setEmphasisRef(idx)}
                      className={`story-stage flex gap-3 text-lg leading-relaxed ${
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
                    className={`story-stage text-2xl font-bold leading-snug ${
                      headingActive ? `${ACTIVE} ${GREEN}` : INACTIVE
                    }`}
                  >
                    {t("home.whatDoesNot")}
                  </h3>
                );
              })()}
              <ul className="mt-5 space-y-4">
                {DOES_NOT_KEYS.map((key, i) => {
                  const idx = nextUnit();
                  const isActive = activeSet.has(idx);
                  const bullet = t(key);
                  return (
                    <li
                      key={i}
                      ref={setEmphasisRef(idx)}
                      className={`story-stage flex gap-3 text-lg leading-relaxed ${
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
          className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-32"
        >
          <p
            className={`story-slogan text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            {t("home.sloganPre")}{" "}
            <span className={GREEN}>{t("home.sloganHighlight")}</span>
          </p>

          {/* CTA — compact navy button */}
          <div
            className={`story-slogan mt-10 flex justify-center ${
              sloganActive ? "story-slogan-active" : "story-slogan-inactive"
            }`}
          >
            <Button
              asChild
              size="lg"
              className="bg-navy text-navy-foreground hover:bg-navy/90"
            >
              <Link to="/simulate/input">
                {t("home.startSimulationCaps")} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
