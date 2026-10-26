import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthProjection } from "@/types/financial";
import { formatVND } from "@/lib/formatCurrency";
import { formatVNDShort } from "@/lib/formatCurrencyLocalized";
import { useT } from "@/i18n/LanguageContext";

export function BalanceChart({ active, baseline, buffer, scenarioLabel }: {
  active: MonthProjection[]; baseline: MonthProjection[]; buffer: number; scenarioLabel?: string;
}) {
  const t = useT();
  const label = scenarioLabel ?? t("chart.baseline");
  const data = active.map((m, i) => ({
    month: m.month,
    active: m.closingBalance,
    baseline: baseline[i]?.closingBalance,
  }));
  const short = (v: number) => formatVNDShort(v);
  return (
    <div className="h-80 w-full" role="img" aria-label={t("chart.ariaLabel", { scenario: label, buffer: formatVND(buffer) })}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 0, right: 16, top: 16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={short} stroke="var(--muted-foreground)" fontSize={12} width={52} />
          <Tooltip
            labelFormatter={(m) => t("chart.monthN", { n: m })}
            formatter={(v: number, name: string) => [formatVND(v), name]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="var(--negative)" label={{ value: t("chart.zeroBalance"), position: "insideBottomLeft", fontSize: 11, fill: "var(--negative)" }} />
          <ReferenceLine y={buffer} stroke="var(--warning)" strokeDasharray="4 4"
            label={{ value: t("chart.safetyBuffer", { amount: formatVND(buffer) }), position: "insideTopLeft", fontSize: 11, fill: "var(--warning)" }} />
          <Line type="monotone" dataKey="baseline" name={t("chart.baseline")} stroke="var(--chart-2)" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="active" name={label} stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
