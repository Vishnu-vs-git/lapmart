const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({
  
  userName:{
    type:String
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true, 
  },
  addressLine2: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    
    trim: true,
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
   
  },
  phoneNo:{
     type:Number,
     trim:true
  },
  User:{
    type:mongoose.Schema.Types.ObjectId,
     ref:'User'
   
  }
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
