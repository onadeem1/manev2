'use strict'

const Sequelize = require('sequelize');
const createModels = require('./models');
const databaseURL = process.env.DATABASE_URL || `postgres://localhost:5432/manestream`

const db = new Sequelize(databaseURL, {
  logging: false,
  dialect: 'postgres',
  native: true
});

//initialize the models & place on the database object for easy destructuring access
Object.assign(db, createModels(db));

module.exports = db;
