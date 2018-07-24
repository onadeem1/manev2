const { STRING } = require('sequelize')

module.exports = db =>
  db.define('challenge', {
    challengeText: {
      type: STRING
    }
  })

module.exports.associations = (Challenge, { User, UserChallenge, Recommendation, Place }) => {
  Challenge.hasMany(Recommendation)
  Challenge.hasOne(Recommendation, { as: 'originalRecommendation' })
  Challenge.belongsTo(Place)
  Challenge.belongsToMany(User, { through: UserChallenge })
}
