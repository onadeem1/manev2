'use strict'

const Sequelize = require('sequelize');
const createModels = require('./models');

//TODO: Change database to environment variable
const db = new Sequelize('postgres://localhost:5432/manestream', {
  logging: false,
  dialect: 'postgres',
  native: true
});

//initialize the models & place on the database object for easy destructuring access
Object.assign(db, createModels(db));

module.exports = db;
