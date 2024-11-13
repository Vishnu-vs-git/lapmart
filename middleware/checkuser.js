const userModel =require('../model/userSchema')

exports.checkuser= async(req,res,next) => {
  try{
    const userId=req.session.user

    if(userId){
      res.locals.user=userId
      return next()
    } else {
      res.locals.user=null
      return next();
    }

  }catch(error) {
    console.log("errori in checkuser ",error);
    
  }
}


