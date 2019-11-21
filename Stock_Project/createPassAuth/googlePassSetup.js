const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./userModel/user_model')
//if new user then create googleUserSchema

passport.serializeUser((user, done)=>{
  done(null, user.id);
});

passport.deserializeUser((id, done)=>{
  User.findById(id).then((user)=>{
    done(null, user);
  })
});



//create new googleUser account
passport.use(
  new GoogleStrategy({
    // add security feature for future iteration
    callbackURL:'http://localhost:3000/auth/google/redirect',
    clientID:'755483568201-sidihf6p8d19or8iilcd6aadpfjueji9.apps.googleusercontent.com',
    clientSecret:'ljCEe4O55fKeD_0atNv117im'
  }, (accessToken, refreshToken, profile, done) =>{
    //check if user exists in database
    User.findOne({googleId:profile.id}).then((currentUser)=>{
      if(currentUser){
        console.log('user is: '+ currentUser);
        //avoid long time respond
        done(null, currentUser);
      } else{
        //if user is new then create account for them
          new User({
            userName:profile.displayName,
            googleId:profile.id
          }).save().then((newUser)=>{
            console.log('New user Created: '+ newUser);
            done(null,newUser);
          });
      }
    });
  })
)
