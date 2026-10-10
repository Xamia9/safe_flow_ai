import { Area, ComposedChart as AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthProjection } from "@/types/financial";
import { formatVND } from "@/lib/formatCurrency";

export function BalanceChart({ active, baseline, buffer }: {
  active: MonthProjection[]; baseline: MonthProjection[]; buffer: number;
}) {
  const data = active.map((m, i) => ({
    month: `M${m.month}`,
    active: m.closingBalance,
    baseline: baseline[i]?.closingBalance,
  }));
  const short = (v: number) => `${(v / 1e6).toFixed(0)}M`;
  return (
    <div className="h-72 w-full" role="img" aria-label="Projected month-end balance, baseline versus scenario">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={short} stroke="var(--muted-foreground)" fontSize={12} width={48} />
          <Tooltip formatter={(v: number) => formatVND(v)} />
          <ReferenceLine y={0} stroke="var(--negative)" />
          <ReferenceLine y={buffer} stroke="var(--warning)" strokeDasharray="4 4" label={{ value: "Buffer", fontSize: 11, fill: "var(--warning)" }} />
          <Area type="monotone" dataKey="active" name="Scenario" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.12} strokeWidth={2} />
          <Line type="monotone" dataKey="baseline" name="Baseline" stroke="var(--chart-2)" strokeDasharray="5 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
