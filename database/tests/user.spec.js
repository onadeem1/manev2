const { expect } = require('chai')
const { User, Friendship, Challenge, Post } = require('../index')
const db = require('../index')

describe('User model', () => {
  beforeEach(() => {
    return db.sync({ force: true })
  })

  let omer, zain, zoby, erum, maryam, danish, ayesha

  beforeEach('add users for testing', async () => {
    ;[omer, zain, zoby, erum, maryam, danish, ayesha] = await Promise.all([
      User.create({
        email: 'omer@manes.com',
        password: 'manebook'
      }),
      User.create({
        email: 'zain@manes.com',
        password: 'manebookmap'
      }),
      User.create({
        email: 'zoby@manes.com',
        password: 'manebookdrake'
      }),
      User.create({
        email: 'erumx3@manes.com',
        password: 'erumbook'
      }),
      User.create({
        email: 'maryamx3@manes.com',
        password: 'maryambook'
      }),
      User.create({
        email: 'danishx3@manes.com',
        password: 'danishbook'
      }),
      User.create({
        email: 'ayesha@manes.com',
        password: 'ayeshabook'
      })
    ])
  })

  describe('encryption & password tests', () => {
    describe('correct password method', () => {
      it('returns true if the password is correct', () => {
        expect(omer.correctPassword('manebook')).to.be.equal(true)
      })
      it('returns false if the password is incorrect', () => {
        expect(omer.correctPassword('notmanebook')).to.be.equal(false)
      })
    })
  })

  describe('friends related methods', () => {
    beforeEach(async () => {
      await Friendship.bulkCreate([
        {
          //friends
          userId: omer.id,
          friendId: zain.id,
          accepted: true,
          originalRequest: false
        },
        {
          //friends
          userId: omer.id,
          friendId: maryam.id,
          accepted: true,
          originalRequest: false
        },
        {
          //friend request sent from omer to zoby
          userId: omer.id,
          friendId: zoby.id,
          accepted: false,
          originalRequest: true
        },
        {
          //friend request recieved by omer from erum
          userId: omer.id,
          friendId: erum.id,
          accepted: false,
          originalRequest: false
        },
        {
          //friend request recieved by omer from erum
          userId: erum.id,
          friendId: omer.id,
          accepted: false,
          originalRequest: true
        },
        {
          //friend request received by omer from danish
          userId: omer.id,
          friendId: danish.id,
          accepted: false,
          originalRequest: false
        }
      ])
    })
    describe('getFriendIds method', () => {
      it('returns only the users accepted friend ids', async () => {
        const friendIds = await omer.getFriendIds()
        expect(friendIds.length).to.equal(2)
        expect(friendIds).to.have.members([maryam.id, zain.id])
        expect(friendIds).to.not.include(zoby.id)
      })
    })
    describe('allFriends method', () => {
      it('returns only the users accepted friends', async () => {
        const friends = await omer.allFriends()
        const emails = friends.map(user => user.email)
        expect(emails).to.have.members([maryam.email, zain.email])
        expect(emails).to.not.include(zoby.email)
      })
    })
    describe('friendRequests method', () => {
      it('returns users who sent requests to the user', async () => {
        const friendRequests = await omer.friendRequests()
        const emails = friendRequests.map(user => user.email)
        expect(emails).to.have.members([erum.email, danish.email])
      })
    })
    describe('friendsRequested method', () => {
      it('returns users who were sent friend requests by user', async () => {
        const friendsRequested = await omer.friendsRequested()
        const emails = friendsRequested.map(user => user.email)
        expect(emails).to.have.members([zoby.email])
      })
    })
    describe('requestFriend method', () => {
      it('sends a friend request to the specified user', async () => {
        const friendRequest = await omer.requestFriend(ayesha.id)
        expect(friendRequest[0].userId).to.equal(omer.id)
        expect(friendRequest[0].friendId).to.equal(ayesha.id)
        expect(friendRequest[0].accepted).to.equal(false)
        expect(friendRequest[0].originalRequest).to.equal(true)
      })
      it('adds the user to the friendsRequested list', async () => {
        await omer.requestFriend(ayesha.id)
        const friendsRequested = await omer.friendsRequested()
        const emails = friendsRequested.map(user => user.email)
        expect(emails).to.include(ayesha.email)
      })
    })
    describe('confirmFriend method', () => {
      it('confirms friend & adds user to list of friends', async () => {
        const friendship = await omer.confirmFriend(erum.id)
        expect(friendship[0].userId).to.equal(omer.id)
        expect(friendship[0].friendId).to.equal(erum.id)
        expect(friendship[0].accepted).to.equal(true)
      })
      it('adds the user to all friends', async () => {
        await omer.confirmFriend(erum.id)
        const allFriends = await omer.allFriends()
        const emails = allFriends.map(user => user.email)
        expect(emails).to.include(erum.email)
      })
    })
    describe('deleteFriend method', () => {
      it('deletes a friend successfully', async () => {
        const allFriends = await omer.allFriends()
        const emails = allFriends.map(user => user.email)
        expect(emails).to.include(zain.email)
        await omer.deleteFriend(zain.id)
        const allFriendsUpdate = await omer.allFriends()
        const emailsUpdate = allFriendsUpdate.map(user => user.email)
        expect(emailsUpdate).to.not.include(zain.email)
      })
    })
  })

  describe('user challenge methods & full User Info', () => {
    let pizza, bball, coffee
    let pizzaCreated, coffeeCompleted, bballAccepted
    beforeEach(async () => {
      ;[pizza, bball, coffee] = await Promise.all([
        Challenge.create({
          challengeText: 'try the best pizza in town',
          challengeCreatorId: omer.id
        }),
        Challenge.create({
          challengeText: 'play basketball at the nicest park in the city',
          challengeCreatorId: maryam.id
        }),
        Challenge.create({
          challengeText: 'best coffee in hicksville',
          challengeCreatorId: erum.id
        })
      ])
      ;[pizzaCreated, coffeeCompleted, bballAccepted] = await Promise.all([
        Post.create({
          //created
          review: "best pizza i've had in NY",
          rating: 90,
          original: true,
          complete: true,
          challengeId: pizza.id,
          userId: omer.id
        }),
        Post.create({
          //complete
          review: 'this was amazing better than any city coffee',
          rating: 91,
          complete: true,
          challengeId: coffee.id,
          userId: omer.id
        }),
        Post.create({
          //accept
          challengeId: bball.id,
          userId: omer.id
        })
      ])
    })
    describe('completedChallenges method', () => {
      it('returns the user"s completed challenges with correct post', async () => {
        const completed = await omer.completedChallenges()
        const challengeIds = completed.map(post => post.challenge.id)
        const postIds = completed.map(post => post.id)
        expect(challengeIds).to.have.members([coffee.id])
        expect(postIds).to.have.members([coffeeCompleted.id])
        expect(postIds)
          .to.not.include(bballAccepted.id)
          .and.not.include(pizzaCreated.id)
      })
    })
    describe('createdChallenges method', () => {
      it('returns the user"s created challenges with correct post', async () => {
        const created = await omer.createdChallenges()
        const challengeIds = created.map(post => post.challenge.id)
        const postIds = created.map(post => post.id)
        expect(challengeIds).to.have.members([pizza.id])
        expect(postIds).to.have.members([pizzaCreated.id])
        expect(postIds)
          .to.not.include(bballAccepted.id)
          .and.not.include(coffeeCompleted.id)
      })
    })
    describe('acceptedChallenges method', () => {
      it('returns the user"s accepted challenges with correct post', async () => {
        const accepted = await omer.acceptedChallenges()
        const challengeIds = accepted.map(post => post.challenge.id)
        const postIds = accepted.map(post => post.id)
        expect(challengeIds).to.have.members([bball.id])
        expect(postIds).to.have.members([bballAccepted.id])
        expect(postIds)
          .to.not.include(coffeeCompleted.id)
          .and.not.include(pizzaCreated.id)
      })
    })
    describe('full User method', () => {
      it('returns the user w/ challenges split out on the object', async () => {
        const omerFull = await omer.fullUser()
        expect(omerFull).to.include.all.keys(
          'createdChallenges',
          'acceptedChallenges',
          'completedChallenges'
        )
      })
    })
  })
})
