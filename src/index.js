const path = require( 'path')
const express = require( 'express' )
const cookieParser = require( 'cookie-parser' )
const bodyParser = require( 'body-parser' )

const passwordless = require( 'passwordless' )
const passwordlessRedisstore = require( 'passwordless-redisstore' )
const email = require( 'emailjs' )

const redis = require( 'redis' )
const redisStore = require( 'connect-redis' )( require( 'express-session' ) )

const crypto = require( 'crypto' )

const REDIS_HOST = process.env.PORCH_REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.PORCH_REDIS_PORT || 6379
const REDIS_PASSWORD = process.env.PORCH_REDIS_PASSWORD || 'porch'

const EMAIL = process.env.PORCH_EMAIL
const EMAIL_PASSWORD = process.env.PORCH_EMAIL_PASSWORD

const session = require( 'express-session' )( {
  secret: 'ef85c562483d403bb9f2f3f5b04a2cb2',
  resave: false,
  saveUninitialized: false,
  store: new redisStore( {
    client: redis.createClient( REDIS_PORT, REDIS_HOST, {
      password: REDIS_PASSWORD
    } ),
    ttl: 260
  } ),
  cookie: {
    maxAge: 30 * 60 * 1000
  }
} )

const createHash = src => {
  const md5 = crypto.createHash( 'md5' )
  md5.update( src, 'binary' )
  return md5.digest( 'hex' )
}

const app = express()
app.use( cookieParser() )
app.use( bodyParser() )
app.use( session )

app.use( passwordless.sessionSupport() )
app.use( passwordless.acceptToken( { successRedirect: '/conversation' } ) )

app.get( '/', ( request, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/index.html' ) )
)

app.get( '/conversation', passwordless.restricted( { failureRedirect: '/login' } ), ( request, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/conversation.html' ) )
)

app.get( '/members', passwordless.restricted( { failureRedirect: '/login' } ), ( request, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/members.html' ) )
)

app.get( '/profile', passwordless.restricted( { failureRedirect: '/login' } ), ( request, response ) =>
  response.sendFile( path.resolve( __dirname, 'public/profile.html' ) )
)

app.get( '/login', ( request, response ) => {
  if( request.user )
    response.redirect( '/conversation' )
  else
    response.sendFile( path.resolve( __dirname, 'public/login.html' ) )
} )

app.get( '/logout', passwordless.logout(), ( _, response ) => response.redirect( '/' ) )

app.post( '/request', passwordless.requestToken( ( user, delivery, callback, req ) => { callback( null, user ) } ), ( _, response ) =>
  response.redirect( '/' )
)

app.use( express.static( path.resolve( __dirname, 'public' ) ) )

const server = app.listen( process.env.PORT || 3000 )

// Mail

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
  smtpServer.send( {
    text: `Hello !\nYou asked us to send you a magic link for quickly signing in to your porch conversation. Sign in to Porch.\nhttp://small.porch.jp/?token=${tokenToSend}&uid=${encodeURIComponent( uidToSend )}`,
    from: 'Porch <' + EMAIL + '>',
    to: recipient,
    subject: 'Token for Small Porch',
    attachment: [ {
      data: `<!DOCTYPE html><style>body{padding:0;margin:0;background:#fafafa;font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:15px;color:#646464}a{text-decoration:none;color:#fff}div#container{width:398px;padding:25px;background:#fff;border-radius:3px;border:1px solid #e6e6e6;margin:10px auto 20px auto}div#container div#greeting{color:#4885ed;margin-bottom:10px}div#container div#button{width:250px;padding:10px 0;background:#4885ed;margin:0 auto;margin-top:10px;text-align:center;border-radius:3px}div#title{text-align:center;color:#4885ed;font-size:20px;margin-bottom:10px;margin-top:20px}</style><div id=title>Porch</div><div id=container><div id=greeting>Hello !</div>You asked us to send you a magic link for quickly signing in to your porch conversation. <a href="http://small.porch.jp/?token=${tokenToSend}&uid=${encodeURIComponent( uidToSend )}"><div id=button>Sign in to Porch<div></a>`,
      alternative: true
    } ]
  }, ( error, message ) => {
    if( error )
      console.log( error )

    callback( error )
  } )
} )

// WebSocket

const users = {}
const messages = []

const io = require( 'socket.io' )( server )
const sharedsession = require( 'express-socket.io-session' )

io.use( sharedsession( session ) )
io.on( 'connection', socket => {
  if( !socket.handshake.session.passwordless )
    return

  socket.porchId = createHash( socket.handshake.session.passwordless )

  if( !users[socket.porchId] )
    users[socket.porchId] = {
      id: socket.porchId,
      name: socket.porchId,
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAABECAYAAAA4E5OyAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAHfUlEQVR4Ae1aTY8bNRh+k91sdrPboLZbiapqiwRCKj2UE18SSBy4cUX8Dvgh/ID+A6jEiRtcEBIgeoHDQgVUaoVKxfZj2+xu9iNfPI89djweeyZNJmnVjleTsf1+Pe9jz9jxpjZCkapYBuq2VlUUAxUh3kSoCKkI8RjwmtUMqQjxGPCa1QypCPEY8JrVDKkI8RjwmtUMqQjxGPCa1QypCPEY8JrLXts2eSYw6clADbq1Gj+fXiHWSc8x6jlYa6HzEDp+uunNn9hYjpkZwuMiEtg97svf93cVM3nk9IcjOdVakYsnN+afRU6E2zt7stM9lqV6HK2aQfh4bfOEtFaW1YzytbOEQK2Gv/t7h3Lluy3Njm9lgDF4tydfXD4rn737unrEFv3omAH8+sa/8vnWXZFWQwSDFC2Q3f74TblwaiOIN0OIccRcLzaXpY3p0kB9YATOfR2yHwcjaS3pxWrRZBCKGavWMjAA73sY+f3AqegSdHvgaReynEkkUUIYjI6bSJr+++zwykqCxowHX2yLJoWxCYMYWXq4jgwg1aM/mOgxrhBZjlo+ISRhmFx+DLZ131jCd8+iSzqkXmmIOd2v8yDS0Ex3MeduzOjUd2yMw/3hXmOzqPssKHIJWVQC5cWZhQqN4jkjZPz4Tkvyc0bItDSM7XJXmbFaeTWuBu4mm5Oc4+pPdt2HHZEv8KGk5KmGrzlRe6GEqCSBmRs/t6RbWmL6QmS5tmk2qT1bKZmQOHzODI72nc6B/HGvIyvYzMXgk4zjwVAunWnLufaa2mMUzpTZeLDWJRNixtX6txU+JpwZJOOjH26KrCF0HiMHffn2/Vc1IYmtdTbHSsmExJEaqjgzSMY7qw05sISYitZq4fYTXCld3I1t3Ht5kpIJYWL58FXq+DjAM7RneLD5mA74QNW0rHgBlXIJGSGRCB9MLiQKJ53ujdnOg59y9yGhjBPUOaJUXlovrZ1updRLb5RLSA689JjnKCpRWjvdKrKdTb4wQiYd5VDyk9rORoW2LpWQvIPeUKKEwGT9y3/bxGzZ7+566W/WUvhSzQOjg+MAyUWB1YM7jswaQSUz1LivqZ1WytJ6WTMMmR6ojRMP+LbRdAA3lHEx6T2XEBzJS204TE7BdJrjrCgDAMh5xMiSPi1LOrXIfidRvTiH/Zn9YT7oSJ3VGg/1zJmfkSTOcVMYiBVnpgr3WKTIVF8XmA+uvBInpFaXTqslLYCjCx7N+YWrrDSacn1/KKdv3pNB3uEuVOmHx47ff4gDad+Z16brnf5Irv21bSeWp2KbPGknBmlvyGOcrYaOEHH0LIe4eKYqyC1W4oQgSL+5Kt1kdHge6Y9LF33nmyJXDwdydWs7q+BGpfFhX768clY+eOWMK4nWv/pzWz79DSfpedt8WpPdRl3Or7dkB1U/XYp5dEi8xxy0zIyDIClxQugFbNZ5gQo/CO1pfAw0FzGL1ld5rh0vG9D5BWLjZ0hgIIk8MZQhm3V28DFRuEHGWzhN3yuY6vuwOYQOMSkf9JMU+mZc5pIRGqXkHieECvDEN4cfwPhgP5/NI9xD09To6XsaDF8T5p1jyKAe66l4aJCMh6lO7dH/zNg6CsqcQQuINQPmmD7nVZf9QKovHiEBEtyuF4+QgkdvYkIK/LgkP3N1g12/RwDPdASQxl+qybPGtYOs5a0h9J8TIxBWd9HGf6S1n5Ak6kYJ6Mf35VqkcshRjBMCTKfhcR1XEw6W0Y754b88D3DF5BDNtZC+VVzLBMCGV9hFWR0V5pRXooTw/6MPekN5wCCRQNYxlrPzSzW7m3XVTZ13bvPNTDNLrvWRVJQel0cUpcvt+Ajji2SMr0TV3lZQu4VfIeglFVo11hOxMTJLLvrzNtQZQgzQTfwI5te3LygUGp6Nbyt03AQRW52efHJnX15GvcuAVmNcGdDJ+ki+6dbkv1u70oNxzC9zaWBXdh26cvqkbMPv+Px17JOPAc9f/wEZ186ty+V2Q45Qj21E6ZdEMTcWk6tqJB+l/KTq992eXL7xWM4C+EM4Dn3vIUltXB2y2EcrxkYCTI0wvpe0kV0HfUzeLxxNPgJ38Z1n69JL8sYJfmOZrJCcEITMDKE7KtKA5xt5hWJ+sTpigpja2G8r2xB4Tv9d6G/CeXsl/j8ZE48YOtB/AAKZpvoiaYTJ3cYZDTUG9A8AKpSoa8of3cV0goTQmAahKeU65qizqCmaPPe6J/tJajGB5BHuO2xMUIiBNoXqiG0eE6Zq6hOEyKhECcloFnUUoh47YKKllieIXRTXzroixRdFXh4hpQ/7EwxBibFLfWQ4c831BOlMrWqfFFuZ2pU1LI8QjBJXd+5suXMtcdAsWLdCDrhyqYW2xGDlEYLlrgsauA9ZZFG72Wdthhg8j9x9i+l02XFH0shjfb7cbbOe2HEZ55bdiN1w09SDO9VJHRlcXWzM7h8NgrvJSX3Nosf90GZzSfhrZoNpWn8zEcKgswKYFnjIrgwsM79DOHMJxH1aQmDn3ceNsvv0TRtvZkIYmEAKdu7T4lu4XXkbs4VDn0/AihCP14oQj5D/ATRqB7esnJ8tAAAAAElFTkSuQmCC',
      online: true
    }

  users[socket.porchId].online = true
  socket.on( 'disconnect', _ => users[socket.porchId].online = false )

  socket.on( 'messages', _ => socket.emit( 'messages', messages.slice( -100 ) ) )
  socket.on( 'users', _ => socket.emit( 'users', users ) )

  socket.on( 'profile:update', profile => {
    const name = profile.name
    const icon = profile.icon

    if( name ) users[socket.porchId].name = name
    if( icon ) users[socket.porchId].icon = icon

    io.sockets.emit( 'profile:update', users[socket.porchId] )
    socket.emit( 'profile:updated', users[socket.porchId] )
  } )
  socket.on( 'profile:get', id => socket.emit( 'profile:get', id ? users[id] : users[socket.porchId] ) )
  socket.on( 'profile:all', _ => socket.emit( 'profile:all', users ) )

  socket.on( 'reset:members', _ => members = [] )
  socket.on( 'reset:users', _ => users = {} )

  socket.on( 'message', message => {
    if( socket.porchId ){
      const date = new Date()
      const time = date.getHours() + ':' + date.getMinutes()
      messages.push( { id: socket.porchId, message, time } )
      io.sockets.emit( 'message', { id: socket.porchId, message, time } )
    }
  } )
} )
