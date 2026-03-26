const Review = require("../../model/reviewSchema");
const Product = require("../../model/productSchema");

exports.addReview  =async (req,res) => {
 try{
    if(!req.session.user_id) {
      return res.status(401).json({message: "Please login"});

    }
    
    const {productId, rating, comment} = req.body;
    console.log("hello  is",rating)
    
    const userId = req.session.user_id;
    // preventing duplicate review //
       const alreadyReviewed = await Review.findOne({productId, userId});
       if(alreadyReviewed){
         return res.json({success: false, message: "You already reviewed this product"});
       }
      await Review.create({
        productId,
        userId,
        rating:Number(rating),
        comment
      });

      // recalculating  product rating //

     const reviews = await Review.find({productId});
     const avgRating = reviews.reduce((sum,r) => sum+r.rating,0)/reviews.length;

     await Product.findByIdAndUpdate(productId,{
      averageRating :Number(avgRating.toFixed(1)),
      totalReviews: reviews.length
     });

      res.json({ success: true, message: "Review added successfully" });

 }catch(err){
   console.error(err);
    res.status(500).json({ message: "Something went wrong" });
 }
}