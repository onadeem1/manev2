const sequelize = require('sequelize')

//TODO: Set limits, offsets etc for loading feed? will see in future

module.exports = db => {
  const Feed = db.define('feed', {})

  Feed.writeFeed = async function(user, postId) {
    const userIds = await user.getFriendAndUserIds()
    const writeFeed = userIds.map(userId => Feed.upsert({ userId, postId }, { returning: true }))
    return Promise.all(writeFeed)
  }

  Feed.loadFeed = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const feed = await user.getFeedPosts({
      scope: ['place', 'user', 'linkedPost'],
      include: [
        {
          model: db.model('challenge').scope('challengeCreator', {
            method: ['friends', 'allChallenges', false, ids, ['userId', 'original', 'complete']]
          }),
          required: false
        }
      ],
      order: [[sequelize.col('feed.updatedAt'), 'DESC']]
    })
    if (process.env.NODE_ENV === 'test') return feed
    //any way to limit this cause g is lame?
    return Promise.all(feed.map(post => post.addGoog()))
  }

  return Feed
}
