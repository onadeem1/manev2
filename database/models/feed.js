const sequelize = require('sequelize')
module.exports = db => {
  const Feed = db.define('feed', {})

  Feed.writeFeed = async function(user, recommendationId) {
    try {
      const userIds = await user.getFriendAndUserIds()
      const writeFeed = userIds.map(userId => {
        Feed.upsert({ userId: userId, recommendationId: recommendationId })
      })
      return Promise.all(writeFeed)
    } catch (error) {
      console.error(error)
    }
  }

  Feed.loadFeed = async function(user) {
    try {
      const feed = await user.getFeedItems({
        include: [
          {
            model: db.model('challenge'),
            include: [{ model: db.model('user'), as: 'challengeCreator' }]
          },
          db.model('user'),
          db.model('place')
        ],
        order: [[sequelize.col('feed.updatedAt'), 'DESC']]
      })
      const fullFeed = Promise.all(
        feed.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return fullFeed
    } catch (error) {
      console.error(error)
    }
  }

  return Feed
}
