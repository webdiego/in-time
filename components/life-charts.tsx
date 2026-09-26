"use client";

import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ageAtSurvival,
  findCountry,
  remainingYears,
  survivalCurve,
  world,
  type CountryStats,
  type Sex,
} from "@/lib/lifespan";
import { notableCountries } from "@/lib/lifespan";
import { countryName, fmtYears } from "@/lib/format";

const GLOW = "var(--glow)";
const CONTEXT = "#71717a";
const pct = (p: number) => `${Math.round(p * 100)}%`;
const ageTicks = (from: number) => {
  const ticks = [from];
  for (let t = Math.ceil((from + 5) / 10) * 10; t <= 100; t += 10) ticks.push(t);
  return ticks;
};

// --- survival curve ----------------------------------------------------------

export function SurvivalChart({
  country,
  sex,
  age,
  hazardRatio,
}: {
  country: CountryStats;
  sex: Sex;
  age: number;
  hazardRatio: number;
}) {
  const personalised = hazardRatio !== 1;
  // "You" is always the emphasised series; the comparison is the country
  // average when there is a lifestyle, otherwise the world average.
  const reference = personalised ? country : world;
  const referenceLabel = personalised ? `Average, ${countryName(country.code)}` : "World average";

  const { data, median, p10 } = useMemo(() => {
    const you = survivalCurve(country, sex, age, hazardRatio);
    const other = survivalCurve(reference, sex, age);
    return {
      data: you.map((p, i) => ({ age: p.age, you: p.alive, other: other[i].alive })),
      median: ageAtSurvival(you, 0.5),
      p10: ageAtSurvival(you, 0.1),
    };
  }, [country, sex, age, hazardRatio, reference]);

  const config = {
    you: { label: personalised ? "You" : `You (average, ${countryName(country.code)})`, color: GLOW },
    other: { label: referenceLabel, color: CONTEXT },
  } satisfies ChartConfig;

  return (
    <figure className="flex w-full flex-col gap-4">
      <figcaption className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">Probability of still being alive</h2>
        {median && (
          <p className="text-sm text-muted-foreground">
            You have a 50% chance of reaching{" "}
            <strong className="font-medium text-foreground">age {median}</strong>
            {p10 && (
              <>
                {" "}
                and a 10% chance of reaching <strong className="font-medium text-foreground">{p10}</strong>
              </>
            )}
            .
          </p>
        )}
      </figcaption>
      <ChartContainer config={config} className="aspect-16/10 w-full sm:aspect-2/1">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="age"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            ticks={ageTicks(Math.floor(age))}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={pct}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => `At age ${payload?.[0]?.payload.age}`}
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-0.5 w-3 rounded-full"
                        style={{ background: config[name as keyof typeof config].color }}
                      />
                      {config[name as keyof typeof config].label}
                    </span>
                    <span className="font-mono text-foreground tabular-nums">{pct(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          <Area
            dataKey="other"
            type="monotone"
            stroke={CONTEXT}
            strokeWidth={2}
            fill="transparent"
            activeDot={{ r: 4, stroke: "var(--background)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Area
            dataKey="you"
            type="monotone"
            stroke={GLOW}
            strokeWidth={2}
            fill={GLOW}
            fillOpacity={0.1}
            activeDot={{ r: 4, stroke: "var(--background)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <ChartLegend content={<ChartLegendContent className="text-muted-foreground" />} />
        </AreaChart>
      </ChartContainer>
      <DataTable
        caption="Probability of still being alive, by age"
        headers={["Age", config.you.label as string, referenceLabel]}
        rows={data.filter((d) => d.age % 5 === 0).map((d) => [String(d.age), pct(d.you), pct(d.other)])}
      />
    </figure>
  );
}

// --- countries ---------------------------------------------------------------

const PEERS = ["US", "CN", "IN", "BR", "NG", "DE", "JP"];

export function CountryChart({ country, sex, age }: { country: CountryStats; sex: Sex; age: number }) {
  const data = useMemo(() => {
    const byE0 = [...notableCountries].sort((a, b) => b[sex] - a[sex]);
    const picks = new Map<string, CountryStats>();
    for (const c of [byE0[0], country, ...PEERS.map((code) => findCountry(code)!), byE0[byE0.length - 1]]) {
      if (c) picks.set(c.code, c);
    }
    const rows = [...picks.values()].map((c) => ({
      code: c.code,
      name: countryName(c.code),
      years: remainingYears(c, sex, age),
      mine: c.code === country.code,
    }));
    rows.push({ code: "WORLD", name: "World", years: remainingYears(world, sex, age), mine: false });
    return rows.sort((a, b) => b.years - a.years);
  }, [country, sex, age]);

  const config = { years: { label: "Years remaining", color: CONTEXT } } satisfies ChartConfig;

  return (
    <figure className="flex w-full flex-col gap-4">
      <figcaption className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">Same age, different place</h2>
        <p className="text-sm text-muted-foreground">
          Years remaining on average for a {sex === "male" ? "man" : "woman"} aged {Math.floor(age)}.
        </p>
      </figcaption>
      <ChartContainer config={config} className="aspect-auto w-full" style={{ height: data.length * 34 + 16 }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={112}
            tick={({ x, y, payload, index }) => (
              <text
                x={x}
                y={y}
                dy={4}
                textAnchor="end"
                className={data[index]?.mine ? "fill-foreground font-medium" : "fill-muted-foreground"}
                fontSize={12}
              >
                {payload.value}
              </text>
            )}
          />
          <ChartTooltip
            cursor={{ fill: "var(--accent)", opacity: 0.5 }}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(label) => label}
                formatter={(value) => (
                  <span className="font-mono text-foreground tabular-nums">{fmtYears(Number(value))} years</span>
                )}
              />
            }
          />
          <Bar dataKey="years" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.code} fill={d.mine ? GLOW : CONTEXT} />
            ))}
            <LabelList
              dataKey="years"
              position="right"
              formatter={(v) => fmtYears(Number(v))}
              className="fill-muted-foreground font-mono"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <DataTable
        caption="Average years remaining by place, at your age"
        headers={["Place", "Years remaining"]}
        rows={data.map((d) => [d.name, fmtYears(d.years)])}
      />
    </figure>
  );
}

// --- shared ------------------------------------------------------------------

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: string[][] }) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View data as a table</summary>
      <table className="mt-3 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {headers.map((h) => (
              <th key={h} scope="col" className="py-2 pr-4 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border/60">
              {r.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-1.5 pr-4 font-normal">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="py-1.5 pr-4 font-mono tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
