const user = require("../../model/userSchema");
const cart = require("../../model/cartSchema");
const product = require("../../model/productSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
  key_id: process.env.YOUR_RAZORPAY_KEY_ID,
  key_secret: process.env.YOUR_RAZORPAY_SECRET_KEY,
});

exports.getCheckpoutPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const cartTotal = 0;
    const savedAddresses = await user.findById(userId).populate("address");
    const cartItems = await cart
      .findOne({ userId: userId })
      .populate("items.productId");

    if (!cartItems) {
      return res.status(500).send("error in fetching cartItems");
    }

    const insufficientStock = cartItems.items.some((item) => {
      if (
        item.productId.quantity < item.quantity ||
        item.productId.quantity === 0
      ) {
        item.quantity = item.productId.quantity;
        req.session.message = `requested quantity is not available,the stock of ${item.productId.name} is ${item.productId.quantity}`;
        console.log("insufficient stock available");
        return true;
      }
      return false;
    });
    console.log("insufficientStock", insufficientStock);

    if (insufficientStock) {
      return res.redirect("/user/cart");
    }

    if (!savedAddresses) {
      return res.status(500).send("error in feteching address");
    }

    res.render("user/checkout", { savedAddresses, cartItems, cartTotal });
  } catch (error) {
    console.error("something error happened", error);
    res.status(500).send("something error happened");
  }
};

exports.postCheckoutAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const {
      addressLine1,
      addressLine2,
      street,
      state,
      country,
      zipCode,
      phoneNo,
      userName,
      city,
    } = req.body;
    const saveUser = async () => {
      const address = new Address({
        addressLine1,
        addressLine2,
        street,
        state,
        country,
        zipCode,
        phoneNo,
        city,
        User: userId,
        userName,
      });

      const savedAddress = await address.save();
      await user.findByIdAndUpdate(userId, {
        $push: { address: savedAddress._id },
      });
    };
    saveUser();
    res.redirect("/user/checkout");
  } catch (error) {
    console.error("Error in adding address", error);
    res.redirect("/user/addAddress");
  }
};

exports.createRazorPayOrder = async (req, res) => {
  const userId = req.session.user._id;
  const{addressData,paymentMethod}=req.body;
  const cartitems = await cart.findOne({ userId: userId });
  const amount = cartitems.grandTotal;
  console.log("total in cartitems", amount);
  console.log("cartItems in razor pay", cartitems);

  try {
    const orderOptions = {
      amount: amount * 100, // Amount in smallest currency unit (e.g., 1000 for ₹10)
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpayInstance.orders.create(orderOptions);
    console.log("order in razor", order);
    if (!order) {
      throw new Error("Failed to create Razorpay order");
    }
     
    const items = cartitems.items.map((item) => {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.total,
        itemOrderStatus: "Pending", // Add the field with the default value
        paymentStatus: "pending",
        originalPrice:item.originalPrice
      };
    });
    const orderIds = generateOrderId();
    // Create a new order using the modified items array
    const orderitem = new Order({
      userId: userId,
      orderId: orderIds,
      items: items,
      subTotal:cartitems.subTotal,
      totalAmount: cartitems.grandTotal,
      shippingAddress: addressData,
      paymentMethod: paymentMethod,
      orderStatus: "Pending", 
      tax:cartitems.tax,
      couponDiscount:cartitems.couponDiscount,
      totalDiscount:cartitems.totalDiscount
    });
    
    await orderitem.save();

    return res.json({order,orderIds});
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create Razorpay order." });
  }
};

exports.verifyPayment = async (req, res) => {
  console.log("verify payment working");

  const { paymentId, orderId,orderIds, signature, address, paymentMethod } = req.body;

  try {
    // Verifying the signature
    const hmac = crypto.createHmac("sha256", "bcOjtnHN19lrbqBWdS35Ee7J");
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.json({ success: false });
    }

    const userId = req.session.user._id;
    const orderItems = await Order.findOne({ orderId: orderIds, userId: userId });
   orderItems.isPaid=true;
if (orderItems) {
  orderItems.items = orderItems.items.map((item) => {
    return {
      ...item, 
      paymentStatus: "paid", // Update paymentStatus to "paid"
    };
  });

  await orderItems.save(); // Save the updated document
  console.log('Order items updated successfully');
} else {
  console.log('Order not found');
}

    
  
    // Create a new order using the modified items array
    console.log('orderItems in razor',orderItems)

    for (const item of orderItems.items) {
      await product.findByIdAndUpdate(item.productId._id, {
        $inc: { quantity: -item.quantity,productSold:+item.quantity },
      });
    }

    await orderItems.save();
    await cart.deleteOne({ userId: userId });

    res.status(201).json({ success: true, orderItems });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify payment." });
  }
};

//---------> function to generate orderid
function generateOrderId() {
  const prefix = "ORD";
  const timestamp = Date.now();
  const randomComponent = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${randomComponent}`;
}
//----------------------------------------------------------------->











