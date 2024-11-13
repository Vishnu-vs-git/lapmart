const User=require('../../model/userSchema')
const Wallet=require('../../model/walletSchema');


exports.getwallet=async(req,res)=>{
  try{
   
    const userId=req.session.user._id;
    const walletItems=await Wallet.findOne({userId});
    res.render('user/wallet',{walletItems})
  }catch(error){

  }
}
