const express = require('express')
const morgan = require('morgan')
const db = require('../database')

//initiating express application
const app = express()

//port environment variable used for deployment
const PORT = process.env.PORT || 3000

//logging middleware
app.use(morgan('dev'))

//bodyParser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// re-direct api routes
app.use('/api', require('./api'))

//Error Handler
app.use((err, req, res, next) => {
  console.error(err)
  console.error(err.stack)
  res.status(err.status || 500).send(err.message || 'Internal Server Error')
})

//start functions
const syncDb = () => db.sync().then(() => console.log('Database has been synced!'))

const startServer = () => {
  app.listen(PORT, err => {
    if (err) throw err
    console.log(`Welcome to the Mane Revolution, currently on ${PORT}`)
  })
}

async function bootApp() {
  await syncDb()
  await startServer()
}

bootApp()
