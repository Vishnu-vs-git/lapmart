const User = require("../../model/userSchema");
const cart = require("../../model/cartSchema");
const Order = require("../../model/orderSchema");
const Address = require("../../model/addressSchema");
const product = require("../../model/productSchema");
const { overwriteMiddlewareResult } = require("mongoose");
const Wallet=require('../../model/walletSchema')
const Coupon=require('../../model/couponSchema')

exports.confirmOrder = async (req, res) => {
  try {
    console.log("hello from order");
    const userId = req.session.user._id;

  //-------> coupon session
  const couponCode = req.session.appliedCoupon;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (coupon) {
      // Update user-specific usage count
      const userUsage = coupon.usageByUser.find((usage) => usage.userId.toString() === userId);
      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usageByUser.push({ userId, count: 1 });
      }

      // Increment global usage count
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Clear coupon from session after use
    delete req.session.appliedCoupon;
  }







    const user = await User.findById(userId);
  
    const { address, paymentMethod } = req.body;
    
    
 
      let paymentStatus=paymentMethod=="Cash on Delivery"?'pending':'paid';
  
    const cartItems = await cart
      .findOne({ userId: userId })
      .populate("items.productId");
      console.log('cartItems in coupon',cartItems.subTotal);
      

    if (!cartItems || cartItems.length === 0 ) {
      return res
        .status(400)
        .json({ message: "Cart is empty. Cannot place order" });

    }



      //-------->checking if payemnthod is wallet and it has enough money;
      if (paymentMethod === "Wallet") {
        const walletDetails = await Wallet.findOne({ userId });
        if (!walletDetails) {
          return res.status(404).send("Wallet details not found");
        }
  
        if (walletDetails.balance < cartItems.subTotal) {
          return res.status(400).json({success:false, message: "Insufficient wallet balance to place the order." });
        }
       
      }
  
      

    const orderItems = cartItems.items.map((item) => {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.total,
        itemOrderStatus: "Pending", // Add the field with the default value
        paymentStatus:paymentStatus
      };
    });
//..............> here we reduce stock 

    for (const item of orderItems) {
      await product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } }
      );
    }
       
    const orderId = generateOrderId();
    //------->here we deduct amount from wallet

    if( paymentMethod==='Wallet'){
      const  wallet = await Wallet.findOne({ userId });
       wallet.balance -=cartItems.subTotal ;
       wallet.transaction.push({
         walletamount:cartItems.subTotal ,
         transactionType: 'Debited',
         orderId: orderId,
         transactionDate: Date.now()
       });
       await wallet.save();
         
       }

    // Create a new order using the modified items array
    const newOrder = new Order({
      userId: userId,
      orderId: orderId,
      items: orderItems,
      totalAmount: cartItems.subTotal,
      shippingAddress: address,
      paymentMethod: req.body.paymentMethod,
      orderStatus: "Pending", 
      couponDiscount:cartItems.couponDiscount,
      totalDiscount:cartItems.totalDiscount
    });



    // Save the new order to the database
    await newOrder.save();

    await cart.deleteOne({ userId: userId });

    console.log("Order confirmed:", newOrder);
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Error confirming order:", error);
    res.status(500).json({ success: false });
  }
};

exports.showConfirmationorder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const order = await Order.findOne({ userId });
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }
    res.render("user/orderConfirmation", { order });
  } catch (error) {
    console.log("error");
  }
};

function generateOrderId() {
  const prefix = "ORD";
  const timestamp = Date.now();
  const randomComponent = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${randomComponent}`;
}

//-------->user order details
exports.getuserorder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 5;

    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ userId })
      .populate("items.productId")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    if (!orders) {
      return res.status(404).json({ message: "no orders found" });
    }

    res.render("user/userOrders", { orders, currentPage: page, totalPages });
  } catch (error) {
    console.error("error in getting order details", error);
    res.status(500).json({ message: "internal server error" });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log('userid in cancel',userId)

    if (!userId) {
      return res.status(400).send("User ID not found in session");
    }

    const { orderId, productId, reason } = req.body;
    const orders = await Order.findOne({ orderId });

    if (!orders) {
      return res.status(404).send("Order not found");
    }

    const itemIndex = orders.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).send("No item found");
    }

    const itemQuantity = orders.items[itemIndex].quantity;
    orders.items[itemIndex].itemOrderStatus = "Cancelled";
    orders.items[itemIndex].cancellationReason = reason;
    orders.updatedAt = Date.now();
    await orders.save();

    const Product = await product.findById(productId);
    if (!Product) {
      return res.status(404).send("Product not found");
    }
    Product.quantity += itemQuantity;
    console.log('productquantity in cancel',Product.quantity)
    await Product.save();

    console.log('payment method in cancel',orders.items[itemIndex].paymentMethod === 'Razorpay')
    // Process refund for Razorpay payments
    if (orders.paymentMethod === 'Razorpay'||'Wallet') {
      const itemTotal = orders.items[itemIndex].itemTotal;
      console.log('itemTotal in cancel',itemTotal)
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        // Create a new wallet with initial balance
        wallet = new Wallet({
          userId: userId,
          balance: itemTotal, // Set initial balance with refund amount
          transaction: [{
            walletamount: itemTotal,
            transactionType: 'Credited',
            orderId: orderId,
            transactionDate: Date.now()
          }]
        });
        await wallet.save();
        console.log("New wallet created and credited:", wallet);
      } else {
        // Update existing wallet balance and log transaction
        wallet.balance += itemTotal;
        wallet.transaction.push({
          walletamount: itemTotal,
          transactionType: 'Credited',
          orderId: orderId,
          transactionDate: Date.now()
        });
        await wallet.save();
        console.log("Wallet updated with refund:", wallet);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in cancelling items:", error);
    res.status(500).send("Internal server error");
  }
};

exports.returnOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    console.log('userid in cancel',userId)

    if (!userId) {
      return res.status(400).send("User ID not found in session");
    }

    const { orderId, productId, reason } = req.body;
    const orders = await Order.findOne({ orderId });

    if (!orders) {
      return res.status(404).send("Order not found");
    }

    const itemIndex = orders.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).send("No item found");
    }

    const itemQuantity = orders.items[itemIndex].quantity;
    orders.items[itemIndex].itemOrderStatus = "return requested";
    orders.items[itemIndex].returnReason = reason;
    orders.updatedAt = Date.now();
    await orders.save();

    const Product = await product.findById(productId);
    if (!Product) {
      return res.status(404).send("Product not found");
    }
    Product.quantity += itemQuantity;
    console.log('productquantity in return',Product.quantity)
    await Product.save();

    console.log('payment method in cancel',orders.items[itemIndex].paymentMethod === 'Razorpay')
    // Process refund for Razorpay payments
    if (orders.paymentMethod === 'Razorpay'||'Wallet'||'Cash on Delivery') {
      const itemTotal = orders.items[itemIndex].itemTotal;
      console.log('itemTotal in cancel',itemTotal)
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        // Create a new wallet with initial balance
        wallet = new Wallet({
          userId: userId,
          balance: itemTotal, // Set initial balance with refund amount
          transaction: [{
            walletamount: itemTotal,
            transactionType: 'Credited',
            orderId: orderId,
            transactionDate: Date.now()
          }]
        });
        await wallet.save();
        console.log("New wallet created and credited:", wallet);
      } else {
        // Update existing wallet balance and log transaction
        wallet.balance += itemTotal;
        wallet.transaction.push({
          walletamount: itemTotal,
          transactionType: 'Credited',
          orderId: orderId,
          transactionDate: Date.now()
        });
        await wallet.save();
        console.log("Wallet updated with refund:", wallet);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in cancelling items:", error);
    res.status(500).send("Internal server error");
  }
};











exports.getOrderdetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);

    const order = await Order.findOne({ orderId }).populate('items.productId');
    
    console.log('shiiiiping',order.shippingAddress);
    if (!order) {
      return res.status(404).send("ordersItems not found");
    }

    res.render("user/userOrderdetails", { order });
  } catch (error) {
    console.error("something error happened", error);
    res.status(500).send("something error happened");
  }
};
