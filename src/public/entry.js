import Elm from './elm/Main.elm'

import './static/conversation.html'
import 'normalize.css'
import './static/css/layout.css'

import io from './static/js/socket.io.js'

const socket = io()
const app = Elm.Main.fullscreen()

const log = console.log
const dump = JSON.stringify

app.ports.setTitle.subscribe( title =>
  document.title = title
)

socket.on( 'statuses/timeline', ( { data } ) => {
  log( 'Server -> Client -> Elm : statuses/timeline' )
  app.ports.statusesTimeline.send( dump( data ) )
} )

socket.on( 'statuses/update', ( { data } ) => {
  log( 'Server -> Client -> Elm : statuses/update' )
  app.ports.statusesUpdate.send( dump( data ) )
} )

app.ports.sendMessage.subscribe( text => {
  log( 'Elm -> Client -> Server : statuses/update' )
  socket.emit( 'statuses/update', ( { text } ) )
} )

socket.on( 'users', ( { data } ) => {
  log( 'Server -> Client -> Elm : users' )
  app.ports.users.send( dump( Object.values( data ) ) )
} )

socket.on( 'users/update', ( { data } ) => {
  log( 'Server -> Client -> Elm : users/update' )
  app.ports.usersUpdate.send( dump( data ) )
} )

socket.on( 'account', ( { data } ) => {
  log( 'Server -> Client -> Elm : account' )
  app.ports.account.send( dump( data ) )
} )

socket.on( 'account/update_profile', response => {
  log( 'Server -> Client -> Elm : account/update_profile' )
  if( undefined !== response._ )
    app.ports.account.send( dump( response.data ) )
  else
    app.ports.accountUpdateProfile.send( dump( response.data ) )
} )

socket.on( 'account/update_profile_image', response => {
  log( 'Server -> Client -> Elm : account/update_profile' )
  if( undefined !== response._ )
    app.ports.account.send( dump( response.data ) )
  else
    app.ports.accountUpdateProfile.send( dump( response.data ) )
} )

app.ports.accountUpdateName.subscribe( name => {
  log( 'Elm -> Client -> Server : account/update_profile' )
  socket.emit( 'account/update_profile', ( { _: socket.id, name } ) )
} )

app.ports.accountUpdateScreenName.subscribe( screen_name => {
  log( 'Elm -> Client -> Server : account/update_profile' )
  socket.emit( 'account/update_profile', ( { _: socket.id, screen_name } ) )
} )

app.ports.accountUpdateImage.subscribe( _ => {
  log( 'Elm -> Client -> Server : account/update_profile_image' )
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
