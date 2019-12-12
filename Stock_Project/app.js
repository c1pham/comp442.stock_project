require('dotenv').config();
//initialize all packages need to make the website works
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
//initialize package for calling python script
const spawn = require('child_process').spawn;

//running User script and Stock information before using the route
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
        //algorithm for adjusting price and amount
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
        //display error message if user put negative number in Stock Amount box in adding stock information function
        res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
      }
 }
  else{
      //display error message if user put float number in Stock Amount box in adding stock information function
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
    }
}
    else{
      //display error message if user submit an empty field or not a number format in any kinds of stock
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Some fields are missing or at least one field is not a number'});
    }
  }
  else{
  //if the user input new stock. Do all of these commands.
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
            //display message to user if they input negative number in anykind of boxes in adding stock function!!
            res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
        }
      }
      else{
        //display message to user if they input wrong number format in Stock Amount!!
        res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
      }
    }
    else{
      //display message to user if user input wrong numbers or put empty field in amount, price field in adding stock function
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Amount, price field is empty or not a number!!!!'});
    }
  }
  else{
    //display message to user if the stock ticker or stock name is not existed
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock has not found!!!'});
  }
}
});

//Deleting route
app.post('/del', function(req, res){
  //getting user name from Database to print on the page
  var user =""
  if (req.user.userName === undefined)
  {
    user = "User"
  }
  else{
    user = req.user.userName;
  }
  //getting stock information to delete
  const stockSymbol = req.body.symbol;
  const stockHolder = req.user.CompanyBought;
  //find whether the stock name that user put in is in the stockArray
  const inde = findStock(stockHolder, stockSymbol.toUpperCase());

  //if the inde equals to -1 which means that there is no stock in the stockArray
  if(inde===-1){
    //display error message that Stock is not existed in the user profile.
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock not existed in your profile!!!'});
  }
  else{
    //check if the box amount in delete stock function is empty.
    if(req.body.amount!="")
    {
    //check if the input amount is a Number.
    if (isNaN(req.body.amount)!==true)
    {
      //check if the input amount is in an integer form.
      if(Number.isInteger(Number(req.body.amount))===true){
      //check if the input amount is positive
      if(Number(req.body.amount)>=0){
        stockHolder[inde].quantity = stockHolder[inde].quantity - req.body.amount;
        if(stockHolder[inde].quantity<=0){
          delete stockHolder[inde];
        }
        //save the new stock amount to the user
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
        //display error message if user put negative number in amount box
          res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Cannot input negative numbers!!!'});
      }
    }else{
      //display error message if user put float number in the amount box
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'Stock Amount must be integer'});
    }
    }
    else{
      //display error message if user put something not an integer number
      res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'The amount remove is not a number'});
    }
  }else{
    //display error message the amount field is empty
    res.render('stockView',{User:user, rows: req.user.CompanyBought, title: 'Your stock portfolio', error:'The amount remove field is empty!!'});
  }
}
});

//Updating stock route
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
      //getting all of the stock that user has in order to update.
      var stockS = [];
      for(iter = 0; iter<stockHolder.length;++iter){
        stockS.push(stockHolder[iter].stock);
        }
      //initialize all of the needed varibles
      var mess='';
      var obj=[];

      //calling python script to get the real-time stock price
      var process = spawn('python', ["./test.py", stockS]);

      //retrieving data from the python script
      process.stdout.on('data', function (data) {
          mess += data.toString();
      });

      //processing the retrieve data
      process.stdout.on('end', function(){
        //put mess (mess is a string data type) which hold every real-time stock prices to varible name str
          var str = mess
          //mess format is like ['123',' 1233', ' 3221'] to eleminate []
          str = mess.slice(1, -3);
          //split string element into individual array of items like this ['123',' 1233', ' 3221'] this is an array type not string type like previous line
          str = str.split(',');

          //looping over each item to update the percentage change
          for (iter = 0; iter < stockHolder.length; ++iter){
          var prices = stockHolder[iter].prices;
          var stock = stockHolder[iter].stock;
          var quantity = stockHolder[iter].quantity;
            // please look at the format in 289
              if (iter === 0) {
                  var percentInterest = ((parseFloat(str[iter].slice(1, -1)) / prices) - 1) * 100;
              }
              else {
                  var percentInterest = ((parseFloat(str[iter].slice(2, -1)) / prices) - 1) * 100;
              }
          //initialize stock obj that has 4 attributes
          var abj = {stock:stock, prices:prices, quantity:quantity, percentInterest:percentInterest};
          obj.push(abj);
        }
        //save all of the update stock in database
        User.findById(req.user.id, function(err,foundUser){
            if(err){
              console.log(err);
            }
            else{
                if (foundUser)

                foundUser.CompanyBought=obj;
                foundUser.save();
                res.redirect('/stockView');
              }
          });
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
