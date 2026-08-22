type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
};

let expenses: Expense[] = [];
let nextId = 1;

function normalize(sql: string) {
  return sql.trim().toUpperCase();
}

export function initDB(_path?: string) {
  return {
    prepare(sql: string) {
      const q = normalize(sql);

      return {
        run(...args: any[]) {
          if (q.startsWith('INSERT')) {
            const [title, amount, date] = args;
            expenses.push({ id: nextId++, title, amount: Number(amount), date });
            return { lastInsertRowid: nextId - 1 };
          }
          if (q.startsWith('DELETE')) {
            const [id] = args;
            expenses = expenses.filter(e => e.id !== Number(id));
            return {};
          }
          if (q.startsWith('UPDATE')) {
            const id = Number(args[args.length - 1]);
            const expense = expenses.find(e => e.id === id);
            if (expense) {
              if (q.includes('TITLE')) expense.title = args[0];
              if (q.includes('AMOUNT') && !q.includes('TITLE')) expense.amount = Number(args[0]);
              if (q.includes('TITLE') && q.includes('AMOUNT')) {
                expense.title = args[0];
                expense.amount = Number(args[1]);
              }
            }
            return {};
          }
          return {};
        },
        all(...args: any[]) {
          if (q.includes('GROUP BY')) {
            const [from, to] = args;
            const filtered = expenses.filter(e => e.date >= from && e.date <= to);
            const groups: Record<string, number> = {};
            for (const e of filtered) {
              let period = e.date;
              if (q.includes("'%Y-%M'")) period = e.date.slice(0, 7);
              groups[period] = (groups[period] || 0) + e.amount;
            }
            return Object.entries(groups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([period, total]) => ({ period, total }));
          }
          if (q.includes('BETWEEN')) {
            const [from, to] = args;
            return expenses.filter(e => e.date >= from && e.date <= to);
          }
          return expenses;
        },
      };
    },
  };
}
