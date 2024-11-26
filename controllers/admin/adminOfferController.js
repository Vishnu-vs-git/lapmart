const Category=require('../../model/categorySchema');
const Offer=require('../../model/discountSchema');
const Product=require('../../model/productSchema');



exports.getOffers = async (req, res) => {
  try {
    const message=req.session.message||"";

    delete req.session.message;
    const page= parseInt(req.query.page);
    const limit=8;
    const skip=(page-1)*limit;
    const totalOffers= await Offer.countDocuments();
    const totalPages=Math.ceil(totalOffers/limit);
    const categories = await Category.find(); 
    const offers = await Offer.find().populate('category').skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 }); 
    res.render('admin/adminOffer', { categories, offers,message,currentPage: page,
      totalPages: totalPages });
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

exports.getEditOffer=async(req,res)=>{
  try{
    const{offerId}=req.params;
    if(!offerId){
      return res.status(400).json({error:'offerId not found'});
    }
    const offer=await Offer. findById(offerId).populate('category');
    if(!offer){
      return res.status(400).json({error:'offer not found'});
    }
    const categories=await Category.find({});

    if(!categories){
      return res.status(400).json({error:'categories  not found'});
    }
    res.render('admin/editOffer',{offer,categories})


  }catch(error){

    console.error('error in getting edit offer page',error)
  }
}





exports.postEditOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
console.log('hellooo from edit offer')
    // Check if offerId is provided
    if (!offerId) {
      return res.status(400).json({ error: 'Offer ID is not provided' });
    }

    const { category, offerName, offerType, discount, isActive } = req.body;
    console.log('req body in edit offer',req.body)

    // Check for required fields
    if (!category || !offerName  || !discount) {
      return res.status(400).json({ error: 'Some required fields are missing' });
    }

    // Update the offer
    const offer = await Offer.findByIdAndUpdate(
      offerId,
      { category, offerName, offerType, discount, isActive },
      { new: true } // Return the updated document
    ).populate('category')

    // If offer doesn't exist, return an error
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    // If the offer type is 'percentage', update product prices
    // if (offer.offerType === 'percentage') {
      const result=await updateProductPrice(offer);
      console.log('result in editttt',result)
    // } 
    req.session.message='offer Updated successfully'

      res.redirect('/admin/offers')
  } catch (error) {
    console.error('Error in editing offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function updateProductPrice(offer) {
  try {
    
      const products = await Product.find({ category: offer.category.name, status: 'Active' });
      console.log('products in edit offer',products)

      for (let product of products) {
   
          const originalPrice = product.price; 
          const finalPrice = product.finalPrice || originalPrice; // Use finalPrice if available, else originalPrice
          const discountValue = originalPrice - finalPrice; // Existing discount already applied

          // Calculate the new offer's effect
          
          const offerRate = offer.discount; // Percentage offer from the new offer
          console.log('offer rate in edit',offerRate)
          console.log('discount value in edit',discountValue)
          const offerValue = finalPrice * (offerRate / 100); // Apply the discount on the current finalPrice
          console.log('discount value in offerValue',offerValue)
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

//---------------> changed offer
// exports.postEditOffer = async (req, res) => {
//   const { offerId } = req.params;
//   const { category, offerName, discount } = req.body;

//   console.log('hello from edit offer');
  
//   try {
//     // Fetch the existing offer
//     const existingOffer = await Offer.findById(offerId);
//     if (!existingOffer) {
//       return res.status(404).json({ error: 'Offer not found' });
//     }

//     const oldCategoryId = existingOffer.category; // Old category ID
//     const oldDiscount = existingOffer.discount; // Old discount value

//     // Fetch the old category name
//     const oldCategory = await Category.findById(oldCategoryId);
//     const oldCategoryName = oldCategory.name;

//     // Fetch products under the old category
//     const oldProducts = await Product.find({ category: oldCategoryName });

//     // Revert the effects of the old offer
//     oldProducts.forEach(async (product) => {
//       if (product.discountType === 'percentage') {
//         // Revert percentage discount
//         const currentDiscountValue = parseInt(product.discountValue || 0);
//         const revertValue = (currentDiscountValue / (100 - oldDiscount)) * 100;
//         product.finalPrice = parseInt(product.price) - parseInt(revertValue);
//         product.discountValue = 0;
//         product.discountType = null;
//       } else if (product.discountType === 'fixed') {
//         // Revert fixed discount
//         product.finalPrice = parseInt(product.price) + parseInt(product.discountValue);
//         product.discountValue = 0;
//         product.discountType = null;
//       }
//       await product.save();
//     });

//     // Update the offer
//     existingOffer.category = category;
//     existingOffer.offerName = offerName;
//     existingOffer.discount = discount;
//     await existingOffer.save();

//     // Fetch the new category name
//     const newCategory = await Category.findById(category);
//     const newCategoryName = newCategory.name;

//     // Fetch products under the new category
//     const newProducts = await Product.find({ category: newCategoryName });

//     // Apply the new offer
//     newProducts.forEach(async (product) => {
//       if (product.discountType === 'percentage' || product.discountType === null) {
//         const currentDiscountValue = parseInt(product.discountValue || 0);
//         const newDiscountValue = parseInt((100 - currentDiscountValue) * discount / 100);
//         product.discountValue = currentDiscountValue + newDiscountValue;
//         product.discountType = 'percentage';
//         product.finalPrice = parseInt(product.price) - parseInt(product.discountValue);
//       } else if (product.discountType === 'fixed') {
//         const currentDiscountValue = parseInt(product.discountValue || 0);
//         const newDiscountValue = parseInt((product.price - currentDiscountValue) * discount / 100);
//         product.discountValue = currentDiscountValue + newDiscountValue;
//         product.finalPrice = parseInt(product.price) - parseInt(product.discountValue);
//       }
//       await product.save();
//     });

//     console.log('Offer and products updated successfully');
//     req.session.message = 'Offer updated successfully';
//     res.redirect('/admin/offers');
//   } catch (error) {
//     console.error('Error editing offer:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };
