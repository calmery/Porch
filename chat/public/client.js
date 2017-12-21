const peer = new Peer( {
  key: 'viswrd6u6hg58kt9'
} )

peer.on( 'open', () => {
  document.getElementById( 'my-peer-id' ).innerHTML = 'My Peer Id: ' + peer.id
} )

// Helper Functions

const showMessage = ( peerId, message ) => {
  document.getElementById( 'messages' ).innerHTML += peerId + ': ' + message + '<br>'
}

// Main

let connected

peer.on( 'connection', connection => {
  console.log( 'Connected:', connection.id )

  connection.on( 'data', message => showMessage( connection.id, message ) )
} )

// Connect Button

document.getElementById( 'connect' ).addEventListener( 'click', () => {
  const remoteId = document.getElementById( 'peer-id-input' ).value

  connected = peer.connect( remoteId )

  connected.on( 'open', () => {
    console.log( 'Connected:', connected.id )
  } )
}, false )

// Send Button

document.getElementById( 'send' ).addEventListener( 'click', () => {
  const message = document.getElementById( 'message' ).value

  connected.send( message )

  showMessage( peer.id, message )
}, false )

// Close Button

document.getElementById( 'close' ).addEventListener( 'click', () => {
  connected.close()
} )
