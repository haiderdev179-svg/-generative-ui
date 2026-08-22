type Expense = {
  id: number;
  title: string;
  amount: number;
  date: string;
};

let expenses: Expense[] = [];
let nextId = 1;

export function initDB() {
  return {
    prepare(query: string) {
      return {
        run(id: number) {
          if (query.includes('DELETE')) {
            expenses = expenses.filter(e => e.id !== id);
          }
        }
      };
    }
  };
}

export function addExpense(title: string, amount: number, date: string) {
  const expense = { id: nextId++, title, amount, date };
  expenses.push(expense);
  return expense;
}

export function getExpenses() {
  return expenses;
}
