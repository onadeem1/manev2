const express = require('express')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const db = require('../database')
const sessionStore = new SequelizeStore({ db })

//initiating express application
const app = express()

//port environment variable used for deployment
const PORT = process.env.PORT || 3000

//require in necessary environment variables
if (process.env.NODE_ENV !== 'production') require('../secrets')

// passport registration
passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.models.user.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

//logging middleware
app.use(morgan('dev'))

//bodyParser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'Who goes there?',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
  })
)

app.use(passport.initialize())
app.use(passport.session())

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
