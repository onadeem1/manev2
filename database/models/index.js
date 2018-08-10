const { mapValues } = require('lodash')

//use meta-model structure to help avoid cyclic dependencies
const metaModels = {
  User: require('./user'),
  Place: require('./place'),
  Post: require('./post'),
  Challenge: require('./challenge'),
  Friendship: require('./friendship'),
  Feed: require('./feed')
  // ----- Add new models here -----
}

const createModels = db => {
  //create the actual model classes by passing in the database to each metamodel
  const models = mapValues(metaModels, defineModel => defineModel(db))

  //create association classes - if an 'associations' method is exported pass in the defined models
  Object.keys(metaModels).forEach(name => {
    const { associations } = metaModels[name]
    if (typeof associations === 'function') {
      associations.call(metaModels[name], models[name], models)
    }
  })

  //allows us to use default scopes as function to use includes w/ models that haven't been defined yet
  Object.values(models).forEach(model => {
    const { options } = model
    if (typeof options.defaultScope === 'function') {
      model.addScope('defaultScope', model.options.defaultScope(), { override: true })
    }
  })

  return models
}

module.exports = createModels
