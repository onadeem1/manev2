if (process.env.NODE_ENV === 'development') require('../secrets')
const googleMaps = require('@google/maps')
const gMaps = googleMaps.createClient({ key: process.env.GOOGLE_PLACES_KEY, Promise: Promise })

module.exports = gMaps
