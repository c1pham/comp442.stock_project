const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stockSchema = new Schema({
  stock: String,
  prices: Number,
  quantity: Number
});

const userSchema = new Schema({
  userName:String,
  email: String,
  password:String,
  googleId: String,
  CompanyBought: [stockSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
