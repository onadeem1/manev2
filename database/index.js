const db = require('./_db');

// set our associations and export our final models
const User = require('./models/user')
const Recommendation = require('./models/recommendation')
const Place = require('./models/place')
const Challenge = require('./models/challenge')

module.exports = db;
