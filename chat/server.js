const path = require( 'path' )

const express = require( 'express' )
const socketIo = require( 'socket.io' )

// Constants

const PORT = process.env.PORT || 3000

// Helper Functions

const getAbsolutePath = filepath => {
  return path.resolve( __dirname, filepath )
}

// Express

const app = express()

app.use( express.static( getAbsolutePath( 'public' ) ) )

const server = app.listen( PORT, () => {
  console.log( `listening on *:${PORT}` )
} )

// Socket.IO

const io = socketIo( server )

io.sockets.on( 'connection', socket => {
  socket.on( 'chat message', message => {
    console.log( 'Message:', message )
    io.sockets.emit( 'chat message', message )
  } )
} )
