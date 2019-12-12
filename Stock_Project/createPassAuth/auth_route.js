//initialize router
const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./userModel/user_model');

//add googleUser logout
router.get('/logout', (req,res)=>{
  req.logout();
  res.redirect('/');
});

//get googleUser information
router.get('/google',passport.authenticate('google',{
  scope: ['email']
}));

//reditect user to stockView page or their stock portfolio
router.get('/google/redirect', passport.authenticate('google'),(req, res)=>{
  res.redirect('/stockView');
});

//redirect user to login page
router.get('/fail', (req, res)=>{
  res.render('login', {title: 'Log Into Your Account', error:'Account has not registered or Wrong Password'});
});

router.post('/loging', passport.authenticate('local',{successRedirect:'/stockView', failureRedirect:'/auth/fail'}));

//local user register account
router.post('/register', function(req,res){

//initializing some attribute from the user
  var rePass = req.body.rePass;
  var accountName = req.body.accountName;
  var userName = req.body.firstName +" "+req.body.lastName;
  var password = req.body.password;
  var email = req.body.email;
console.log(email);

//Checking password function
      function checkPass(passport, rePass) {
          var pass1 = password; // access html object with password ID # means ID
          var pass2 = rePass;
          var isTrue = true;
          // this searches the string to find if there are spaces in the password
          var pos = pass1.search(/ /);
          if (pos !== -1) {
            res.render('newuser',{ title: 'Create Your Account' ,error:'<br>No spaces allowed in password.'});
            isTrue = false;
          }
          // this searches the string to see if there is a number in the password
          var pos2 = pass1.search(/\d/);
          if (pos2 == -1) {
            isTrue = false;
              res.render('newuser',{ title: 'Create Your Account' , error:'<br>You need atleast one number in password.'});
          }

          // this checks if any of the password fields are empty or if they do not match
          if(pass1=="" || pass2=="") {
              isTrue = false;
              res.render('newuser',{ title: 'Create Your Account' , error:'<br>Type in both password.'});
          } else if (pass1!== pass2) {
            isTrue = false;
            res.render('newuser',{ title: 'Create Your Account' , error:'<br>The passwords you type do not match.'});
          }
          return isTrue;
      }
  function emailIsValid (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
if(emailIsValid(email)){
  if(checkPass(password, rePass))
  {
  User.find({$or:[
    {email: email}
  ]}, function(err, docs){
    if(docs.length!=0){
      if(docs[0].email == email){
        res.render('newuser',{ title: 'Create Your Account' , error:'Email Already exist'});
      }
    }
    else{
      let newUser = new User({userName:userName, accountName: accountName, email: email});
      User.register(newUser, password, (error, user)=>{
          res.render('login',{title:'Log Into Your Account', success:'Account has been created. Please login to use!'});
        });
//in case new local strategy does not working use this code(enables this code and commented the code from 74 to 77). If LocalStrategy is working do not enables the code.
      /*
      new User({
        userName:userName,
        accountName: accountName,
        password: password,
        email: email
      }).save().then((newUser)=>{
        console.log('New user Created: '+ newUser);
        res.render('login',{title:'Log Into Your Account', success:'Account has been created. Please login to use!'});
      });
*/
    }
  })
  }
} else{
    res.render('newuser',{ title: 'Create Your Account' , error:'<br>This email is not legit!'});
}

});

module.exports = router;
