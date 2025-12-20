const {Server} = require('socket.io')

async function initSocketServer (httpServer){

    const io = new Server(httpServer,{})


    io.on('connection',(socket)=>{
        console.log("A User Connected")
    })
}


module.exports = {initSocketServer}