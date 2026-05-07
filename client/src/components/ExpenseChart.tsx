import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from './ui/chart';
import type { ChartConfig } from './ui/chart';


const chartConfig = {
  amount: {
    label: 'Amount',
    color: '#a855f7', // purple to match your app theme
  },
} satisfies ChartConfig;

export type ChartElement = {
  [key: string]: string | number;
};

export function ExpenseChart({
  chartData,
  labelKey,
}: {
  chartData: ChartElement[];
  labelKey: string;
}) {
  return (
    <ChartContainer
  config={chartConfig}
  className="min-h-[200px] w-full bg-zinc-800 rounded-xl my-4 p-4">
    
<BarChart accessibilityLayer data={chartData}>
  <YAxis
    tickLine={false}
    axisLine={false}
    tickFormatter={(value) => `Rs.${value.toLocaleString()}`}
  />
  <XAxis
    dataKey={labelKey}
    tickLine={false}
    tickMargin={10}
    axisLine={false}
  />
  <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
  <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
</BarChart>
    </ChartContainer>
  );
}