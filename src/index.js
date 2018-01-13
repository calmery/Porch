const path = require( 'path')
const express = require( 'express' )
const redis = require( 'redis' )
const redisStore = require( 'connect-redis' )( require( 'express-session' ) )
const client = redis.createClient( 6379, 'redis' )
const session = require( 'express-session' )( {
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
  store: new redisStore( {
    host: 'redis',
    port: 6379,
    client: client,
    ttl: 260
  } ),
  cookie: {
    maxAge: 30 * 60 * 1000
  }
} )

const uuid = require( 'uuid' )
const email = require( 'emailjs' )

const passwordless = require( 'passwordless' )
const passwordlessRedisstore = require( 'passwordless-redisstore' )

const cookieParser = require( 'cookie-parser' )
const bodyParser = require( 'body-parser' )

const app = express()
app.use( cookieParser() )
app.use( bodyParser() )
app.use( session )

app.use( passwordless.sessionSupport() )
app.use( passwordless.acceptToken( { successRedirect: '/' } ) )

app.get( '/', ( request, response ) => {
  response.send( 'User ' + request.user )
} )

app.get( '/restricted', passwordless.restricted(), ( request, response ) => {
  response.sendFile( path.resolve( __dirname, 'public/index.html' ) )
} )

app.get( '/login', ( request, response ) => {
  response.sendFile( path.resolve( __dirname, 'public/login.html' ) )
} )

app.get( '/logout', passwordless.logout(), ( req, res ) => {
  res.redirect( '/' )
} )

app.post( '/send', passwordless.requestToken(
  ( user, delivery, callback, req ) => {
    callback( null, user )
  } ), ( req, res ) => {
    res.sendFile( path.resolve( __dirname, 'public/sent.html' ) )
  }
)

app.get( '/accept', passwordless.acceptToken(), ( request, response ) => {
  response.send( 'Hello ' + request.user )
} )

const server = app.listen( process.env.PORT || 3000 )

// Mail

const user = process.env.PORCH_MAIL_USER
const password = process.env.PORCH_MAIL_PASSWORD

passwordless.init( new passwordlessRedisstore( 6379, 'redis' ) )

const smtpServer = email.server.connect( {
  user: user,
  password: password,
  host: 'smtp.gmail.com',
  ssl: true
} )

passwordless.addDelivery( ( tokenToSend, uidToSend, recipient, callback ) => {
  const host = '127.0.0.1:3000'

  smtpServer.send( {
    text: 'Hello!\nAccess your account here: http://' + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent( uidToSend ),
    from: user + '@gmail.com',
    to: recipient,
    subject: 'Token for ' + host
  }, ( err, message ) => {
    if( err ){ console.log( err ) }
    callback( err )
  } )
} )

// WebSocket

const io = require( 'socket.io' )( server )
const sharedsession = require( 'express-socket.io-session' )

io.use( sharedsession( session ) )
io.on( 'connection', socket => {
  socket.on( 'id', _ => {
    socket.emit( 'id', JSON.stringify( socket.handshake.session ) )
  } )

  socket.on( 'join', roomId => {
    socket.handshake.session.roomId = roomId
    socket.join( roomId )
    console.log( socket.handshake.session.roomId )
  } )

  socket.on( 'message', message => {
    socket.broadcast.to( socket.handshake.session.roomId ).emit( 'message', message )
  } )
} )
