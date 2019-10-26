var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Fiancial Management Application' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Log Into Your Account' });
});

router.get('/newuser', function(req, res, next) {
  res.render('newuser', { title: 'Create Your Account' });
});

module.exports = router;
