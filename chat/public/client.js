const connected = {}

const peer = new Peer( {
  key: 'viswrd6u6hg58kt9'
} )

peer.on( 'open', () => {
  document.getElementById( 'my-peer-id' ).innerHTML = 'My Peer Id: ' + peer.id
} )

// Helper Functions

const connect = peerId => {
  const connection = peer.connect( peerId )

  connection.on( 'open', () => {
    console.log( 'Connected :', peer.id, '->', connection.peer )
    connected[connection.peer] = connection
  } )
}

const showMessage = ( peerId, message ) => {
  document.getElementById( 'messages' ).innerHTML += peerId + ': ' + message + '<br>'
}

// Main

peer.on( 'connection', connection => {
  console.log( 'Connected :', connection.peer, '->', peer.id )

  if( connected[connection.peer] === undefined ){
    connect( connection.peer )
  }

  connection.on( 'data', message => showMessage( connection.peer, message ) )
} )

// Connect Button

document.getElementById( 'connect' ).addEventListener( 'click', () => {
  const remoteId = document.getElementById( 'peer-id-input' ).value
  connect( remoteId )
}, false )

// Send Button

document.getElementById( 'send' ).addEventListener( 'click', () => {
  const message = document.getElementById( 'message' ).value

  Object.values( connected ).forEach( connection => connection.send( message ) )

  showMessage( peer.id, message )
}, false )

// Close Button

document.getElementById( 'close' ).addEventListener( 'click', () => {
  Object.values( connected ).forEach( connection => connection.close() )
} )
