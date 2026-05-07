import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { ChatOpenAI, messageToOpenAIRole } from "@langchain/openai";
import { initDB } from "./db.ts";
import { initTools } from "./tool.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage, ToolMessage } from "@langchain/core/messages";
import type { StreamMessage } from "./types.ts";

//5:(Init database)
const database = initDB("./expenses.db");

//6:Giving tools access to database
const tools = initTools(database);

//1:Initialize the Model
const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  // model: 'gpt-4.1',
  // temperature: 0,
});

//7:Creating tool node
const toolNode = new ToolNode(tools);

//2:Creating (Call-Model) node
async function callModel(state: typeof MessagesAnnotation.State, config:  LangGraphRunnableConfig) {
  //Giving tool access to LLM
  const llmWithTools = llm.bindTools(tools);


  //Invoking the LLM and getting the response
  const response = await llmWithTools.invoke([
    {
      role: "system",
      content: `You are an expense tracking assistant. Current datetime: ${new Date().toISOString()}.
        Only call the add-expense tool when the user clearly provides:
        - a numeric amount
        - a description of the expense
        Do NOT call any tool for greetings, small talk, or unclear messages.
        If required information is missing, ask a short clarifying question instead of calling a tool.
        
        Call get-expenses tool to get the list of expenses for given date range,
        Call generate-expense-chart tool only when user needs to visualize the expenses.`,
    },
    //sending the message history from state by spreading
    ...state.messages,
  ]);

  //Here we are adding/concatinating this response to our messages history in the state
  return { messages: [response] };
}

//9:shouldContinue function for conditionalEdge from callModel to tool node or end
function shouldContinue(state: typeof MessagesAnnotation.State, config: LangGraphRunnableConfig) {
  //getting the messages
  const messages = state.messages;
  //getting the last message
  const lastMessage = messages.at(-1) as AIMessage;
  
  //Checking if tool_call happen through the last message we get
  if (lastMessage.tool_calls?.length) {

    //we can send custom events here
    const customMessage : StreamMessage = {
      type: 'toolCall:start',
      payload: {
        name: lastMessage.tool_calls[0].name,
        args: lastMessage.tool_calls[0].args,
      }
    };

    config.writer!(customMessage)

    //if the the length is true it means tool call happen so we are routing to tool node
    return "tools";
  }
  
  //if tool call not happen then we are routing to end node
  return END;
};

//12:shouldCallModel function for conditionalEdge from tool node to callModel or  end
function shouldCallModel(state: typeof MessagesAnnotation.State) {
 
  //todo: change this when chart tool is implemented
   //Getting last message
   const messages = state.messages;
   const lastMessage = messages.at(-1) as ToolMessage;

   //converting the last message (string) into javascript
   const message = JSON.parse(lastMessage.content as string);

   if(message.type === 'chart'){
      return END;
   }



  return 'callModel';

};

//8:Building the Graph
const graph = new StateGraph(MessagesAnnotation)
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", shouldContinue, {
    [END]: END,
    tools: "tools",
  })
  .addConditionalEdges('tools', shouldCallModel, {
    callModel: "callModel",
    [END]: END
  });
  
//10:Compiling the graph
export const agent = graph.compile({
  checkpointer: new MemorySaver(),
});

//11:Creating main function
// async function main() {
//   const response = await agent.stream(
//     {
//       messages: [
//         {
//           role: "user",
//         //   content: "Hi",
//           // content: "I bought an flowers for 2500pkr",
//           // content: "how much i have spend total till date?",
//           content: 'hi',  
//         },
//       ],
//     },
//     { streamMode: ['messages'],
//       //todo: generate dynamically
//       configurable: { thread_id: "1" } },
//   );
  
//   for await (const [eventType, chunk] of response){
//     console.log('eventType: ', eventType)
//     console.log("Chunk", JSON.stringify(chunk[0].content, null, 2));
//   };
// };

// main();
