import express from 'express'

const app = express()

app.get( '/', ( _, response ) => response.send( 'Hello World' ) )

app.listen( 3000 )
