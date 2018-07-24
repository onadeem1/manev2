const db = require('./index')
const { User, Place, Recommendation, Challenge, UserChallenge, Friendship, Promise } = db
const { mapValues } = require('lodash')

//dummy data
const usersSeed = seed(User, {
  omer: {
    firstName: 'Omer',
    lastName: 'Nadeem',
    username: 'omeemyhomee786',
    email: 'omernadeem3@gmail.com',
    phone: 5166439641,
    picture:
      'https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/14702480_10105493007974789_2631904228540268496_n.jpg?_nc_cat=0&oh=599631b805576120fbdad8d594ff64d1&oe=5B9F2F52',
    isAdmin: true,
    recommendationsSaved: [1, 2, 3]
  },
  zain: {
    firstName: 'Zain',
    lastName: 'Nadeem',
    username: 'theflashdwade',
    email: 'zn.nadeem@gmail.com',
    phone: 5162442916,
    picture:
      'https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/311871_10150451916788453_1159216794_n.jpg?_nc_cat=0&oh=557633b552f64369fc715260fe3d030d&oe=5BD8AD0D',
    isAdmin: true,
    recommendationsSaved: [4, 5, 6]
  },
  zoby: {
    firstName: 'Zohayb',
    lastName: 'Shaikh',
    username: 'zobywankanobi',
    email: 'zohayb1996@gmail.com',
    phone: 5166030254,
    picture:
      'https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/10426308_1163424637002509_6120123193537198820_n.jpg?_nc_cat=0&oh=9fd2a5386e262fa44711eec94ff4a7ca&oe=5BD127C8',
    isAdmin: true,
    recommendationsSaved: [3, 5, 1]
  },
  danish: {
    firstName: 'Danish',
    lastName: 'Nadeem',
    username: 'dn3hbk',
    email: 'dnadeem3@gmail.com',
    phone: 5163766308,
    picture:
      'https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/25770_377372734835_2988176_n.jpg?_nc_cat=0&oh=9d81cd510df9ca585bd4e2066affdabb&oe=5BD0C7F6',
    isAdmin: false,
    recommendationsSaved: [1, 2, 5]
  },
  maryam: {
    firstName: 'Maryam',
    lastName: 'Nadeem',
    username: 'jadoreme',
    email: 'mnadeemxx@yahoo.com',
    phone: 5168847563,
    picture:
      'https://media.licdn.com/dms/image/C5603AQFU5dPN3Sj6cQ/profile-displayphoto-shrink_800_800/0?e=1536796800&v=beta&t=IATnUJlv_wKQRXlpKWhFBzW-zuETjRntuWRnFJBTl0I',
    isAdmin: false,
    recommendationsSaved: [6, 3]
  },
  erum: {
    firstName: 'Erum',
    lastName: 'Nadeem',
    username: 'erumx3',
    email: 'erumx3@gmail.com',
    phone: 5167284075,
    picture:
      'https://media.licdn.com/dms/image/C5603AQFU5dPN3Sj6cQ/profile-displayphoto-shrink_800_800/0?e=1536796800&v=beta&t=IATnUJlv_wKQRXlpKWhFBzW-zuETjRntuWRnFJBTl0I',
    isAdmin: false,
    recommendationsSaved: [6, 3]
  }
})

const placesSeed = seed(Place, {
  raimos: {
    googleId: 'ChIJk6AC-aKBwokRObblm9-hwQ43037',
    name: 'Raimos'
  },
  shakeShack: {
    googleId: 'ChIJ8z9-54GHwokRpf3Gukw8ufM',
    name: 'Shack Shack'
  },
  theShed: {
    googleId: 'ChIJP_rMqXko6IkRBdEw9BhYXyQ54',
    name: 'The Shed'
  },
  '205club': {
    googleId: 'ChIJne9SzYVZwokRGJ8wLdz9tos',
    name: '205 Club'
  },
  brooklynBridge: {
    googleId:
      'EihCcm9va2x5biBCcmlkZ2UsIE5ldyBZb3JrLCBOWSAxMDAzOCwgVVNBIkgqRgoUChIJlenDaDpawokRDB4kyfcPdxYSFAoSCamlI_HwS8xMEWeVGN7Bxs_dGhgKCg3PwUEYFdRR5dMSCg2F_EIYFbtc5tM',
    name: 'Brooklyn Bridge'
  },
  jetty: {
    googleId: 'ChIJH_nbjo9vwokRWod0pSkrh54',
    name: 'Jetty Bar & Grill'
  }
})

const challengesSeed = seed(Challenge, ({ places }) => ({
  /* Why we use a function as an argument in the seed function

    We're specifying a function here, rather than just a rows object.
    Using a function lets us receive the previously-seeded rows (the seed
    function does this wiring for us).

    This lets us reference previously-created rows in order to create the join
    rows. We can reference them by the names we used above (which is why we used
    Objects above, rather than just arrays).

    The easiest way to seed associations seems to be to just create rows
    in the join table.

    places.raimos is an instance of the places model that we created in the user seed above.
    The seed function wires the promises so that it'll have been created already. Same thing for things.
*/
  'grandma slice': {
    placeId: places.raimos.id,
    challengeText: 'try the grandma slice'
  },
  'chicken shack': {
    placeId: places.shakeShack.id,
    challengeText: 'the new chicken shack is better than the original!'
  },
  'old fashioned': {
    placeId: places.theShed.id,
    challengeText: 'old fashioned w/ brunch is the way to go'
  },
  'dance at the club': {
    placeId: places['205club'].id,
    challengeText: 'dance the night away to some underground hip hop'
  },
  'walk the bridge': {
    placeId: places.brooklynBridge.id,
    challengeText: 'see the most eclectic crowd in new york while you walk across the bridge'
  },
  jetty: {
    placeId: places.jetty.id,
    challengeText: 'hit then beach then have the best apps in LB'
  }
}))

const friendshipsSeed = seed(Friendship, ({ users }) => ({
  'omer-zain are friends': {
    userId: users.omer.id,
    friendId: users.zain.id,
    accepted: true
  },
  'zain-omer are friends': {
    userId: users.zain.id,
    friendId: users.omer.id,
    accepted: true,
    originalRequest: true
  },
  'zain-zoby are friends': {
    userId: users.zain.id,
    friendId: users.zoby.id,
    accepted: true
  },
  'zoby-zain are friends': {
    userId: users.zoby.id,
    friendId: users.zain.id,
    accepted: true,
    originalRequest: true
  },
  'omer-maryam are friends': {
    userId: users.omer.id,
    friendId: users.maryam.id,
    accepted: true,
    originalRequest: true
  },
  'maryam-omer are friends': {
    userId: users.maryam.id,
    friendId: users.omer.id,
    accepted: true
  },
  'omer-danish friend request': {
    userId: users.omer.id,
    friendId: users.danish.id,
    originalRequest: true
  },
  'danish-omer friend request': {
    userId: users.danish.id,
    friendId: users.omer.id
  },
  'maryam-zain are friends': {
    userId: users.maryam.id,
    friendId: users.zain.id,
    accepted: true
  },
  'zain-maryam are friends': {
    userId: users.zain.id,
    friendId: users.maryam.id,
    accepted: true
  },
  'maryam-danish friend request': {
    userId: users.maryam.id,
    friendId: users.danish.id,
    originalRequest: false
  },
  'danish-maryam friend request': {
    userId: users.danish.id,
    friendId: users.maryam.id
  },
  'omer-zoby friend request': {
    userId: users.omer.id,
    friendId: users.zoby.id
  },
  'zoby-omer friend request': {
    userId: users.zoby.id,
    friendId: users.omer.id,
    originalRequest: true
  },
  'zain-danish friend request': {
    userId: users.zain.id,
    friendId: users.danish.id,
    originalRequest: true
  },
  'danish-zain friend request': {
    userId: users.danish.id,
    friendId: users.zain.id
  }
}))

const recommendationsSeed = seed(Recommendation, ({ users, places, challenges }) => ({
  'raimos is amazing': {
    review: 'great setting, authentic italian vibe, food was delicious, must try the grandma',
    picture: 'https://c1.staticflickr.com/9/8189/8354014819_3f8fc8668f_b.jpg',
    rating: 93,
    userId: users.zoby.id,
    placeId: places.raimos.id,
    challengeId: challenges['grandma slice'].id
  },
  'shack shack is the goat': {
    review: 'still the best burger in new york but the chicken shack might be even better',
    picture: 'https://c1.staticflickr.com/9/8189/8354014819_3f8fc8668f_b.jpg',
    rating: 99,
    userId: users.omer.id,
    placeId: places.shakeShack.id,
    challengeId: challenges['chicken shack'].id
  },
  'the shed for brunch': {
    review:
      'love the classic farm to table feel, old fashioneds w/ great breakfast makes this my second fav brunch spot on LI ',
    picture:
      'https://cdn1.freshoffthegrid.com/wp-content/uploads/2016/05/Blackberry-Old-Fashioned-10.jpg',
    rating: 88,
    userId: users.maryam.id,
    placeId: places.theShed.id,
    challengeId: challenges['old fashioned'].id
  },
  'underground hip hop': {
    review:
      'best place for underground hip hop but gets super crowded would recommend if your looking for 90s nostalgia',
    picture: 'https://s3-media3.fl.yelpcdn.com/bphoto/1ryzI4DFtb83nGyaqCGI9Q/o.jpg',
    rating: 78,
    userId: users.omer.id,
    placeId: places['205club'].id,
    challengeId: challenges['dance at the club'].id
  },
  'brooklyn bridge walk': {
    review:
      "finally made the walk, i don't see what the fuss is all about, you do see some cool artists/weirdos but brooklyn is overrated",
    picture:
      'https://brokelyn.com/app/uploads/2017/05/the-vantage-point-636776-unsplash-640x427.jpg',
    rating: 68,
    userId: users.zain.id,
    placeId: places.brooklynBridge.id,
    challengeId: challenges['walk the bridge'].id
  },
  jetty: {
    review:
      "nothing beats a beach day followed by drinks & apps at jetty, best atmosphere in LB, dylan gives it a 77 but he's become picky",
    picture: 'http://jettylb.com/images/slide1.jpg',
    rating: 94,
    userId: users.danish.id,
    placeId: places.jetty.id,
    challengeId: challenges['jetty'].id
  }
}))

const userChallengesSeed = seed(UserChallenge, ({ users, challenges }) => ({
  'omer accepts zoby raimo challenge': {
    userId: users.omer.id,
    challengeId: challenges['grandma slice'].id
  },
  'omer accepts maryam shed challenge': {
    userId: users.omer.id,
    challengeId: challenges['old fashioned'].id
  },
  'omer completes zain brooklyn bridge challenge': {
    userId: users.omer.id,
    challengeId: challenges['walk the bridge'].id,
    rating: 88,
    review: 'loved it beautiful day, sorry zain I disagree brooklyn is awesome',
    complete: true
  },
  'zain completes zoby grandma slice challenge': {
    userId: users.zain.id,
    challengeId: challenges['grandma slice'].id,
    rating: 39,
    review: 'zoby this was awful what are you thinking',
    complete: true
  },
  'zain accepts omer club challenge': {
    userId: users.zain.id,
    challengeId: challenges['dance at the club'].id
  },
  'zoby completes omer club challenge': {
    userId: users.zoby.id,
    challengeId: challenges['dance at the club'].id,
    rating: 44,
    review: 'never heard any of these songs, why not just play Drake?',
    complete: true
  },
  'zoby completes zain brooklyn bridge challenge': {
    userId: users.zoby.id,
    challengeId: challenges['walk the bridge'].id,
    rating: 91,
    review: 'I agree with Omer this was super nice, a little rit made it quite nice',
    complete: true
  },
  'maryam completes omer club challenge': {
    userId: users.maryam.id,
    challengeId: challenges['dance at the club'].id,
    rating: 85,
    review:
      'OMG this was like hearing a TRL playlist, just wish there was room to break it down :)',
    complete: true
  },
  'maryam accepts zain brooklyn bridge challenge': {
    userId: users.maryam.id,
    challengeId: challenges['walk the bridge'].id
  }
}))

//seed function error handler
class BadRow extends Error {
  constructor(key, row, error) {
    super(error)
    this.cause = error
    this.row = row
    this.key = key
  }
  toString() {
    return `[${this.key}] ${this.cause} while creating ${JSON.stringify(this.row, 0, 2)}`
  }
}

/* Seed Function Info
    seed(Model: Sequelize.Model, rows: Function|Object) ->
    (others?: {...Function|Object}) -> Promise<Seeded>

    Takes a model and either an Object describing rows to insert,
    or a function that when called, returns rows to insert. returns
    a function that will seed the DB when called and resolve with
    a Promise of the object of all seeded rows.

    The function form can be used to initialize rows that reference
    other models.
*/
function seed(Model, rows) {
  return (others = {}) => {
    if (typeof rows === 'function') {
      rows = Promise.props(
        mapValues(
          others,
          (
            other // Is other a function? If so, call it. Otherwise, leave it alone.
          ) => (typeof other === 'function' ? other() : other)
        )
      ).then(rows)
    }

    return Promise.resolve(rows)
      .then(rows =>
        Promise.props(
          Object.keys(rows)
            .map(key => {
              const row = rows[key]
              return {
                key,
                value: Promise.props(row).then(row =>
                  Model.create(row).catch(error => {
                    throw new BadRow(key, row, error)
                  })
                )
              }
            })
            .reduce((all, one) => Object.assign({}, all, { [one.key]: one.value }), {})
        )
      )
      .then(seeded => {
        console.log(`Seeded ${Object.keys(seeded).length} ${Model.name} OK`)
        return seeded
      })
      .catch(error => {
        console.error(`Error seeding ${Model.name}: ${error} \n${error.stack}`)
      })
  }
}

function seedEverything() {
  const seeded = {}

  seeded.users = usersSeed()
  seeded.places = placesSeed()
  seeded.friendships = friendshipsSeed(seeded)
  seeded.challenges = challengesSeed(seeded)
  seeded.userChallenges = userChallengesSeed(seeded)
  seeded.recommendations = recommendationsSeed(seeded)

  return Promise.props(seeded)
}

if (module === require.main) {
  db
    .sync({ force: true })
    .then(seedEverything)
    .finally(() => process.exit(0))
}

// module.exports = Object.assign(seed, {users, places, challenges, friendships, recommendations, userChallenges});
module.exports = seedEverything
