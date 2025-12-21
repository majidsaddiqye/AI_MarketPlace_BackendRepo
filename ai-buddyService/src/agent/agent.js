const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {
  ToolMessage,
  AIMessage,
  HumanMessage,
} = require("@langchain/core/messages");
const tools = require('../agent/tools')

const model = new ChatGoogleGenerativeAI({
  apiKey: "AIzaSyC2oncFwntc3FekuRLeQ2TTkER2dyG0DEM",
  model: "gemini-2.0-flash"
,
  temperature: 0.5,
});

const graph = new StateGraph(MessagesAnnotation)
  .addNode("tools", async (state, config) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const toolsCall = lastMessage.tool_calls || [];

    if (!toolsCall || toolsCall.length === 0) {
      return state;
    }

    const toolCallResults = await Promise.all(
      toolsCall.map(async (call) => {
        const tool = tools[call.name];
        if (!tool) {
          throw new Error(`Tool ${call.name} not found`);
        }

        const toolInput = call.args || {};
        const toolResult = await tool.func({
          ...toolInput,
          token: config.metadata?.token,
        });

        return new ToolMessage({ content: toolResult, name: call.name });
      })
    );
    state.messages.push(...toolCallResults);
    return state;
  })
  .addNode("chat", async (state, config) => {
    const response = await model.invoke(state.messages, {
      tools: [tools.searchProduct, tools.addProductToCart],
    });

    // Handle both response.text and response.content
    const content = response.content || response.text || "";
    
    state.messages.push(
      new AIMessage({ 
        content: content, 
        tool_calls: response.tool_calls || undefined 
      })
    );
    return state;
  })
  .addEdge("__start__", "chat")
  .addConditionalEdges("chat", async (state) => {
    const lastMessage = state.messages[state.messages.length - 1];

    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
      return "tools";
    } else {
      return "__end__";
    }
  })
  .addEdge("tools", "chat");

const agent = graph.compile();

module.exports = agent;
