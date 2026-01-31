const Wishlist=require('../../model/wishlist');

//.......> adding to wishlist

exports.addToWishlist=async(req,res)=>{
  
  try{
    
    if (!req.session.user_id) {
      return res.status(401).json({
        success: false,
        redirect: '/user/login',
        message: 'Please login to add items to wishlist'
      });
    }
    const{productId}=req.body;
    const userId=req.session.user._id;

    const existingItem=await Wishlist.findOne({userId,productId});
      if(existingItem){
       return res.json({success:false,message:'product already added to wishlist'});
       
      }else{
        await Wishlist.create({userId,productId});
        res.json({success:true,message:'Added to wishlist'});
      }
      
    
   }catch(error){
     console.log(error)
    res.json({success:false,message:'Error adding to wishList'})

   }
}

//-------> wishlist rendering


exports.viewWishlist=async(req,res)=>{
  try{
    const userId=req.session.user._id;
    const wishlistItems=await Wishlist.find({userId}).populate('productId');
    res.render('user/wishList',{wishlistItems})
  }catch(error){
    res.json({success:false,message:'Error fetching wishlist'});
  }
};

//------->Remove from wishlist

exports.removeFromWishList=async (req,res)=>{
  const {productId}=req.body;
  const userId=req.session.user._id;

    try{
      await Wishlist.findOneAndDelete({userId,productId});
      res.json({success:true,message:'Removed from wishlist'});
    }catch(error){
      res.json({success:false,message:'Error removing from wishlist'})
    }
};