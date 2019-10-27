var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  /* index in render brings up index.hbs and title is the variable passed to index.hbs */
  res.render('index', { title: 'Stock Tracker Application' });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  /* login in render brings up login.hbs and title is the variable passed to login.hbs */
  res.render('login', { title: 'Log Into Your Account' });
});

/* GET create new account page. */
router.get('/newuser', function(req, res, next) {
  /* newuser in render brings up newuser.hbs and title is the variable passed to newuser.hbs */
  res.render('newuser', { title: 'Create Your Account' });
});

module.exports = router;
