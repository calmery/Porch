import path from 'path'
import express from 'express'
import expressSession from 'express-session'

import crypto from 'crypto'
import socketIo from 'socket.io'
import expressSocketIoSession from 'express-socket.io-session'

import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'

import passwordless from 'passwordless'
import passwordlessRedisstore from 'passwordless-redisstore'
import email from 'emailjs'

import { createClient } from 'redis'
import connectRedis from 'connect-redis'

const EMAIL = process.env.PORCH_EMAIL
const EMAIL_PASSWORD = process.env.PORCH_EMAIL_PASSWORD

const REDIS_HOST = process.env.PORCH_REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.PORCH_REDIS_PORT || 6379
const REDIS_PASSWORD = process.env.PORCH_REDIS_PASSWORD || 'porch'

const redisStore = connectRedis( expressSession )

const session = expressSession( {
  secret: 'ef85c562483d403bb9f2f3f5b04a2cb2',
  resave: false,
  saveUninitialized: false,
  store: new redisStore( {
    client: createClient( REDIS_PORT, REDIS_HOST, { password: REDIS_PASSWORD } ),
    ttl: 260
  } ),
  cookie: { maxAge: 30 * 60 * 1000 }
} )

const app = express()
app.use( cookieParser() )
app.use( bodyParser() )
app.use( session )

app.use( passwordless.sessionSupport() )
app.use( passwordless.acceptToken( { successRedirect: '/conversation' } ) )

app.get( `/`, ( request, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/index.html' ) )
)

app.get( `/conversation`, passwordless.restricted( { failureRedirect: '/login' } ), ( _, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/conversation.html' ) )
)

app.get( `/login`, ( request, response ) => {
  if( request.user )
    response.redirect( '/conversation' )
  else
    response.sendFile( path.resolve( __dirname, 'public/login.html' ) )
} )

app.get( `/logout`, passwordless.logout(), ( _, response ) => response.redirect( '/' ) )

app.post( '/request', passwordless.requestToken( ( user, delivery, callback, request ) => callback( null, user ) ), ( _, response ) =>
  response.redirect( '/' )
)

app.use( express.static( path.resolve( __dirname, 'public' ) ) )

passwordless.init( new passwordlessRedisstore( REDIS_PORT, REDIS_HOST, {
  password: REDIS_PASSWORD
} ) )

const smtpServer = email.server.connect( {
  user: EMAIL,
  password: EMAIL_PASSWORD,
  host: 'smtp.gmail.com',
  ssl: true
} )

passwordless.addDelivery( ( tokenToSend, uidToSend, recipient, callback ) => {
  const host = 'localhost:3000'
  smtpServer.send( {
    text: `Hello !\nYou asked us to send you a magic link for quickly signing in to your porch conversation. Sign in to Porch.\nhttp://${host}/?token=${tokenToSend}&uid=${encodeURIComponent( uidToSend )}`,
    from: 'Porch <' + EMAIL + '>',
    to: recipient,
    subject: 'Token for Small Porch',
    attachment: [ {
      data: `<!DOCTYPE html><style>body{padding:0;margin:0;background:#fafafa;font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:15px;color:#646464}a{text-decoration:none;color:#fff}div#container{width:398px;padding:25px;background:#fff;border-radius:3px;border:1px solid #e6e6e6;margin:10px auto 20px auto}div#container div#greeting{color:#4885ed;margin-bottom:10px}div#container div#button{width:250px;padding:10px 0;background:#4885ed;margin:0 auto;margin-top:10px;text-align:center;border-radius:3px}div#title{text-align:center;color:#4885ed;font-size:20px;margin-bottom:10px;margin-top:20px}</style><div id=title>Porch</div><div id=container><div id=greeting>Hello !</div>You asked us to send you a magic link for quickly signing in to your porch conversation. <a href="http://${host}/?token=${tokenToSend}&uid=${encodeURIComponent( uidToSend )}"><div id=button>Sign in to Porch<div></a>`,
      alternative: true
    } ]
  }, ( error, message ) => {
    if( error )
      console.log( error )

    callback( error )
  } )
} )


const users = {}
const statuses = []

const createHash = src => {
  const md5 = crypto.createHash( 'md5' )
  md5.update( src, 'binary' )
  return md5.digest( 'hex' )
}

const io = socketIo( app.listen( 3000 ) )

io.use( expressSocketIoSession( session ) )
io.on( 'connection', socket => {
  if( undefined === socket.handshake.session.passwordless )
    return

  socket._id = createHash( socket.handshake.session.passwordless )
  if( undefined === users[socket._id] )
    users[socket._id] = {
      id: socket._id,
      screen_name: '',
      name: '',
      created_at: ( new Date() ).toLocaleString(),
      profile_image_url: ''
    }

  // New User

  socket.on( 'statuses/timeline', data => {
    if( undefined === data ) data = {}
    const _ = data._

    socket.emit( 'statuses/timeline', { _, data: statuses } )
  } )
  socket.on( 'statuses/update', data => {
    if( undefined === data ) data = {}
    const _ = data._

    const text = data.text

    let status

    if( undefined !== text )
      statuses.push( status = {
        text: text.replace( /\</g, '&lt;' ).replace( /\>/g, '&gt;' ),
        created_at: ( new Date() ).toLocaleString(),
        user: socket._id
      } )

    socket.emit( 'statuses/update', { _, data: status } )
    socket.broadcast.emit( 'statuses/update', { data: status } )
  } )
  socket.emit( 'statuses/timeline', { data: statuses } )

  socket.on( 'users', data => {
    if( undefined === data ) data = {}
    const _ = data._
    socket.emit( 'users', { _, data: users } )
  } )
  socket.on( 'users/show', data => {
    if( undefined === data ) data = {}
    const _ = data._
    const userId = data.user_id

    if( undefined === userId || undefined === users[userId] ){
      socket.emit( 'users/show', { _ } )
      return
    }

    socket.emit( 'users/show', { _, data: users[userId] } )
  } )
  socket.emit( 'users', { data: users } )
  socket.broadcast.emit( 'users/update', { data: users[socket._id] } )

  socket.on( 'account', data => {
    if( undefined === data ) data = {}
    const _ = data._
    socket.emit( 'account', { _, data: users[socket._id] } )
  } )
  socket.on( 'account/update_profile', data => {
    if( undefined === data ) data = {}
    const _ = data._
    const user = users[socket._id]

    const name = data.name
    const screen_name = data.screen_name

    let isUpdate = false

    if( undefined !== name ){
      user.name = name
      isUpdate = true
    }

    if( undefined !== screen_name ){
      const match = screen_name.match( /[a-zA-Z0-9]+/ )

      if( null !== match && screen_name === match[0] ){
        user.screen_name = screen_name
        isUpdate = true
      }
    }

    socket.emit( 'account/update_profile', { _, data: user } )

    if( isUpdate )
      io.sockets.emit( 'account/update_profile', { data: user } )
  } )
  socket.on( 'account/update_profile_image', data => {
    if( undefined === data ) data = {}
    const _ = data._

    const image = data.image

    if( undefined !== image ){
      users[socket._id].profile_image_url = image
      io.sockets.emit( 'account/update_profile_image', { data: users[socket._id] } )
    }

    socket.emit( 'account/update_profile_image', { _, data: users[socket._id] } )
  } )
  socket.emit( 'account', { data: users[socket._id] } )

} )
