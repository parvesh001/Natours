//provides a event emitter class that let us create, emit, listen, and remove events
const fs = require('fs')

const EventEmitter = require('events')

const http = require('http')

class Server extends EventEmitter(){
     constructor(){
      super();
      this.server = http.createServer(this.handleRequest.bind(this))
     }
     
     handleRequest(req,res){
        this.emit('request', req,res)
     }
     listen(port){
      this.server.listen(port)
     }
}

const server = new Server()

server.on('request', (req,res)=>{
  console.log('request came')
})

server.listen(8080)
s