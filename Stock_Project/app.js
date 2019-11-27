var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;
const User = require('./createPassAuth/userModel/user_model');
const Stock = require('./createPassAuth/userModel/user_model');
//all the routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const oauthRouter = require('./createPassAuth/auth_route');
const passSetUp = require('./createPassAuth/googlePassSetup');
const checkStock = require('stock-ticker-symbol');
//connect to = User database
mongoose.connect('mongodb://localhost:27017/User', {useNewUrlParser:true, useUnifiedTopology:true});

//create cookies only for people who use google Account
var app = express();
app.use(cookieSession({
  maxAge: 24*60*60*1000,
  keys:['abcd']
}));
/*
const Schema = mongoose.Schema;

const stockSchema = new Schema({
  stock: String,
  prices: Number,
  quantity: Number
});
*/

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

function findStock(co, stockSymbol){
    function isStock(stock){
      return stock.stock === stockSymbol;
    };
  return co.findIndex(isStock);
}

app.post('/submit',function(req, res){
  const stockSymbol = req.body.symbol;

  const co= req.user.CompanyBought;
  const index = findStock(co, stockSymbol);
  if(index !==-1){
  const stockPrice = req.body.price;
  const stockAmount =req.body.amount;
    if(Number(stockPrice) !==0 && Number(stockAmount) !==0 && isNaN(stockPrice)!==true && isNaN(stockAmount)!==true){
      var priceAdjusted = ((Number(stockAmount)*Number(stockPrice)) + (req.user.CompanyBought[index].quantity + req.user.CompanyBought[index].prices))/(Number(stockAmount) + req.user.CompanyBought[index].quantity);
      var amountAdjusted = Number(stockAmount) + req.user.CompanyBought[index].quantity;
    //    console.log(Number(stockAmount));
    //    console.log(req.user.CompanyBought[indexed].prices)
      //updating the stock
      co[index].prices = co[index].prices + priceAdjusted;
      co[index].quantity = Number(amountAdjusted);
      //Update the stock portfolio
      User.findById(req.user.id, function(err,foundUser){
        if(err){
          console.log(err);
        }
        else{
          if(foundUser){
            foundUser.CompanyBought = co;
            foundUser.save();
            res.redirect('/stockView');
          }
        }
      });
    }
    else{
      console.log('Number error');
      res.redirect('/stockView');
    }
  }
  else{
  if(checkStock.lookup(stockSymbol) !==null){
    const stockPrice = req.body.price;
    const stockAmount = req.body.amount;
    if(Number(stockPrice) !==0 && Number(stockAmount) !==0 && isNaN(stockPrice)!==true && isNaN(stockAmount)!==true)
    {
        var StockInfo = {stock:stockSymbol, prices:stockPrice, quantity: stockAmount};
          co.push(StockInfo);
          User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser){
                foundUser.CompanyBought = co;
                foundUser.save();
                res.redirect('/stockView');
              }
            }
          });
    }
    else{
      console.log('One of the field is empty or not a number');
      res.redirect('/stockView');
    }
  }
  else{
    console.log('Stock has not found!!!');
    res.redirect('/stockView');
  }
}
/*
  function isStock(stock){
    return stock.stock === stockSymbol;
  };
  const index = co.findIndex(isStock);
*/

});
app.post('/del', function(req, res){
  const stockSymbol = req.body.symbol;
  const stockHolder = req.user.CompanyBought;
  const inde = findStock(stockHolder, stockSymbol);
  if(inde===-1){
    console.log('Stock not existed in your profile!!!')
    res.redirect('/stockView');
  }
  else{
    if (isNaN(req.body.amount)!==true)
    {
      stockHolder[inde].quantity = stockHolder[inde].quantity - req.body.amount;
      if(stockHolder[inde].quantity<=0){
        delete stockHolder[inde];
      }
    }

    User.findById(req.user.id, function(err,foundUser){
      if(err){
        console.log(err);
      }
      else{
        if(foundUser){
          foundUser.CompanyBought = stockHolder;
          foundUser.save();
          res.redirect('/stockView');
        }
      }
    });
  }
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
