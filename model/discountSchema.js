const mongoose = require('mongoose');


const offerSchema = mongoose.Schema({
    category:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required:true
  },
  offerName:{
      type:String,
      required:true
  },
  discount:{
      type:Number,
      required:true
  },
  isActive:{
      type:Boolean,
      default:true
  }
},{timestamps: true})

module.exports = mongoose.model('Offers',offerSchema)