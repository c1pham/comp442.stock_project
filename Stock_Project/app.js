var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const User = require('./createPassAuth/userModel/user_model');

//all the routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const oauthRouter = require('./createPassAuth/auth_route');
const passSetUp = require('./createPassAuth/googlePassSetup');

//connect to = User database
mongoose.connect('mongodb://localhost:27017/User', {useNewUrlParser:true, useUnifiedTopology:true});

//create cookies only for people who use google Account
var app = express();
app.use(cookieSession({
  maxAge: 24*60*60*1000,
  keys:['abcd']
}));

//initialize passport function for creating and validating googleAccount
app.use(passport.initialize());
app.use(passport.session());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//enable routing directory
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', oauthRouter);

app.post('/submit',function(req, res){
  const stockSymbol = req.body.symbol;
  const stockPrice = req.body.price;
  const stockAmount = req.body.amount;

  console.log(req.user);

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
