const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ChatOpenAI } = require("@langchain/openai");
const { ToolMessage, AIMessage, HumanMessage } = require("@langchain/core/messages")
const tools = require("./tools")    


const model = new ChatOpenAI({
  modelName: "gpt-4o-mini", 
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY, 
});


const graph = new StateGraph(MessagesAnnotation)
    .addNode("chat", async (state, config) => {
        const response = await model.invoke(state.messages, { 
            tools: [tools.searchProduct, tools.addProductToCart] 
        });
        return { messages: [response] }; 
    })
    .addNode("tools", async (state, config) => {
        const lastMessage = state.messages[state.messages.length - 1];
        const toolCalls = lastMessage.tool_calls;

        const results = await Promise.all(toolCalls.map(async (call) => {
            const tool = tools[call.name];
            const toolResult = await tool.func({ ...call.args, token: config.metadata.token });
            return new ToolMessage({ 
                content: toolResult, 
                tool_call_id: call.id, 
                name: call.name 
            });
        }));

        return { messages: results };
    })
    .addEdge("__start__", "chat")
    .addConditionalEdges("chat", (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.tool_calls?.length > 0) return "tools";
        return "__end__";
    })
    .addEdge("tools", "chat");


const agent = graph.compile()


module.exports = agent







