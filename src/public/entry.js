import Elm from './elm/Main.elm'

import './static/index.html'
import './static/login.html'

import './static/conversation.html'
import 'normalize.css'
import './static/css/layout.css'

import io from './static/js/socket.io.js'

const socket = io()
const app = Elm.Main.fullscreen()

app.ports.setTitle.subscribe( title =>
  document.title = title
)

socket.on( 'statuses/timeline', ( { data } ) => {
  console.log( 'Server -> Client -> Elm : statuses/timeline' )
  app.ports.statusesTimeline.send( JSON.stringify( data ) )
} )
socket.on( 'statuses/update', ( { data } ) => {
  console.log( 'Server -> Client -> Elm : statuses/update' )
  app.ports.statusesUpdate.send( JSON.stringify( data ) )
} )
app.ports.sendMessage.subscribe( text => {
  console.log( 'Elm -> Client -> Server : statuses/update' )
  socket.emit( 'statuses/update', ( { text } ) )
} )

socket.on( 'users', ( { data } ) => {
  console.log( 'Server -> Client -> Elm : users' )
  app.ports.users.send( JSON.stringify( Object.values( data ) ) )
} )
socket.on( 'users/update', ( { data } ) => {
  console.log( 'Server -> Client -> Elm : users/update' )
  app.ports.usersUpdate.send( JSON.stringify( data ) )
} )

socket.on( 'account', ( { data } ) => {
  console.log( 'Server -> Client -> Elm : account' )
  app.ports.account.send( JSON.stringify( data ) )
} )
socket.on( 'account/update_profile', response => {
  console.log( 'Server -> Client -> Elm : account/update_profile' )
  if( undefined !== response._ )
    app.ports.account.send( JSON.stringify( response.data ) )
  else
    app.ports.accountUpdateProfile.send( JSON.stringify( response.data ) )
} )
socket.on( 'account/update_profile_image', response => {
  console.log( 'Server -> Client -> Elm : account/update_profile' )
  if( undefined !== response._ )
    app.ports.account.send( JSON.stringify( response.data ) )
  else
    app.ports.accountUpdateProfile.send( JSON.stringify( response.data ) )
} )
app.ports.accountUpdateName.subscribe( name => {
  console.log( 'Elm -> Client -> Server : account/update_profile' )
  socket.emit( 'account/update_profile', ( { _: socket.id, name } ) )
} )
app.ports.accountUpdateScreenName.subscribe( screen_name => {
  console.log( 'Elm -> Client -> Server : account/update_profile' )
  socket.emit( 'account/update_profile', ( { _: socket.id, screen_name } ) )
} )
app.ports.accountUpdateImage.subscribe( _ => {
  console.log( 'Elm -> Client -> Server : account/update_profile_image' )
  const e = document.getElementById( 'image' )
  if( undefined !== e ){
    const image = e.files[0]
    if( image && image.size > 500000 ){
      alert( 'File size limit exceeded. ' )
      return
    }

    if( image ){
      const fileReader = new FileReader()
      fileReader.onload = e =>
        socket.emit( 'account/update_profile_image', ( { _: socket.id, image: e.target.result } ) )
      fileReader.readAsDataURL( image )
    }
  }
} )

window.socket = socket
