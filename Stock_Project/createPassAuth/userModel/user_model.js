const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const stockSchema = new Schema({
  stock: String,
  prices: Number,
  quantity: Number,
  percentInterest: Number
});

const userSchema = new Schema({
  userName:String,
  email: String,
  password:String,
  googleId: String,
  CompanyBought: [stockSchema]
});
userSchema.plugin(passportLocalMongoose,{usernameField: 'email'});

const User = mongoose.model('User', userSchema);

module.exports = User;
