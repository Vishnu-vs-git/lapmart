const Category=require('../../model/categorySchema');
const Offer=require('../../model/discountSchema');
const Product=require('../../model/productSchema');



exports.getOffers = async (req, res) => {
  try {
    const categories = await Category.find(); 
    const offers = await Offer.find().populate('category'); 
    res.render('admin/adminOffer', { categories, offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).send('Internal Server Error');
  }
};


exports.addOffer = async (req, res) => {
  const { category, offerName, discount } = req.body;
  console.log('hello from addoffer')
  try {
    const newOffer = new Offer({
      category,
      offerName,       
      discount,
      isActive: true, 
    });
    const cate=await Category.findById(category)
    const catename=cate.name
    console.log('category in offrr',  catename)
    const products = await Product.find({ category:  catename }); 

    products.forEach(async (product) => {
       if(product. discountType==='percentage'||product. discountType===null){
        console.log('current discount value',product.discountValue)
      product.discountValue = parseInt(product.discountValue || 0) + parseInt((100-product.discountValue)*discount/100);
      product.discountType='percentage'
      product.finalPrice=parseInt(product.price) - parseInt(product.discountValue)  
      console.log('product final price in offer',product.discountValue );

      
      await product.save(); 
       }else{
        if(product. discountType==='fixed'){
          product.discountValue=parseInt(product.discountValue || 0) + parseInt((product.price-product.discountValue)*discount/100);
          product.finalPrice=parseInt(product.price) - parseInt(product.discountValue)  ;   
         }
       await product.save(); 
      }

    });
    
    console.log('productsss',products)
    await newOffer.save();
    res.redirect('/admin/offers');
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteOffer=async(req,res)=>{
   try{
    console.log('hi from delete')
  const{offerId}=req.params;

    if(!offerId){
      return res.status(400).json({error:'Offer id not found'});
    }
    const offer=await Offer.findByIdAndDelete(offerId);

    if(!offer){
      return res.status(404).json({success:false,message:'Offer not found'});
    }
    res.status(200).json({success:true,message:'offer deleted successfully'})


}catch(error){
  console.error('Error in deleting offer',error)
  res.status(500).json({error:'internal server error'})
}
}
exports.changeOfferStatus=async(req,res)=>{
  try{
    const{offerId}=req.params;
    if(!offerId){
        return res.status(400).json({error:'offer id is not available'});
    }

    const{changeStatus}=req.body
    console.log('current status in offer',changeStatus);

    const currentStatus = changeStatus === "true" || changeStatus === true;
const newStatus = !currentStatus;

    const offer=await Offer.findByIdAndUpdate(offerId,{isActive:newStatus},{new:true}) ; 

     if(!offer){
      return res.status(404).json({error:'offer not found'});
     }
     res.status(200).json({success:true,message:'Status changed status successfully',isActive: newStatus})



  }catch(error){
      console.error('error in changing status',error);
      res.status(500).json({error:"internal server error"})
  }
}

exports.editOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    // Check if offerId is provided
    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is not provided' });
    }

    const { category, offerName, offerType, discount, isActive } = req.body;

    // Check for required fields
    if (!category || !offerName || !offerType || !discount) {
      return res.status(400).json({ error: 'Some required fields are missing' });
    }

    // Update the offer
    const offer = await Offer.findByIdAndUpdate(
      offerId,
      { category, offerName, offerType, discount, isActive },
      { new: true } // Return the updated document
    );

    // If offer doesn't exist, return an error
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // If the offer type is 'percentage', update product prices
    if (offer.offerType === 'percentage') {
      await updateProductPrice(offer);
    }

    res.status(200).json({ message: 'Offer updated successfully' });
  } catch (error) {
    console.error('Error in editing offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function updateProductPrice(offer) {
  try {
    
      const products = await Product.find({ category: offer.category, status: 'Active' });

      for (let product of products) {
   
          const originalPrice = product.price; 
          const finalPrice = product.finalPrice || originalPrice; // Use finalPrice if available, else originalPrice
          const discountValue = originalPrice - finalPrice; // Existing discount already applied

          // Calculate the new offer's effect
          const offerRate = offer.discount; // Percentage offer from the new offer
          const offerValue = finalPrice * (offerRate / 100); // Apply the discount on the current finalPrice
          const totalDiscountValue = discountValue + offerValue; // Accumulated discount value

          // Recalculate the discount rate
          const newDiscountRate = (totalDiscountValue / originalPrice) * 100;

          // Update product fields
          product.discountValue = newDiscountRate.toFixed(2);  // Total discount in currency
          product.finalPrice = (originalPrice - totalDiscountValue).toFixed(2); 
         
          console.log('product discount value in edit offer',product.discountvalue);

          console.log('product final price',product.finalPrice);


          // Save the updated product
          await product.save(); // Use await here to save the changes to the database
      }
  } catch (error) {
      console.error('Error updating product prices:', error);
  }
}
