import { tool } from "@langchain/core/tools";
import type { DatabaseSync } from "node:sqlite";
import z, { string } from "zod";
import { initDB } from './db.js';

//3:Creating tools for (Call-Model)

//--(add expense tool)
export function initTools(database: DatabaseSync){
    
    const addExpense = tool(
        ({ title, amount }) => {
            // console.log('title , amount :', title, amount);

            //todo: Do proper args check e.g: (title or amount is valid || not empty)

            //todo: add error handling here

            //storing the date
            const date = new Date().toISOString().split('T')[0];

            //here we do database query
            const statement = database.prepare(
            `INSERT INTO EXPENSES (title, amount, date) VALUES (?, ?, ?)`
            );
 
            statement.run(title, amount, date)
             

            return JSON.stringify({ status: 'success!' });
        },
        {
            name: 'add-expense',
            description: 'Add the give expense to database.',
            schema: z.object({
                title: z.string().describe('The title of the expense'),
                amount: z.string().describe('The amount of the expense')
            }),
        }
    );
    
    
    //--(get expense tool)
    const getExpenses = tool(
        ({ from, to }) => {
            // console.log('title , amount :', title, amount);
 
            //todo: Do proper args check e.g: (title or amount is valid || not empty)

            //todo: add error handling here

            //here we do database query
            const statement = database.prepare(`Select * From expenses WHERE date BETWEEN ? AND ?`);
            const rows = statement.all(from, to)
            console.log('rows', rows);

            return JSON.stringify(rows);
        },
        {
            name: 'get-expense',
            description: 'Get the expenses from database for given date range.',
            schema: z.object({
                from: z.string().describe('Start date in YYYY-MM-DD format'),
                to: z.string().describe('End date in YYYY-MM-DD format')
            }),
        });

    //-- (delete expense tool)
    const deleteExpense = tool(
        ({ id }) => {
            const statement = database.prepare(
                `DELETE FROM expenses WHERE id = ?`
            );
            statement.run(id);
            return JSON.stringify({ status: 'success', deletedId: id });
        },
        {
            name: 'delete-expense',
            description: 'Delete an expense from the database by its ID. First use get-expense to find the ID if user does not provide it.',
            schema: z.object({
                id: z.number().describe('The ID of the expense to delete'),
            }),
        }
    );

    //-- (update expense tool)
    const updateExpense = tool(
        ({ id, title, amount }) => {
            // build query dynamically based on what's provided
            const fields: string[] = [];
            const values: (string | number)[] = [];

            if (title) {
                fields.push('title = ?');
                values.push(title);
            }

            if (amount) {
                fields.push('amount = ?');
                values.push(amount);
            }

            if (fields.length === 0) {
                return JSON.stringify({ status: 'error', message: 'No fields to update' });
            }

            // add id at the end for WHERE clause
            values.push(id);

            const statement = database.prepare(
                `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`
            );

            statement.run(...values);

            return JSON.stringify({ status: 'success', updatedId: id });
        },
        {
            name: 'update-expense',
            description: 'Update an existing expense title or amount by its ID. Use get-expense first to find the ID if user does not provide it.',
            schema: z.object({
                id: z.number().describe('The ID of the expense to update'),
                title: z.string().optional().describe('New title for the expense'),
                amount: z.string().optional().describe('New amount for the expense'),
            }),
        }
    );


    //--13:(generate-chart)
    const generateChart = tool(
        ({ from, to, groupBy }) => {

            // console.log('args: ', from, to, groupBy);

            let sqlGroupBy : string;

            switch(groupBy){
                case 'month':
                    sqlGroupBy = `strftime('%Y-%m', date)`;
                    break;

                case 'week':
                    sqlGroupBy = `strftime('%Y-W%W', date)`;
                    break;

                case 'date':
                    sqlGroupBy = `date`;
                    break;
                    
                default: 
                    sqlGroupBy = `strftime('%Y-%m', date)`;
            };

            const query = `
            SELECT ${sqlGroupBy} as period, SUM(amount) as total
            FROM expenses 
            WHERE date BETWEEN ? AND ? 
            GROUP BY period 
            ORDER BY period
            `;

            const stmt = database.prepare(query);
            const rows = stmt.all(from, to);

            // console.log('rows: ', rows)

           // -- Shadcn ui--
            const chartData = [
                { date: '2026-04-26', amount: 250 },
            ];

            const result = rows.map(row => {
                return {
                  [groupBy]: row.period,
                  amount: row.total
                }
            });
           // -- Shadcn ui--

            return JSON.stringify({type: 'chart', data: result, labelKey: groupBy})

        },
        {
            name: 'generate-expense-chart',
            description: 'Generate the expense chart by querying the database and grouping expenses by month, week and date',
            schema: z.object({
                from: z.string().describe('Start date in YYYY-MM-DD format'),
                to: z.string().describe('End date in YYYY-MM-DD format'),
                groupBy: z.enum(['month', 'week', 'date'])
                .describe('How to group the data: by month, week or date.')
            }),
        });

    //returning the tools
    return [addExpense, getExpenses, generateChart, deleteExpense, updateExpense];
}
