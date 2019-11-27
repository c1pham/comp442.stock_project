const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
const Schema = mongoose.Schema;
const LocalStrategy = require('passport-local').Strategy;
const User = require('./userModel/user_model')
//if new user then create googleUserSchema


passport.serializeUser((user, done)=>{
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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

//create new googleUser account
passport.use(
  new GoogleStrategy({
    // add security feature for future iteration
    callbackURL:'http://localhost:3000/auth/google/redirect',
    clientID:'755483568201-sidihf6p8d19or8iilcd6aadpfjueji9.apps.googleusercontent.com',
    clientSecret:'ljCEe4O55fKeD_0atNv117im'
  }, (accessToken, refreshToken, profile, done) =>{
    //check if user exists in database
    //console.log(profile.emails[0].value);
    User.findOne({googleId:profile.id}).then((currentUser)=>{
      if(currentUser){
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
