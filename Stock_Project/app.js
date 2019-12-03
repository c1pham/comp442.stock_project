require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;
const checkStock = require('stock-ticker-symbol');
const axios = require('axios');
const fetch = require('node-fetch');
const spawn = require('child_process').spawn;
//const Promise = require('promise');
//const stockData = require('stock-data.js');
//var session = require('express-session');
//var flash = require('express-flash-messages');
const User = require('./createPassAuth/userModel/user_model');
const Stock = require('./createPassAuth/userModel/user_model');
//all the routers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const oauthRouter = require('./createPassAuth/auth_route');
const passSetUp = require('./createPassAuth/googlePassSetup');

//connect to = User database
mongoose.connect('mongodb+srv://admin:'+process.env.PASSWORD+'@cluster0-rdxd6.mongodb.net/User', {useNewUrlParser:true, useUnifiedTopology:true});

//create cookies only for people who use google Account
var app = express();
app.use(cookieSession({
  maxAge: 24*60*60*1000,
  keys:['abcd']
}));

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

//all routing directories
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', oauthRouter);

// check whether the stock symbol is in the database.
//the function will return a number which is the index of the stock symbol in the database.
//if the stock is not in the database it will return -1
function findStock(co, stockSymbol){
    function isStock(stock){
      return stock.stock === stockSymbol;
    };
  return co.findIndex(isStock);
}

//this route handle the add stock function where it accepts three parameters: stockSymbol, stockPrice, StockAmount
app.post('/submit',function(req, res){
//from 64 to 71 is checking whether user have a real name attribute in the database.
//google user will not have the name because the google authentication function does not have the username attribute when calling.
  var user =""
  if (req.user.userName === undefined)
  {
    user = "User"
  }
  else{
    user = req.user.userName;
  }
//inititalize some variable
//co is an array that contains every stock that user has in the database
  const stockSymbol = req.body.symbol;
  const co= req.user.CompanyBought;
//check the stockSymbol is in the user stock porfolio
  const index = findStock(co, stockSymbol.toUpperCase());
  //If the stock is already in the stockPorfolio then do these commands
  if(index !==-1){
  const stockPrice = req.body.price;
  const stockAmount =req.body.amount;
  //check if the stockAmount and stockPrice are empty, are not in numberformat
    if(Number(stockPrice) !==0 && Number(stockAmount) !==0 && isNaN(stockPrice)!==true && isNaN(stockAmount)!==true){
      //check if the stockAmount is a whole number
      if(Number.isInteger(Number(stockAmount))===true){
        //check if the stockAmount and stockPrice are positive
        if(Number(stockAmount)>0 && Number(stockPrice)>0){
        var priceAdjusted = ((Number(stockAmount)*Number(stockPrice)) + (req.user.CompanyBought[index].quantity * req.user.CompanyBought[index].prices))/(Number(stockAmount) + req.user.CompanyBought[index].quantity);
        var amountAdjusted = Number(stockAmount) + req.user.CompanyBought[index].quantity;

        //updating the stock in local area
        co[index].prices = priceAdjusted;
        co[index].quantity = Number(amountAdjusted);

        //Update the stock portfolio in the database by find the user by Id and after that rewrite the stockArray.
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
        res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
      }
 }
  else{
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
    }
}
    else{
      //console.log('Number error');
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Some fields are missing or at least one field is not a number'});
    }
  }
  else{//if the user input new stock. Do all of these commands.
  //Checking the user stock symbols is the real stock Symbol on webpage.
  if(checkStock.lookup(stockSymbol) !==null){
    const stockPrice = req.body.price;
    const stockAmount = req.body.amount;
    //check if the stockAmount and stockPrice are empty, are not in numberformat
    if(Number(stockPrice) !==0 && Number(stockAmount) !==0 && isNaN(stockPrice)!==true && isNaN(stockAmount)!==true)
    {
        //check if the stockAmount is a whole number
      if(Number.isInteger(Number(stockAmount))===true){
        //check if the stockAmount and stockPrice are positive
      if(Number(stockAmount)>0 && Number(stockPrice)>0){
        var StockInfo = {stock:stockSymbol.toUpperCase(), prices:stockPrice, quantity: stockAmount, percentInterest:0};
          co.push(StockInfo);
          //Update the stock portfolio in the database by find the user by Id and after that rewrite the stockArray.
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
        }else{
            res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
        }
      }
      else{
        res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
      }
    }
    else{
      //console.log('One of the field is empty or not a number');
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Amount, price field is empty or not a number!!!!'});
    }
  }
  else{
    //console.log('Stock has not found!!!');
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock has not found!!!'});
  }
}
});


app.post('/del', function(req, res){

  var user =""
  if (req.user.userName === undefined)
  {
    user = "User"
  }
  else{
    user = req.user.userName;
  }
  const stockSymbol = req.body.symbol;
  const stockHolder = req.user.CompanyBought;
  const inde = findStock(stockHolder, stockSymbol.toUpperCase());
  if(inde===-1){
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock not existed in your profile!!!'});
  }
  else{
    if(req.body.amount!="")
    {
    if (isNaN(req.body.amount)!==true)
    {
      if(Number.isInteger(Number(req.body.amount))===true){
      if(Number(req.body.amount)>=0){
        stockHolder[inde].quantity = stockHolder[inde].quantity - req.body.amount;
        if(stockHolder[inde].quantity<=0){
          delete stockHolder[inde];
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
      else{
          res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
      }
    }else{
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
    }
    }
    else{
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'The amount remove is not a number'});
    }
  }else{
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'The amount remove field is empty!!'});
  }
}
});


app.post('/update', function(req,res){
    var user =""
    if (req.user.userName === undefined)
    {
      user = "User"
    }
    else{
      user = req.user.userName;
    }
    var stockHolder = req.user.CompanyBought;
    if(stockHolder==""){
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Sorry '+' . You do not have any stock to update!!'});
    }
    else{
      var stockS = [];
      for(iter = 0; iter<stockHolder.length;++iter){
        stockS.push(stockHolder[iter].stock);
      }
      var mess='';
      var obj=[];
      var process = spawn('python',['./test.py', stockS]);
      process.stdout.on('data', function(data){
        mess +=data.toString();
      });
      process.stdout.on('end', function(){
        var str = mess
        str = mess.slice(1,-3);
        str = str.split(',');
        for (iter = 0; iter<stockHolder.length;++iter){
          var prices = stockHolder[iter].prices;
          var stock = stockHolder[iter].stock;
          var quantity = stockHolder[iter].quantity;
          var percentInterest = ((parseFloat(str[iter])/prices)-1)*100;
          var abj = {stock:stock, prices:prices, quantity:quantity, percentInterest:percentInterest};
          obj.push(abj);
        }
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser)
                foundUser.CompanyBought=obj;
                foundUser.save();
                res.redirect('/stockView');
              }
          });
      });

      /*
      for(iter = 0; iter<stockHolder.length;++iter){
        var prices = stockHolder[iter].prices;
        var stock = stockHolder[iter].stock;
        var quantity = stockHolder[iter].quantity;
        console.log(prices);
        console.log(stock);
        console.log(quantity+'asd');
        var a = data[iter].then(function(result){
            return await (((prices-result['price'])/result['price'])*100);
          });
          console.log(a);
          /*
          var obj = {stock:stock, prices:prices, quantity:quantity, percentInterest:percentInterest};
          stockHolder[iter]=obj;

      }
      */
      //console.log(stockHolder);
      /*
      for(iter = 0; iter<stockHolder.length;++iter){
      if ((iter+1%5)===0){
        symbol = symbol + stockHolder[iter].stock;
        request('https://api.worldtradingdata.com/api/v1/stock?symbol='+symbol+'&api_token='+process.env.API, {json:true}, function(err,body){
          if(err){return console.log(err);}
          //console.log(body.body.data);
          var updateStock = []
          for(iter = 0; iter<5;++iter){
            var percentInterest = (((stockHolder[iter].prices-body.body.data[iter]['price'])/body.body.data[iter]['price'])*100);
            var obj = {stock:stockHolder[iter].stock, prices:stockHolder[iter].prices, quantity:stockHolder[iter].quantity, percentInterest:percentInterest};
            updateStock.push(obj);
          }
          User.findById(req.user.id, function(err,foundUser){
              if(err){
                console.log(err);
              }
              else{
                if(foundUser)
                  foundUser.CompanyBought= updateStock;
                  foundUser.save();
                }
            });
          });
        symbol = '';
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser)
                foundUser.CompanyBought.forEach(element=>data.push(element));
                console.log(data);
              }
          });
      }
      else if(iter === (stockHolder.length-1)){
        symbol = symbol + stockHolder[iter].stock;
        request('https://api.worldtradingdata.com/api/v1/stock?symbol='+symbol+'&api_token='+process.env.API, {json:true}, function(err,body){
          if(err){return console.log(err);}
          //console.log(body.body.data);
          var updateStock = []
          for(iter = 0; iter<data.length;++iter){
            var percentInterest = (((stockHolder[iter].prices-body.body.data[iter]['price'])/body.body.data[iter]['price'])*100);
            var obj = {stock:stockHolder[iter].stock, prices:stockHolder[iter].prices, quantity:stockHolder[iter].quantity, percentInterest:percentInterest};
            updateStock.push(obj);
          }
          User.findById(req.user.id, function(err,foundUser){
              if(err){
                console.log(err);
              }
              else{
                if(foundUser)
                  foundUser.CompanyBought= updateStock;
                  foundUser.save();
                }
            });
          });
        symbol = '';
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser)
                foundUser.CompanyBought.forEach(element=>data.push(element));
                console.log(data);
              }
          });
      }
      else{
        symbol = symbol + stockHolder[iter].stock +',';
      }
      User.findById(req.user.id, function(err,foundUser){
          if(err){
            console.log(err);
          }
          else{
            if(foundUser)
              foundUser.CompanyBought= data;
              foundUser.save();
              res.redirect('/stockView');
            }
        })
        /*
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser)
                foundUser.CompanyBought= stockHolder;
                foundUser.save();
                res.redirect('/stockView');
              }
          });
      });
      */

/*
      request('https://api.worldtradingdata.com/api/v1/stock?symbol='+symbol+'&api_token='+process.env.API, {json:true}, function(err,body){
        if(err){return console.log(err);}
        //console.log(body.body.data);
        data = body.body.data;
        for(iter = 0; iter<stockHolder.length;++iter){

      //    console.log('https://api.worldtradingdata.com/api/v1/stock?symbol='+symbol+'&api_token='+process.env.API);
        //  console.log(body.body.data);
        }

          var percentInterest = (((stockHolder[iter].prices-body.body.data[iter]['price'])/body.body.data[iter]['price'])*100);
          var obj = {stock:stockHolder[iter].stock, prices:stockHolder[iter].prices, quantity:stockHolder[iter].quantity, percentInterest:percentInterest};
          stockHolder[iter] = obj;
        }
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
              if(foundUser)
                foundUser.CompanyBought= stockHolder;
                foundUser.save();
                res.redirect('/stockView');
              }
          });

      });*/
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
