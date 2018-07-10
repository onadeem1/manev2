const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('../database')

//initiating express application
const app = express();

//port environment variable used for deployment
const PORT = process.env.PORT || 3000

//logging middleware
app.use(morgan('dev'));

//bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// re-direct api routes
app.use('/api', require('./api'))

//Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || 'Internal Server Error')
});

app.get('/', (req, res, next) => {
  res.send('WHATUPPPPPP')
});

db.sync({force: true})
.then(() => {
  console.log('DATABASE IS READY TO GO!')
  app.listen(PORT, (err) => {
    if (err) throw err;
    console.log('Welcome to the Mane Revolution');
  });
})
.catch(console.error);
