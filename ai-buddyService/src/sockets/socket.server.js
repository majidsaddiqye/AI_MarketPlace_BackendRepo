const { Server } = require("socket.io");

const jwt = require("jsonwebtoken");

const cookie = require("cookie");

const { HumanMessage } = require("@langchain/core/messages");

const agent = require("../agent/agent");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  //verify token then connect

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie;

    const { token } = cookies ? cookie.parse(cookies) : {};

    if (!token) {
      return next(new Error("Token Not Provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;

      socket.token = token;

      next();
    } catch (error) {
      next(new Error("Invalid Token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("A User Connected");

    socket.on("ai-message", async (data) => {
      try {
        console.log("Received message:", data);
        
        const agentResponse = await agent.invoke(
          {
            messages: [
              new HumanMessage({
                content: data,
              }),
            ],
          },
          {
            metadata: {
              token: socket.token,
            },
          }
        );

        console.log("AgentResponse:", JSON.stringify(agentResponse, null, 2));
        
        // Extract the last message from the response
        const messages = agentResponse.messages || [];
        console.log("Messages count:", messages.length);
        
        if (messages.length === 0) {
          throw new Error("No messages in agent response");
        }
        
        // Find the last AIMessage (skip ToolMessages)
        let lastMessage = null;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i]._getType && messages[i]._getType() === "ai") {
            lastMessage = messages[i];
            break;
          }
        }
        
        // Fallback to last message if no AIMessage found
        if (!lastMessage) {
          lastMessage = messages[messages.length - 1];
        }
        
        console.log("Last message:", lastMessage);
        console.log("Last message type:", lastMessage?._getType?.());
        console.log("Last message content:", lastMessage?.content);

        if (!lastMessage) {
          throw new Error("No response message from agent");
        }

        // Get content from the last message - handle both string and array content
        let responseContent = "";
        if (typeof lastMessage.content === "string") {
          responseContent = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          responseContent = lastMessage.content
            .map((item) => (typeof item === "string" ? item : item.text || ""))
            .join("");
        } else if (lastMessage.content) {
          responseContent = String(lastMessage.content);
        } else {
          responseContent = "I'm sorry, I couldn't generate a response.";
        }
        
        if (!responseContent || responseContent.trim() === "") {
          responseContent = "I'm sorry, I couldn't generate a response.";
        }
        
        console.log("Sending response:", responseContent);
        socket.emit("ai-response", responseContent);
      } catch (error) {
        console.error("Agent Error:", error);
        console.error("Error stack:", error.stack);
        socket.emit("ai-response", {
          error: true,
          message: error.message || "An error occurred while processing your request.",
        });
      }
    });
  });
}

module.exports = { initSocketServer };
