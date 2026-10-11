import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthProjection } from "@/types/financial";
import { formatVND } from "@/lib/formatCurrency";

export function BalanceChart({ active, baseline, buffer, scenarioLabel = "Scenario" }: {
  active: MonthProjection[]; baseline: MonthProjection[]; buffer: number; scenarioLabel?: string;
}) {
  const data = active.map((m, i) => ({
    month: m.month,
    active: m.closingBalance,
    baseline: baseline[i]?.closingBalance,
  }));
  const short = (v: number) => `${(v / 1e6).toFixed(0)}M`;
  return (
    <div className="h-80 w-full" role="img" aria-label={`Projected cash balance, baseline versus ${scenarioLabel}, with zero line and safety buffer of ${formatVND(buffer)}`}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 0, right: 16, top: 16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickFormatter={(m) => `M${m}`} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={short} stroke="var(--muted-foreground)" fontSize={12} width={52} />
          <Tooltip
            labelFormatter={(m) => `Month ${m}`}
            formatter={(v: number, name: string) => [formatVND(v), name]}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="var(--negative)" label={{ value: "Zero balance", position: "insideBottomLeft", fontSize: 11, fill: "var(--negative)" }} />
          <ReferenceLine y={buffer} stroke="var(--warning)" strokeDasharray="4 4"
            label={{ value: `Safety buffer ${formatVND(buffer)}`, position: "insideTopLeft", fontSize: 11, fill: "var(--warning)" }} />
          <Line type="monotone" dataKey="baseline" name="Baseline" stroke="var(--chart-2)" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="active" name={scenarioLabel} stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
