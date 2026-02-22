import type { MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { initDB } from "./db.ts";


//5:(Init database)
const database = initDB("./expenses.db");

//1:Initialize the Model
const llm = new ChatOpenAI({
    model: 'gpt-5.1-mini',
    temperature: 0,
});



//2:Creating (Call-Model)
async function callModel(state: typeof MessagesAnnotation.State) {



    return state;
}