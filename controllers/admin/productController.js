const Product = require('../../model/productSchema');
const Category=require('../../model/categorySchema');
const messages = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

  
  const calculateDiscountedPrice = (price, discountType, discountValue) => {
    if (discountType === 'fixed') {
        return price - discountValue;
    } else if (discountType === 'percentage') {
        return price - (price * discountValue / 100);
    }
    return price; 
};


exports.getProducts = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1; 
    const limit = 8; 
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

   
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const categories = await Category.find()
    const message = req.session.message || null;
    req.session.message = null; 
   const startIndex=skip+1

    
    res.render('admin/adminProducts', { message: null, messageType: null, products, categories,currentPage: page,
      totalPages: totalPages,startIndex });
  } catch (error) {
    res.render('admin/adminProducts', { message: messages.COMMON.INTERNAL_ERROR, messageType: 'error', products: [],categories:[] });
  }
};


exports.getAddproduct = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render('admin/addProducts', { message: null, type: null,categories });
  } catch (error) {
    res.render('admin/addProducts', { message: messages.COMMON.INTERNAL_ERROR,categories:[] });
  }
};


exports.postAddProduct = async (req, res) => {
  let categories;

  try {
   
    categories = await Category.find();
    
    const {
      name,
      ramCapacity, 
      ramGeneration,
      description,
      price,
      quantity,
      isfeatured,
      processor,
      processorGeneration,
      storageType,
      weight,
      operatingSystem,
      touchScreen,
      graphicsType,
      graphicsCapacity,
      graphicsGeneartion,
      color,
      discountType, 
      discountValue,
      category
    } = req.body;
  
      
    const finalPrice = calculateDiscountedPrice(price, discountType, discountValue);

    if (!color || color.length === 0) {
      return res.render('admin/addProducts', { message: { text: messages.PRODUCT.COLOR_REQUIRED, type: 'error' }, categories });
    }

  
    if (!name || !price || !quantity || !description) {
      return res.render('admin/addProducts', { message: { text: messages.PRODUCT.REQUIRED_FIELDS, type: 'error' }, categories });
    }
    
    if (name && !/^[A-Z]/.test(name)) {
      return res.render('admin/addProducts', { message: { text: messages.PRODUCT.INVALID_NAME, type: 'error' }, categories });
    }

    if (color && /\d/.test(color)) {
      return res.render('admin/addProducts', { message: { text: messages.PRODUCT.INVALID_COLOR, type: 'error' }, categories });
    }
    
    if (!category) {
      return res.render('admin/addProducts', {
        categories,
        message: { text: messages.PRODUCT.CATEGORY_REQUIRED, type: 'error' }
      });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.render('admin/addProducts', {
        categories,
        message: { text: messages.PRODUCT.CATEGORY_NOT_FOUND, type: 'error' }
      });
    }
    const numericFields = [
      { field: price, name: 'Product Price' },
      { field: quantity, name: 'Product Quantity' },
      { field: ramCapacity, name: 'Product RAM Capacity' },
      { field: ramGeneration, name: 'Product RAM Generation' },
      { field: weight, name: 'Product Weight' },
      { field: graphicsCapacity, name: 'Product Graphics Capacity' },
    ];

    for (const { field, name } of numericFields) {
      if (field < 0) {
        return res.render('admin/addProducts', { message: { text: messages.PRODUCT.NUMERIC_ERROR, type: 'error' }, categories });
      }
    }

    if (operatingSystem < 0) {
      return res.render('admin/addProducts', { message: { text: messages.PRODUCT.OS_INVALID, type: 'error' }, categories });
    }

    const croppedImages = req.body.croppedImages ? JSON.parse(req.body.croppedImages) : [];

    if (!croppedImages || croppedImages.length < 3) {
      return res.render('admin/addProducts', {
        message: { text: messages.PRODUCT.IMAGE_REQUIRED, type: 'error'}, categories
      });
    }
    const categoryForUpdation = await Category.findById(category);
   
    const newProduct = new Product({
      name,
      ramCapacity,
      ramGeneration,
      description,
      price,
      quantity,
      isfeatured,
      processor,
      processorGeneration,
      storageType,
      weight,
      operatingSystem,
      touchScreen,
      graphicsType,
      graphicsCapacity,
      graphicsGeneartion,
      color,
      images: croppedImages,
      category: categoryForUpdation.name,
      discountType,
      discountValue,
      finalPrice
    });

    const savedProduct = await newProduct.save();

categoryForUpdation.productIds.push(savedProduct._id);  
await categoryForUpdation.save();

    res.render('admin/addProducts', {
      message: { text: messages.PRODUCT.ADD_SUCCESS, type: 'success' }, categories
    });
  } catch (error) {
    res.render('admin/addProducts', {
      message: { text: messages.PRODUCT.ADD_ERROR, type: 'error' },
      categories
    });
  }
};

exports.deleteProduct =async(req,res)=>{
           const products=await Product.find();
    try{
      const productId=req.params.id;
      await Product.findByIdAndDelete(productId)
      res.render('admin/adminProducts',{message:{text:messages.PRODUCT.DELETE_SUCCESS,type:'success'},products})
    }catch(error){
      res.render('admin/adminProducts',{message:{text:messages.PRODUCT.DELETE_ERROR,type:'error'},products})
    }
}

exports.blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { status: 'Inactive' });

 
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'success', text: messages.PRODUCT.BLOCK_SUCCESS },
      products
    });
  } catch (error) {

    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'error', text: messages.PRODUCT.BLOCK_ERROR },
      products
    });
  }
};


exports.unBlockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { status: 'Active' });

   
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'success', text: messages.PRODUCT.UNBLOCK_SUCCESS},
      products
    });
  } catch (error) {
    console.error(error);
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'error', text: messages.PRODUCT.UNBLOCK_ERROR },
      products
    });
  }
};


exports.getEditProduct = async (req, res) => {
  const categories=await Category.find()
  try {
      const productId = req.params.id;
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(STATUS_CODES.NOT_FOUND).send(messages.PRODUCT.NOT_FOUND);
      }
      
      res.render('admin/editProduct', { product,message:null,categories });
  } catch (error) {
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.COMMON.INTERNAL_ERROR);
  }
};

exports.removeImage = async (req, res) => {
  const { image, productId } = req.body;
  try {
    
    await Product.findByIdAndUpdate(productId, { $pull: { images: image } });
    req.flash('success', messages.PRODUCT.IMAGE_REMOVE_SUCCESS);
    return res.status(STATUS_CODES.OK).json({ success: true, message: messages.PRODUCT.IMAGE_REMOVE_SUCCESS });
  } catch (error) {
    req.flash('error', messages.PRODUCT.IMAGE_REMOVE_ERROR);
    return res.status(500).json({ success: false, message: messages.PRODUCT.IMAGE_REMOVE_ERROR });
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const {
      name,
      ramCapacity, 
      ramGeneration,
      description,
      price,
      quantity,
      processor,
      processorGeneration,
      storageType,
      weight,
      operatingSystem,
      touchScreen,
      isfeatured,
      graphicsType,
      graphicsCapacity,
      graphicsGeneartion,
      color,
      category,
      keyFeatures,
      discountType, 
      discountValue
    } = req.body;
    const finalPrice = calculateDiscountedPrice(price, discountType, discountValue);
  
    const categories = await Category.find();
    const productId = req.params.id; 
    const product = await Product.findById(productId);

    
    if (!color || color.length === 0) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.COLOR_REQUIRED, type: 'error' } });
    }

    if (!name || !price || !quantity || !description||!isfeatured) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.REQUIRED_FIELDS, type: 'error' } });
    }

    if (name && !/^[A-Z]/.test(name)) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.INVALID_NAME, type: 'error' } });
    }

    if (color && /\d/.test(color)) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.INVALID_COLOR, type: 'error' } });
    }
    if (!category) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.CATEGORY_REQUIRED, type: 'error' } });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.render('admin/editProduct', {
        message: { text: messages.PRODUCT.CATEGORY_NOT_FOUND, type: 'error' }
      });
    }

    const numericFields = [
      { field: price, name: 'Product Price' },
      { field: quantity, name: 'Product Quantity' },
      { field: ramCapacity, name: 'Product RAM Capacity' },
      { field: ramGeneration, name: 'Product RAM Generation' },
      { field: weight, name: 'Product Weight' },
      { field: graphicsCapacity, name: 'Product Graphics Capacity' },
    ];

    for (const { field, name } of numericFields) {
      if (field < 0) {
        return res.render('admin/editProduct', { product, categories, message: { text: `${name} must be a positive value.`, type: 'error' } });
      }
    }

    if (operatingSystem < 0) {
      return res.render('admin/editProduct', { product, categories, message: { text: messages.PRODUCT.OS_INVALID, type: 'error' } });
    }

    const croppedImages = req.body.croppedImages ? JSON.parse(req.body.croppedImages) : [];
    const updatedImages = [...product.images, ...croppedImages];

    await Product.findByIdAndUpdate(
      productId,
      {
        name,
        ramCapacity,
        ramGeneration,
        description,
        price,
        isfeatured,
        quantity,
        processor,
        processorGeneration,
        storageType,
        weight,
        operatingSystem,
        touchScreen,
        graphicsType,
        graphicsCapacity,
        graphicsGeneartion,
        color,
        images: updatedImages,
        category: categoryExists.name,
        keyFeatures,
        discountType: discountType === 'none' ? null : discountType,
        discountValue: discountType === 'none' ? 0 : discountValue,
        finalPrice,
      }
    );
    const products = await Product.find();
    return res.render('admin/adminProducts', { products, categories, message: { text: messages.PRODUCT.UPDATE_SUCCESS, type: 'success' } });
  } catch (error) {
    const products = await Product.find();
    return res.render('admin/adminProducts', { products, categories, message: { text: messages.COMMON.INTERNAL_ERROR, type: 'error' } });

  }
};
