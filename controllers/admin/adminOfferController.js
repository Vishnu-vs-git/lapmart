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

    products.forEach((product) => {
      product.discountValue = parseInt(product.discountValue || 0) + parseInt(discount);
      product.save(); 
    });
    
    console.log('productsss',products)
    await newOffer.save();
    res.redirect('/admin/offers');
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).send('Internal Server Error');
  }
};