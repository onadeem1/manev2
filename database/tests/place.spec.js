require('../../secrets') //is this ok? :)
const { expect } = require('chai')
const { Place, User, Friendship, Challenge, Post } = require('../index')
const db = require('../index')

describe('Place model', () => {
  beforeEach(() => {
    return db.sync({ force: true })
  })

  let pizzaPlace, coffeePlace, brunchPlace, omer

  beforeEach('add places (and a user) for testing', async () => {
    ;[pizzaPlace, coffeePlace, brunchPlace] = await Promise.all([
      Place.create({
        googleId: 'ChIJk6AC-aKBwokRObblm9-hwQ4'
      }),
      Place.create({
        googleId: 'ChIJeUkYJLZZwokRXjRpY77HTmg'
      }),
      Place.create({
        googleId: 'ChIJP_rMqXko6IkRBdEw9BhYXyQ'
      })
    ])
    omer = await User.create({ email: 'omer@manez.com' })
  })

  describe('google places instance methods', () => {
    describe('getGooglePlaceInfo method', () => {
      it('returns a google place object with necessary keys', async () => {
        const googPlaceInfo = await pizzaPlace.getGooglePlaceInfo()
        expect(googPlaceInfo).to.include.all.keys(
          'name',
          'place_id',
          'geometry',
          'formatted_address'
        )
      })
    })
    describe('addGoog method', () => {
      it('adds the google info to our sql db object', async () => {
        const fullPlace = await coffeePlace.addGoog()
        expect(fullPlace).to.include.all.keys(
          'id',
          'name',
          'place_id',
          'geometry',
          'formatted_address'
        )
        expect(fullPlace.googleId).to.equal(fullPlace.place_id)
      })
    })
  })
  describe('class methods related to finding all places', () => {
    let maryam, zoby
    beforeEach(async () => {
      ;[zoby, maryam, erum] = await Promise.all([
        User.create({ email: 'zoby@zoby.com' }),
        User.create({ email: 'mimi@mimihouse.com' })
      ])

      await Friendship.create({ userId: omer.id, friendId: maryam.id, accepted: true })
      const challenge = await Challenge.create({ challengeText: 'random' })

      await Post.bulkCreate([
        {
          userId: maryam.id,
          review: 'cool place',
          rating: 88,
          challengeId: challenge.id,
          placeId: pizzaPlace.id,
          original: true,
          complete: true
        },
        {
          userId: maryam.id,
          review: 'maybe not so cool',
          rating: 75,
          challengeId: challenge.id,
          placeId: brunchPlace.id,
          complete: true
        },
        {
          userId: maryam.id,
          challengeId: challenge.id,
          placeId: coffeePlace.id,
          complete: false
        },
        {
          userId: zoby.id,
          review: 'fun times',
          rating: 95,
          challengeId: challenge.id,
          placeId: coffeePlace.id,
          original: true,
          complete: true
        },
        {
          userId: zoby.id,
          review: 'fun but not fun',
          rating: 65,
          challengeId: challenge.id,
          placeId: pizzaPlace.id,
          complete: true
        },
        {
          userId: zoby.id,
          challengeId: challenge.id,
          placeId: brunchPlace.id,
          complete: false
        }
      ])
    })
    describe('finding all places by different criteria', () => {
      describe('allPlaces class method', () => {
        it('returns all places w/ an all property full of posts', async () => {
          const allPlaces = await Place.allPlaces()
          allPlaces.forEach(place => {
            expect(place).to.have.property('all')
          })
        })
      })
      describe('allPlacesSorted class method', () => {
        it('returns all places w/ sorted created/accepted/completed posts', async () => {
          const allPlaces = await Place.allPlacesSorted()
          allPlaces.forEach(place => {
            expect(place).to.include.all.keys(
              'createdChallenges',
              'completedChallenges',
              'acceptedChallenges'
            )
          })
        })
      })
      describe('allPlacesCreated class method', () => {
        it('returns all places w/ only created posts', async () => {
          const allPlaces = await Place.allPlacesCreated()
          allPlaces.forEach(place => {
            expect(place).to.include.all.keys('createdChallenges')
            expect(place).to.not.have.any.keys('acceptedChallenges', 'completedChallenges')
            place.createdChallenges.forEach(post => {
              expect(post.original).to.equal(true)
            })
          })
        })
      })
      describe('allPlacesAccepted class method', () => {
        it('returns all places w/ only accepted posts', async () => {
          const allPlaces = await Place.allPlacesAccepted()
          allPlaces.forEach(place => {
            expect(place).to.include.all.keys('acceptedChallenges')
            expect(place).to.not.have.any.keys('createdChallenges', 'completedChallenges')
            place.acceptedChallenges.forEach(post => {
              expect(post.complete).to.equal(false)
            })
          })
        })
      })
      describe('allPlacesCompleted class method', () => {
        it('returns all places w/ only completed posts', async () => {
          const allPlaces = await Place.allPlacesCompleted()
          allPlaces.forEach(place => {
            expect(place).to.include.all.keys('completedChallenges')
            expect(place).to.not.have.any.keys('createdChallenges', 'acceptedChallenges')
            place.completedChallenges.forEach(post => {
              expect(post.original).to.equal(false)
              expect(post.complete).to.equal(true)
            })
          })
        })
      })
    })
    describe('finding places w/ only friends info', () => {
      describe('friendsPlaces class method', () => {
        it('returns all places w/ an all property full of posts by friends', async () => {
          const friendsPlaces = await Place.friendsPlaces(omer)
          friendsPlaces.forEach(place => {
            expect(place).to.have.property('all')
            place.all.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
          })
        })
      })
      describe('friendsPlacesSorted class method', () => {
        it('returns all places that have a post by a friend sorted in created/accepted/completed challenges', async () => {
          const friendsPlacesSorted = await Place.friendsPlacesSorted(omer)
          friendsPlacesSorted.forEach(place => {
            expect(place).to.include.all.keys(
              'completedChallenges',
              'acceptedChallenges',
              'createdChallenges'
            )
            place.completedChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
            place.acceptedChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
            place.createdChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
          })
        })
      })
      describe('friendsCreated class method', () => {
        it('returns places with posts created by friends', async () => {
          const friendsPlaces = await Place.friendsCreated(omer)
          friendsPlaces.forEach(place => {
            expect(place).to.have.property('createdChallenges')
            place.createdChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
          })
        })
      })
      describe('friendsAccepted class method', () => {
        it('returns places with posts accepted by friends', async () => {
          const friendsPlaces = await Place.friendsAccepted(omer)
          friendsPlaces.forEach(place => {
            expect(place).to.have.property('acceptedChallenges')
            place.acceptedChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
          })
        })
      })
      describe('friendsCompleted class method', () => {
        it('returns places with posts completed by friends', async () => {
          const friendsPlaces = await Place.friendsCompleted(omer)
          friendsPlaces.forEach(place => {
            expect(place).to.have.property('completedChallenges')
            place.completedChallenges.forEach(post => {
              expect(post.userId).to.be.equal(maryam.id)
            })
          })
        })
      })
    })
    describe('single place class methods', () => {
      describe('fullPlace method', () => {
        it('returns a place with sorted challenge info', async () => {
          const place = await Place.fullPlace({ id: brunchPlace.id })
          expect(place).to.include.keys(
            'completedChallenges',
            'acceptedChallenges',
            'createdChallenges',
            'challenges'
          )
        })
      })
      describe('fullPlaceFriends method', () => {
        it('returns a place with sorted challenge info w/ only friends posts', async () => {
          const place = await Place.fullPlaceFriends(omer, { id: brunchPlace.id })
          expect(place).to.include.keys(
            'completedChallenges',
            'acceptedChallenges',
            'createdChallenges',
            'challenges'
          )
          place.completedChallenges.forEach(post => {
            expect(post.userId).to.equal(maryam.id)
          })
          place.acceptedChallenges.forEach(post => {
            expect(post.userId).to.equal(maryam.id)
          })
          place.createdChallenges.forEach(post => {
            expect(post.userId).to.equal(maryam.id)
          })
        })
      })
    })
  })
})
