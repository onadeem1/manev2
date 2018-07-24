const { BOOLEAN } = require('sequelize')

module.exports = db => {
  let Friendship = db.define('friendship', {
    accepted: {
      type: BOOLEAN,
      defaultValue: false
    },
    originalRequest: {
      type: BOOLEAN,
      defaultValue: false
    }
  })

  return Friendship
}
