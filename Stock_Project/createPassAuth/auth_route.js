const router = require('express').Router();
const passport = require('passport');
const User = require('./userModel/user_model')
//add googleUser logout
router.get('/logout', (req,res)=>{
  req.logout();
  res.redirect('/');
});
//get googleUser information
router.get('/google',passport.authenticate('google',{
  scope: ['profile']
}));
//reditect user to stockView page or their stock portfolio
router.get('/google/redirect', passport.authenticate('google'),(req, res)=>{
  res.redirect('/stockView');
});

//local user login
router.post('/loging', function(req, res){
  var accountName = req.body.accountName;
  var password = req.body.password;
  User.findOne({accountName: accountName}, function(err, foundUser){
    if(err){
      console.log(err);
      res.redirect('/');
    } else {
      if (foundUser){
        if (foundUser.password === password){
          res.redirect("/stockView");
        }
        else
        {
          res.render('login', {title: 'Log Into Your Account', error:'Password Incorrect'});
        }
      }
      else{
        res.render('login', {title: 'Log Into Your Account', error:'Account has not registered'});
      }
    }
  })
});
//local user register account
router.post('/register', function(req,res){
  var rePass = req.body.rePass;
  var accountName = req.body.accountName;
  var userName = req.body.firstName + req.body.lastName;
  var password = req.body.password;
  var email = req.body.email;
console.log(email);
      function checkPass() {
          var pass1 = password; // acess html object with password ID # means ID
          var pass2 = rePass;

          var isTrue = true;

          // this searches the string to find if there are spaces in the password
          var pos = pass1.val().search(/ /);
          if (pos !== -1) {
            res.render('newuser',{ title: 'Create Your Account' ,error:'<br>No spaces allowed in password.'});
          }
          // this searches the string to see if there is a number in the password
          var pos2 = pass1.val().search(/\d/);
          if (pos2 == -1) {
              res.render('newuser',{ title: 'Create Your Account' , error:'<br>You need atleast one number in password.'});
          }

          // this checks if any of the password fields are empty or if they do not match
          if(pass1.val() == "" || pass2.val()=="") {
              res.render('newuser',{ title: 'Create Your Account' , error:'<br>Type in both password.'});
          } else if (pass1.val() !== pass2.val()) {
            res.render('newuser',{ title: 'Create Your Account' , error:'<br>The passwords you type do not match.'});
          }
          return isTrue;
      }
  function emailIsValid (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
if(emailIsValid(email)){
  User.find({$or:[
    {accountName: accountName},
    {email: email}
  ]}, function(err, docs){
    if(docs.length!=0){
      if(docs[0].accountName == accountName){
        res.render('newuser',{ title: 'Create Your Account' , error:'username Already exist'});
                }
                else if(docs[0].email == email){
                          res.render('newuser',{ title: 'Create Your Account' , error:'Email Already exist'});
                }
    }
    else{
      new User({
        userName:userName,
        accountName: accountName,
        password: password,
        email: email
      }).save().then((newUser)=>{
        console.log('New user Created: '+ newUser);
        res.redirect('/stockView');
      });
    }
  })
} else{
    res.render('newuser',{ title: 'Create Your Account' , error:'<br>This email is not legit!'});
}

});

module.exports = router;
