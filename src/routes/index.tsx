import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, LineChart, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { icon: ClipboardList, title: "Enter your profile", text: "Income, essential costs, debt repayments, savings and the buffer you want to keep." },
  { icon: LineChart, title: "Run a scenario", text: "Reduce income by 0–100% and add one-off costs over 3, 6 or 12 months." },
  { icon: ListChecks, title: "Review your risk", text: "See your lowest balance, first shortfall month and a transparent Low / Medium / High rating." },
];

function Home() {
  return (
    <>
      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal">Cash-flow resilience simulator</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Know how long your money lasts — before something goes wrong.
          </h1>
          <p className="mt-5 max-w-2xl text-lg opacity-80">
            SafeFlow AI projects your month-end balance under the shocks you choose, using clear,
            deterministic formulas. No sign-up required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-teal text-navy hover:bg-teal/90">
              <Link to="/simulate/input">Start a simulation <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-foreground">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-sm">
              <s.icon className="h-6 w-6 text-teal" aria-hidden />
              <p className="mt-4 text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
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
    </>
  );
}
