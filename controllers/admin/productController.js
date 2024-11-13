const Product = require('../../model/productSchema');
const Category=require('../../model/categorySchema')
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

  //------------->  here  calculate   the discounted price
  const calculateDiscountedPrice = (price, discountType, discountValue) => {
    if (discountType === 'fixed') {
        return price - discountValue;
    } else if (discountType === 'percentage') {
        return price - (price * discountValue / 100);
    }
    return price; //----------->it return price if no discount is calculated
};






//....Listing of products...//
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const categories = await Category.find();
    const message = req.session.message || null;
    req.session.message = null; // Clear message after using it

    
    res.render('admin/adminProducts', { message: null, messageType: null, products, categories });
  } catch (error) {
    console.log(error);
    res.render('admin/adminProducts', { message: 'An error occurred. Please try again.', messageType: 'error', products: [],categories:[] });
  }
};

//----adding---products----//
exports.getAddproduct = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render('admin/addProducts', { message: null, type: null,categories });
  } catch (error) {
    console.error(error);
    res.render('admin/addProducts', { message: 'An error occurred.',categories:[] });
  }
};

// ------postAddProducts....///
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
      return res.render('admin/addProducts', { message: { text: 'Please add at least one color.', type: 'error' }, categories });
    }

    // ----------> Check if any field is empty
    if (!name || !price || !quantity || !description) {
      return res.render('admin/addProducts', { message: { text: 'All fields must be filled out.', type: 'error' }, categories });
    }
    
    // ----- Validation for product name (whether it starts with an uppercase letter) -----
    if (name && !/^[A-Z]/.test(name)) {
      return res.render('admin/addProducts', { message: { text: 'Product name must start with an uppercase letter.', type: 'error' }, categories });
    }

    // --------> Validate color (should not contain numbers)
    if (color && /\d/.test(color)) {
      return res.render('admin/addProducts', { message: { text: 'Color must be a string without numbers.', type: 'error' }, categories });
    }

    if (!category) {
      return res.render('admin/addProducts', {
        categories,
        message: { text: 'Please select a valid category.', type: 'error' }
      });
    }

    //--------->it Check if the category exists in the database
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.render('admin/addProducts', {
        categories,
        message: { text: 'Selected category does not exist.', type: 'error' }
      });
    }

    //--------> Validate numeric fields (should not be negative)
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
        return res.render('admin/addProducts', { message: { text: 'Numberic error', type: 'error' }, categories });
      }
    }

    // --------> Validate operating system (should not be negative)
    if (operatingSystem < 0) {
      return res.render('admin/addProducts', { message: { text: 'Operating System must be a positive integer.', type: 'error' }, categories });
    }

    // -------> Check if croppedImages is received and parse it
    const croppedImages = req.body.croppedImages ? JSON.parse(req.body.croppedImages) : [];

    //------> Validate that at least 3 images are uploaded
    if (!croppedImages || croppedImages.length < 3) {
      return res.render('admin/addProducts', {
        message: { text: 'At least 3 images are required', type: 'error'}, categories
      });
    }
    const categoryForUpdation = await Category.findById(category);
    // ------> Create new product
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

    // -----> Save the product to the database
    const savedProduct = await newProduct.save();
//-------> Update the relevant category by pushing the product ID into the productIds array

categoryForUpdation.productIds.push(savedProduct._id);  // Push the saved product's ID
await categoryForUpdation.save();



    res.render('admin/addProducts', {
      message: { text: 'Product added successfully', type: 'success' }, categories
    });
  } catch (error) {
    console.error(error);
    res.render('admin/addProducts', {
      message: { text: 'Internal server error, please try again later', type: 'error' },
      categories
    });
  }
};


//------------->delete Product

exports.deleteProduct =async(req,res)=>{
           const products=await Product.find();
    try{
      const productId=req.params.id;
      await Product.findByIdAndDelete(productId)
      res.render('admin/adminProducts',{message:{text:'Product deleted Successfully',type:'success'},products})
    }catch(error){
      console.error(error);
      res.render('admin/adminProducts',{message:{text:'Product deletion Unsccessfull.Please try again later',type:'error'},products})
    }
}




// Block Product
exports.blockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { status: 'Inactive' });

 
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'success', text: 'Product Blocked Successfully' },
      products
    });
  } catch (error) {
    console.error(error);
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'error', text: 'Something went wrong while blocking the product' },
      products
    });
  }
};

// Unblock Product
exports.unBlockProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { status: 'Active' });

   
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'success', text: 'Product Unblocked Successfully' },
      products
    });
  } catch (error) {
    console.error(error);
    const products = await Product.find();
    res.render('admin/adminProducts', {
      message: { type: 'error', text: 'Something went wrong while unblocking the product' },
      products
    });
  }
};

//----->getEDIT PRODUCT
exports.getEditProduct = async (req, res) => {
  const categories=await Category.find()
  try {
      const productId = req.params.id;
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).send('Product not found');
      }
      
      res.render('admin/editProduct', { product,message:null,categories });
  } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).send('Server error');
  }
};
//------>remove image while editing
exports.removeImage = async (req, res) => {
  const { image, productId } = req.body;
  try {
    // Remove the image from the product's images array
    await Product.findByIdAndUpdate(productId, { $pull: { images: image } });

  
    req.flash('success', 'Image removed successfully');


    return res.status(200).json({ success: true, message: 'Image removed successfully' });
  } catch (error) {
    console.error('Error removing image:', error);


    req.flash('error', 'Error removing image');
    return res.status(500).json({ success: false, message: 'Error removing image' });
  }
};
//------>post edit product
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
    const productId = req.params.id; // Get the product ID from params
    const product = await Product.findById(productId);

    // Check for required fields and validation
    if (!color || color.length === 0) {
      return res.render('admin/editProduct', { product, categories, message: { text: 'Please add at least one color.', type: 'error' } });
    }

    if (!name || !price || !quantity || !description||!isfeatured) {
      return res.render('admin/editProduct', { product, categories, message: { text: 'All fields must be filled out.', type: 'error' } });
    }

    if (name && !/^[A-Z]/.test(name)) {
      return res.render('admin/editProduct', { product, categories, message: { text: 'Product name must start with an uppercase letter.', type: 'error' } });
    }

    if (color && /\d/.test(color)) {
      return res.render('admin/editProduct', { product, categories, message: { text: 'Color must be a string without numbers.', type: 'error' } });
    }
    if (!category) {
      return res.render('admin/editProduct', { product, categories, message: { text: 'Please select a valid category.', type: 'error' } });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.render('admin/editProduct', {
        message: { text: 'Selected category does not exist.', type: 'error' }
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
      return res.render('admin/editProduct', { product, categories, message: { text: 'Operating System must be a positive integer.', type: 'error' } });
    }

    const croppedImages = req.body.croppedImages ? JSON.parse(req.body.croppedImages) : [];
    const updatedImages = [...product.images, ...croppedImages];

    // Find the existing product and update it
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

    return res.render('admin/adminProducts', { products, categories, message: { text: 'Product updated successfully ', type: 'success' } });
  } catch (error) {
    console.error(error);


    const products = await Product.find();

    return res.render('admin/adminProducts', { products, categories, message: { text: 'Internal server error, please try again later', type: 'error' } });
  }
};
