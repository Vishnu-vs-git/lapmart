const messages = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render('admin/adminOffer', {
    categories: [],
    offers: [],
    message: {
      text: messages.OFFER.LOAD_ERROR,
      type: "error"
    }
  });
  }
};


exports.addOffer = async (req, res) => {
  const { category, offerName, discount } = req.body;
 
  try {
    const newOffer = new Offer({
      category,
      offerName,       
      discount,
      isActive: true, 
    });
    const cate = await Category.findById(category)
    const cateGoryName=cate.name
    
    const products = await Product.find({ category:  cateGoryName }); 

    products.forEach(async (product) => {
       if(product. discountType==='percentage'||product. discountType===null){
        
      product.discountValue = parseInt(product.discountValue || 0) + parseInt((100-product.discountValue)*discount/100);
      product.discountType='percentage'
      product.finalPrice=parseInt(product.price) - parseInt(product.discountValue)  
  
      await product.save(); 
       }else{
        if(product. discountType==='fixed'){
          product.discountValue=parseInt(product.discountValue || 0) + parseInt((product.price-product.discountValue)*discount/100);
          product.finalPrice=parseInt(product.price) - parseInt(product.discountValue)  ;   
         }
       await product.save(); 
      }

    });
    
    await newOffer.save();
    res.redirect('/admin/offers');
  } catch (error) { 
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:messages.COMMON.INTERNAL_ERROR})
  }
};

exports.deleteOffer=async(req,res)=>{
   try{
   
  const{offerId}=req.params;

    if(!offerId){
     return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.OFFER.ID_REQUIRED});
    }
    const offer=await Offer.findByIdAndDelete(offerId);

    if(!offer){
     return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.OFFER.NOT_FOUND });
    }
    res.status(STATUS_CODES.OK).json({success:true,message: messages.OFFER.DELETE_SUCCESS})


}catch(error){
  res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:messages.COMMON.INTERNAL_ERROR})
}
}
exports.changeOfferStatus=async(req,res)=>{
  try{
    const{offerId}=req.params;
    if(!offerId){
        return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.OFFER.ID_REQUIRED});
    }

    const{changeStatus}=req.body
    
    const currentStatus = changeStatus === "true" || changeStatus === true;
    const newStatus = !currentStatus;

    const offer=await Offer.findByIdAndUpdate(offerId,{isActive:newStatus},{new:true}) ; 

     if(!offer){
     return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.OFFER.NOT_FOUND });
     }
     res.status(STATUS_CODES.OK).json({success:true,message:messages.OFFER.STATUS_UPDATED,isActive: newStatus})



  }catch(error){   
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:messages.COMMON.INTERNAL_ERROR})
  }
}

exports.getEditOffer=async(req,res)=>{
  try{
    const{offerId}=req.params;
    if(!offerId){
     return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.OFFER.ID_REQUIRED});
    }
    const offer=await Offer. findById(offerId).populate('category');
    if(!offer){
     return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.OFFER.NOT_FOUND });
    }
    const categories=await Category.find({});

    if(!categories){
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.CATEGORY.NOT_FOUND });
    }
    res.render('admin/editOffer',{offer,categories})


  }catch(error){
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:messages.COMMON.INTERNAL_ERROR})  
  }
}





exports.postEditOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    if (!offerId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.OFFER.ID_REQUIRED});
    }

    const { category, offerName, offerType, discount, isActive } = req.body;
   
    if (!category || !offerName  || !discount) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.OFFER.REQUIRED_FIELD_MISSING });
    }

    const offer = await Offer.findByIdAndUpdate(
      offerId,
      { category, offerName, offerType, discount, isActive },
      { new: true } 
    ).populate('category')

   
    if (!offer) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.OFFER.NOT_FOUND });
    }
 
      const result=await updateProductPrice(offer);
    
    req.session.message= messages.OFFER.UPDATE_SUCCESS;

      res.redirect('/admin/offers')
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: messages.COMMON.INTERNAL_ERROR });
  }
};

async function updateProductPrice(offer) {
  try {
    
      const products = await Product.find({ category: offer.category.name, status: 'Active' });

      for (let product of products) {
   
          const originalPrice = product.price; 
          const finalPrice = product.finalPrice || originalPrice; 
          const discountValue = originalPrice - finalPrice;        
          const offerRate = offer.discount; 
         
          const offerValue = finalPrice * (offerRate / 100); 
         
          const totalDiscountValue = discountValue + offerValue; 

        
          const newDiscountRate = (totalDiscountValue / originalPrice) * 100;

         
          product.discountValue = newDiscountRate.toFixed(2);  
          product.finalPrice = (originalPrice - totalDiscountValue).toFixed(2); 
 
          await product.save(); 
        
      }
  } catch (error) {
     res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:messages.COMMON.INTERNAL_ERROR});
  }
}

