import type { MessagesAnnotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { initDB } from "./db.ts";
import { initTools } from "./tool.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";


//5:(Init database)
const database = initDB("./expenses.db");

//6:Giving tools access to database
const tools = initTools(database);




//1:Initialize the Model
const llm = new ChatOpenAI({
    model: 'gpt-5.1-mini',
    temperature: 0,
});


//7:Creating tool node
const toolNode = new ToolNode(tools);



//2:Creating (Call-Model)
async function callModel(state: typeof MessagesAnnotation.State) {

     //Giving tool access to LLM
     const llmWithTools =  llm.bindTools(tools);

     //Invoking the LLM and getting the response 
     const response = await llmWithTools.invoke([
        {
            role: 'system', 
             content: `You are a helpful expense tracking assistant. Current datetime: ${new Date().toISOString()}
             Call add_expense tool to add the expense to database.
             `
        },
        //sending the message history from state by spreading
        ...state.messages
     ]);

     //Here we are adding/concatinating this response to our messages history in the state
    return {messages: [response]};
};

