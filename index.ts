import { ChatOpenAI } from "@langchain/openai";


//Initialize the Model
const llm = new ChatOpenAI({
    model: 'gpt-5.1-mini',
    temperature: 0,
});