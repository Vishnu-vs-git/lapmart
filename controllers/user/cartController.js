const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');

exports.getCartPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) {
      return res.redirect('/login');
    }

    const message = req.session.message;
    delete req.session.message;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.render('user/userCart', {
        cartItems: [],
        subtotal: 0,
        totalDiscount: 0,
        tax: 0,
        grandTotal: 0,
        deliveryCharge: 0,
        message: null
      });
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const taxRate = 0.18; // Example tax rate of 18%

    cart.items.forEach(item => {
      const originalPrice = item.productId.price;
      const finalPrice = item.productId.discountValue > 0 ? item.productId.finalPrice : originalPrice;

      subtotal += originalPrice * item.quantity;
      totalDiscount += (originalPrice - finalPrice) * item.quantity;
    });

    const tax =Math.round((subtotal-totalDiscount) * taxRate);
 
    const grandTotal = ( subtotal-totalDiscount) + tax;

    res.render('user/userCart', {
      cartItems: cart.items,
      subtotal,
      totalDiscount,
      tax,
      grandTotal,
      deliveryCharge: 0,
      message
    });
  } catch (error) {
    console.error('Error retrieving cart:', error);
    res.status(500).send('Error retrieving cart');
  }
};

exports.addToCart = async (req, res) => {
  const userId = req.session.user._id;
  if (!userId) return res.status(401).json({ message: "User not authenticated" });

  const { productId, quantity } = req.body;

  try {
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }

    const qty = parseInt(quantity, 10);
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.quantity < qty) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }

    const price = product.finalPrice > 0 ? product.finalPrice : product.price;
    const originalPrice = product.price;
    const itemTotal = qty * price;

    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
        cart.items[itemIndex].total = cart.items[itemIndex].quantity * price;
      } else {
        cart.items.push({
          productId,
          quantity: qty,
          price,
          total: itemTotal,
          originalPrice
        });
      }
    } else {
      cart = new Cart({
        userId,
        items: [{
          productId,
          quantity: qty,
          price,
          total: itemTotal,
          originalPrice
        }]
      });
    }

    cart.subTotal = cart.items.reduce((acc, item) => acc + item.quantity * item.originalPrice, 0);
    cart.totalDiscount = cart.items.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
    cart.tax = Math.round((cart.subTotal- cart.totalDiscount) * 0.18);
    cart.grandTotal = (cart.subTotal-cart.totalDiscount) + cart.tax;

    await cart.save();
    return res.status(200).json({ message: 'Item added to cart successfully', cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

exports.updateQuantity = async (req, res) => {
  const { itemId, quantity } = req.body;
  const userId = req.session.user._id;

  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const cartItem = cart.items.find(item => item._id.equals(itemId));
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    const product = cartItem.productId;
    const qty = parseInt(quantity, 10);

    if (qty <= 0 || qty > product.quantity||qty>5) {
      return res.status(400).json({ success: false, message: 'Requested quantity not available' });
    }

    cartItem.quantity = qty;
    cartItem.total = qty * cartItem.price;

    cart.subTotal = cart.items.reduce((acc, item) => acc + item.quantity * item.originalPrice, 0);
    cart.totalDiscount = cart.items.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
    cart.tax = Math.round((cart.subTotal-cart.totalDiscount) * 0.18);
    cart.grandTotal = (cart.subTotal- cart.totalDiscount) + cart.tax;

    await cart.save();

    res.status(200).json({
      success: true,
      subtotal: cart.subTotal,
      discount: cart.totalDiscount,
      tax: cart.tax,
      grandTotal: cart.grandTotal,
      productTotal: cartItem.total
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ success: false, message: 'Failed to update quantity' });
  }
};


exports.removeCartitems = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.session.user._id;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    ).populate('items.productId');

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Failed to remove item' });
    }

    cart.subTotal = cart.items.reduce((acc, item) => acc + item.quantity * item.originalPrice, 0);
    cart.totalDiscount = cart.items.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
    cart.tax = Math.round((cart.subTotal- cart.totalDiscount)) * 0.18;
    cart.grandTotal = (cart.subTotal- cart.totalDiscount) + cart.tax;

    await cart.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};