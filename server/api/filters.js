//filters for admin routes

const mustBeLoggedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send('You must be logged in')
  }
  next()
}

const mustBeAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(401).send('What you doing yo? You must be an admin!')
  }
  next()
}

const selfOrAdmin = (req, res, next) => {
  if (req.params.id !== req.user.id || !req.user.isAdmin) {
    return res.status(403).send(`You can only do this for yourself or as an admin.`)
  }
}

const selfOrAdminPost = (req, res, next) => {
  if (req.post.userId !== req.user.id || !req.user.isAdmin) {
    return res.status(403).send(`You can only do this for yourself or as an admin.`)
  }
}

const selfOrAdminChallenge = (req, res, next) => {
  if (req.challenge.userId !== req.user.id || !req.user.isAdmin) {
    return res.status(403).send(`You can only do this for yourself or as an admin.`)
  }
}

const forbidden = message => (req, res, next) => {
  res.status(403).send(message)
}

module.exports = {
  mustBeLoggedIn,
  mustBeAdmin,
  forbidden,
  selfOrAdmin,
  selfOrAdminPost,
  selfOrAdminChallenge
}
