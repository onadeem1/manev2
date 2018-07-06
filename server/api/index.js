const router = require('express').Router();

router.get('/', (req, res, next) => {
  console.log('require out the routers!')
});

module.exports = router;
