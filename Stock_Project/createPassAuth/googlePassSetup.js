const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./userModel/user_model')

//Create local user account passport
passport.use(User.createStrategy());

//initialize serialize and deserialize function in passport in order to use authentication function for any kinds of strategy like: google or local
passport.serializeUser((user, done)=>{
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//old code for localstrategy authentication. In case the new localstrategy does not work there is another subtitution.
/*
passport.use(new LocalStrategy({
  usernameField:'email',
  passwordField:'password'
},
  function(email, password, done){
    User.findOne({
      email: email
    },function(err, user){
      if(err){
        return done(err);
      }
      if(!user){
        return done(null, false);
      }
      if(user.password !=password){
        return done(null, false);
      }
      return done(null, user);
    });
  }
));
*/

//if new user then create googleUserSchema
//create new googleUser account
passport.use(
  new GoogleStrategy({
  //callbackURL for redirecting the website to another router
  // callbackURL:'http://localhost:3000/auth/google/redirect',
  callbackURL:'https://sheltered-brook-85631.herokuapp.com/auth/google/redirect',
    clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET
  }, (accessToken, refreshToken, profile, done) =>{

    //check if user exists in database
    User.findOne({googleId:profile.id}).then((currentUser)=>{
      if(currentUser){//if currentUser is in database
        console.log('user is: '+ currentUser);
        //avoid long time respond
        done(null, currentUser);
      } else{
        //if user is new then create account for them
          new User({
            userName: profile.displayName,
            email:profile.emails[0].value,
            googleId:profile.id
          }).save().then((newUser)=>{
            console.log('New user Created: '+ newUser);
            done(null,newUser);
          });
      }
    });
  })
)
