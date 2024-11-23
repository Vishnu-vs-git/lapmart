const mongoose=require('mongoose');
const bannerSchema= new mongoose.Schema({
  title:{
    type:String
  },
  description:{
    type:String
  },
  titleImages:{
    type:String
  },
  status:{
    type:Boolean,
    default:true
  }

},{timestamp:true});
module.exports=mongoose.model('Banner',bannerSchema)