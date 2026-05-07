//--Discriminated unions

import type { ChartElement } from './components/ExpenseChart.tsx';

export type StreamMessage =
    | {
        type: 'user';
        payload: { text: string };
    }
    |
    {
        type: 'ai';
        payload: { text: string };
    }
    |
    {
        type: 'toolCall:start';
        payload: {
            name: string;
            args: Record<string, unknown>;
        }
    }
    |
    {
        type: 'tool';
        payload: {
            name: string;
            result: {
                data: ChartElement[];
                labelKey: string;
            };
        };
    }

