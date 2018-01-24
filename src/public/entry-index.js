import Elm from './static/Main.elm'

import './static/index.html'
import 'normalize.css'
import './static/css/layout-index.css'

const app = Elm.Main.fullscreen()

app.ports.setTitle.subscribe( title =>
  document.title = title
)

app.ports.sendMail.subscribe( mail => {
  mail = mail.replace( /\n/g, '' )
  const matched = mail.match( /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g )
  if( matched !== null && matched.length === 1 && matched[0] === mail ){
    const overlay = document.createElement( 'div' )
    // Bad Code
    overlay.style.width = overlay.style.height = '100%'
    overlay.style.background = 'rgba( 0, 0, 0, .35 )'
    overlay.style.position = 'fixed'
    overlay.style.top = overlay.style.left = '0'
    document.body.appendChild( overlay )
    fetch( '/request', {
      method: 'POST',
      body: 'user=' + encodeURIComponent( mail ),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      }
    } )
      .then( response => {
        console.log( response )
        if( response.status === 200 ){
          document.body.removeChild( overlay )
          alert( 'Check your mailbox.' )
          app.ports.completeMail.send( '' )
        }
      } )
  } else {
    alert( 'Doesn’t look like a valid email.' )
  }
} )
