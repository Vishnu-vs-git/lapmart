const Cart=require('../model/cartSchema');
const User=require('../model/userSchema');
const Product=require('../model/productSchema')

// Middleware to check if the products in the cart are still available
const checkStockAvailability = async (req, res, next) => {
  try {
    const userId = req.session.user._id;

    // Fetch user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      req.session.stockError = "Your cart is empty.";
      return res.redirect('/checkout');
    }

    // Check stock for each item in the cart
    for (let item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product || product.quantity < item.quantity) {
        req.session.stockError = `Product "${product ? product.name : 'unknown'}" is out of stock or has insufficient quantity.`;
        return res.redirect('/checkout');
      }
    }

    // Clear any previous stock error message if stock is available
    req.session.stockError = null;
    next();
  } catch (error) {
    console.error("Error in checkStockAvailability middleware:", error);
    req.session.stockError = "Error checking stock availability.";
    res.redirect('/checkout');
  }
};






module.exports = checkStockAvailability;
