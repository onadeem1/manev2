const { expect } = require('chai')
const { Challenge, Post, User, Friendship } = require('../index')
const db = require('../index')

describe('Challenge Model', () => {
  beforeEach(() => {
    return db.sync({ force: true })
  })

  let mano, booma, e, dyli
  //update the following two lines if challenges added
  let manoChallenge, boomaChallenge, eChallenge
  let challengeArr = [manoChallenge, boomaChallenge, eChallenge]
  beforeEach('create challenges for testing', async () => {
    ;[mano, booma, e, dyli] = await Promise.all([
      User.create({ email: 'mano@dismano.com' }),
      User.create({ email: 'booma@boomahouse.com' }),
      User.create({ email: 'e@geemee.com' }),
      User.create({ email: 'dyli@lbmail.com' })
    ])
    ;[manoChallenge, boomaChallenge, eChallenge] = await Promise.all([
      Challenge.create({
        challengeText: 'try the molk at mano house',
        challengeCreatorId: mano.id
      }),
      Challenge.create({
        challengeText: 'go to the best park in town and play ball',
        challengeCreatorId: booma.id
      }),
      Challenge.create({
        challengeText: 'try the fresh food at the market',
        challengeCreatorId: e.id
      })
    ])
  })
  describe('Model creation test', () => {
    it('returns an error when creating challenge w/o text', async () => {
      try {
        await Challenge.create()
      } catch (error) {
        expect(error).to.be.an.instanceOf(Error)
        expect(error.errors[0].type).to.equal('notNull Violation')
      }
    })
    it('returns a challenge object when created with text', async () => {
      const test = await Challenge.create({ challengeText: 'this mano challenge' })
      expect(test).to.be.an('object')
    })
  })
  describe('class methods', () => {
    beforeEach('creating posts, users, friendships for tests', async () => {
      await Post.bulkCreate([
        {
          review: 'best molk',
          rating: 94,
          original: true,
          complete: true,
          challengeId: manoChallenge.id,
          userId: mano.id
        },
        {
          review: 'yah this is pretty good molk',
          rating: 81,
          complete: true,
          challengeId: manoChallenge.id,
          userId: booma.id
        },
        {
          complete: false,
          challengeId: manoChallenge.id,
          userId: booma.id
        },
        {
          review: 'its ok but i would recommend the goat',
          rating: 71,
          complete: true,
          challengeId: manoChallenge.id,
          userId: e.id
        },
        {
          complete: false,
          challengeId: manoChallenge.id,
          userId: dyli.id
        },
        {
          review: 'everything is fresh & authentic, fun to tour & try things',
          rating: 97,
          complete: true,
          original: true,
          challengeId: eChallenge.id,
          userId: e.id
        },
        {
          review: 'nice court by the water',
          rating: 92,
          original: true,
          complete: true,
          challengeId: boomaChallenge.id,
          userId: booma.id
        },
        {
          complete: false,
          challengeId: boomaChallenge.id,
          userId: e.id
        },
        {
          complete: false,
          challengeId: boomaChallenge.id,
          userId: mano.id
        }
      ])
    }) //create the posts & friendships same as before in places test
    describe('finding all challenges w/ correct post info', () => {
      describe('allChallenges', () => {
        it('returns all challenges with related posts on all property', async () => {
          const challenges = await Challenge.allChallenges()
          expect(challenges).to.be.lengthOf(challengeArr.length)
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('allChallenges')
            challenge.allChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
            })
          })
        })
      })
      describe('allChallengesSorted', () => {
        it('returns all challenges sorted by created/accepted/completed ', async () => {
          const challenges = await Challenge.allChallengesSorted()
          expect(challenges).to.be.lengthOf(challengeArr.length)
          challenges.forEach(challenge => {
            expect(challenge).to.include.keys(
              'completedChallenges',
              'acceptedChallenges',
              'createdChallenges'
            )
            challenge.completedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
            })
            challenge.createdChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
            })
            challenge.acceptedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
            })
          })
        })
      })
      describe('allChallengesCreated', () => {
        it('returns all challenges with created posts', async () => {
          const challenges = await Challenge.allChallengesCreated()
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('createdChallenges')
            challenge.createdChallenges.forEach(post => {
              expect(post.original).to.be.equal(true)
              expect(post.complete).to.be.equal(true)
            })
          })
        })
      })
      describe('allChallengesAccepted', () => {
        it('returns all challenges with accepted posts', async () => {
          const challenges = await Challenge.allChallengesAccepted()
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('acceptedChallenges')
            challenge.acceptedChallenges.forEach(post => {
              expect(post.original).to.be.equal(false)
              expect(post.complete).to.be.equal(false)
            })
          })
        })
      })
      describe('allChallengesCompleted', () => {
        it('returns all challenges with completed posts', async () => {
          const challenges = await Challenge.allChallengesCompleted()
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('completedChallenges')
            challenge.completedChallenges.forEach(post => {
              expect(post.original).to.be.equal(false)
              expect(post.complete).to.be.equal(true)
            })
          })
        })
      })
    })
    describe('finding all challenges w/ correct friends post info', () => {
      beforeEach('create a friendship for tests by friends', () => {
        Friendship.bulkCreate([
          { userId: mano.id, friendId: booma.id, accepted: true },
          { userId: booma.id, friendId: mano.id, accepted: true }
        ])
      })
      describe('friends method', () => {
        it('returns all challenges with only friends posts', async () => {
          const challenges = await Challenge.friends(mano)
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('allChallenges')
            challenge.allChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
            })
          })
        })
      })
      describe('friendsSorted method', () => {
        it('returns all challenges with only friends posts sorted by created/accepted/completed ', async () => {
          const challenges = await Challenge.friendsSorted(mano)
          challenges.forEach(challenge => {
            expect(challenge).to.include.keys(
              'createdChallenges',
              'acceptedChallenges',
              'completedChallenges'
            )
            challenge.createdChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.original).to.be.equal(true)
              expect(post.complete).to.be.equal(true)
            })
            challenge.acceptedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.original).to.be.equal(false)
              expect(post.complete).to.be.equal(false)
            })
            challenge.completedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.original).to.be.equal(false)
              expect(post.complete).to.be.equal(true)
            })
          })
        })
      })
      describe('friendsCreated method', () => {
        it('returns challenges that are created by friends', async () => {
          const challenges = await Challenge.friendsCreated(mano)
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('createdChallenges')
            challenge.createdChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.original).to.be.equal(true)
            })
          })
        })
      })
      describe('friendsAccepted method', () => {
        it('returns challenges that have been accepted by friends', async () => {
          const challenges = await Challenge.friendsAccepted(mano)
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('acceptedChallenges')
            challenge.acceptedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.complete).to.be.equal(false)
            })
          })
        })
      })
      describe('friendsCompleted method', () => {
        it('returns challenges that have been completed by friends', async () => {
          const challenges = await Challenge.friendsCompleted(mano)
          challenges.forEach(challenge => {
            expect(challenge).to.have.property('completedChallenges')
            challenge.completedChallenges.forEach(post => {
              expect(post.challengeId).to.equal(challenge.id)
              expect(post.userId).to.be.oneOf([mano.id, booma.id])
              expect(post.complete).to.be.equal(true)
            })
          })
        })
      })
    })
    describe('finding single challenge info', () => {
      describe('fullChallengeInfo', () => {
        it('finds single challenge with sorted info', async () => {
          const challenge = await Challenge.fullChallengeInfo(manoChallenge.id)
          expect(challenge).to.include.keys(
            'createdChallenges',
            'completedChallenges',
            'acceptedChallenges'
          )
          challenge.createdChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(true)
            expect(post.complete).to.be.equal(true)
          })
          challenge.acceptedChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(false)
            expect(post.complete).to.be.equal(false)
          })
          challenge.completedChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(false)
            expect(post.complete).to.be.equal(true)
          })
        })
      })
      describe('fullChallengeFriendsInfo', () => {
        beforeEach(async () => {
          await Friendship.bulkCreate([
            { userId: mano.id, friendId: booma.id, accepted: true },
            { userId: booma.id, friendId: mano.id, accepted: true }
          ])
        })
        it('finds single challenge with sorted friends info', async () => {
          const challenge = await Challenge.fullChallengeFriendsInfo(manoChallenge.id, mano)
          expect(challenge).to.include.keys(
            'createdChallenges',
            'completedChallenges',
            'acceptedChallenges'
          )
          challenge.createdChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(true)
            expect(post.complete).to.be.equal(true)
            expect(post.userId).to.be.equal(mano.id)
          })
          challenge.acceptedChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(false)
            expect(post.complete).to.be.equal(false)
            expect(post.userId).to.be.oneOf([mano.id, booma.id])
          })
          challenge.completedChallenges.forEach(post => {
            expect(post.challengeId).to.equal(challenge.id)
            expect(post.original).to.be.equal(false)
            expect(post.complete).to.be.equal(true)
            expect(post.userId).to.be.oneOf([mano.id, booma.id])
          })
        })
      })
    })
  })
})
