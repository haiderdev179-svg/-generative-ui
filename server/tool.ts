import { tool } from "@langchain/core/tools";
import type { DatabaseSync } from "node:sqlite";
import z from "zod";



//3:Creating tools for (Call-Model)

export function initTools(database: DatabaseSync){
   
    const addExpense = tool(
        ({ title, amount }) => {
            console.log('title , amount :', title, amount);

            //todo: Do proper args check e.g: (title or amount is valid || not empty)

            //todo: add error handling here

            //storing the date
            const date = new Date().toISOString().split('T')[0];

            //here we do database query
            const statement = database.prepare(
            `INSERT INTO EXPENSES (title, amount, date) VALUES (?, ?, ?)`
            );
 
            statement.run(title, amount, date)
             

            JSON.stringify({ status: 'success!' });
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


    //returning the tools
    return [addExpense]
}



