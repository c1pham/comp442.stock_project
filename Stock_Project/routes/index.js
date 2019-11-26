var express = require('express');
var router = express.Router();
const mongodb = require('mongodb');
const passport = require('passport');

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

/* this will need to be changed, instead of passing through title we need to pass through rows from database table
  router.get('/books', function(req, response, next) {
    // client object enables issuing SQL queries
    db.collection('book').find().toArray(function(err, result){
        if (err) {
            next(err);
        }
        console.log(result);
        response.render('books',{rows: result});
        });
    });
    Explanation: Given if you have an table in mongodb database called book, you can  find nthis database
    make it into an array. We can send it through to this handlebars

    so where is says response.render('books',{rows: result});
    it would need to be changed to response.render('stockView',{rows: result});

*/

router.get('/stockView', function(req, res){
  if(req.isAuthenticated()){
    res.render('stockView',{rows: req.user.CompanyBought, title: 'Your stock portfolio' });
  }else{
    res.redirect('/');
  }
});

// this mean require multer, we may or may not need this feature
// multer helps upload files
// if user wants profile pic we can use multer to upload the profile
var multer = require('multer');
var upload = multer({dest: 'fileUpload'}); // this makes an directory named formUpload

router.post('/upload', upload.single('file_up'), function(req, res){
  var message = "";
  res.send(message)
});




module.exports = router;
