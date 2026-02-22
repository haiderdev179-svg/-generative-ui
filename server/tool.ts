import { tool } from "@langchain/core/tools";
import z from "zod";



//3:Creating tools for (Call-Model)

//--addExpense tool
export const addExpense = tool(
    ({ title, amount }) => {
        console.log('title , amount :', title, amount);
        
        JSON.stringify({status: 'success!'});
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

