const { STRING } = require('sequelize')

module.exports = db =>
  db.define('challenge', {
    challengeText: {
      type: STRING
    }
  })

module.exports.associations = (Challenge, { User, Recommendation, Place }) => {
  Challenge.hasMany(Recommendation)
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
