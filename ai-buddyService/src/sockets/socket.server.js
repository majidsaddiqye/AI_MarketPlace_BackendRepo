const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const agent = require("../agent/agent");

async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use((socket, next) => {
    const cookies = socket.handshake.headers?.cookie;
    const { token } = cookies ? cookie.parse(cookies) : {};

    if (!token) return next(new Error('Token not provided'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        socket.token = token;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {

    socket.on('message', async (data) => {
        try {   
            const agentResponse = await agent.invoke({
                messages: [{ role: "user", content: data }]
            }, {
                recursionLimit: 10, 
                metadata: { token: socket.token }
            });

            const messages = agentResponse.messages;
            const lastMessage = messages[messages.length - 1];

            if (lastMessage && lastMessage.content) {
                socket.emit('message', lastMessage.content);
            }

        } catch (error) {
            console.error("AI Agent Error:", error.message);
            socket.emit('message', "System busy: " + error.message);
        }
    });
})
}


module.exports = { initSocketServer };
