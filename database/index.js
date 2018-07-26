const Sequelize = require('sequelize')
const createModels = require('./models')
const pkg = require('../package.json')

const databaseName = pkg.name + (process.env.NODE_ENV === 'test' ? '-test' : '')
const databaseURL = process.env.DATABASE_URL || `postgres://localhost:5432/${databaseName}`

const db = new Sequelize(databaseURL, {
  logging: false,
  dialect: 'postgres',
  native: true
})

module.exports = db

//global mocha hook used for resource cleanup,
if (process.env.NODE_ENV === 'test') {
  after('close database connection', () => db.close())
}
//initialize the models & place on the database object for easy destructuring access
Object.assign(db, createModels(db))
