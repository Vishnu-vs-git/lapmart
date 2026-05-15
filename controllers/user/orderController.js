const User = require("../../model/userSchema");
const cart = require("../../model/cartSchema");
const Order = require("../../model/orderSchema");
const Address = require("../../model/addressSchema");
const product = require("../../model/productSchema");
const { overwriteMiddlewareResult } = require("mongoose");
const Wallet=require('../../model/walletSchema')
const Coupon=require('../../model/couponSchema')
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument=require('pdfkit');
const razorpayInstance = new Razorpay({
  key_id: process.env.YOUR_RAZORPAY_KEY_ID,
  key_secret: process.env.YOUR_RAZORPAY_SECRET_KEY,
});


exports.confirmOrder = async (req, res) => {
  try
   {
  
    const userId = req.session.user._id;


  const couponCode = req.session.appliedCoupon;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (coupon) {
   
      const userUsage = coupon.usageByUser.find((usage) => usage.userId.toString() === userId);
      if (userUsage) {
        userUsage.count += 1;
      } else {
        coupon.usageByUser.push({ userId, count: 1 });
      }

      coupon.usedCount += 1;
      await coupon.save();
    }

   
    delete req.session.appliedCoupon;
  }

    const user = await User.findById(userId);
  
    const { address, paymentMethod } = req.body;
    
    
 
      let paymentStatus=paymentMethod=="Cash on Delivery"?'pending':'paid';
  
    const cartItems = await cart
      .findOne({ userId: userId })
      .populate("items.productId");
   
      

    if (!cartItems || cartItems.length === 0 ) {
      return res
        .status(400)
        .json({ message: "Cart is empty. Cannot place order" });

    }
     
      if(paymentMethod==="Cash on Delivery"&&cartItems.grandTotal>1000){
        return res.status(400).json({success:false, message: "Cash on delivery is not available for orders morethan ₹1000" });
      }

   
      if (paymentMethod === "Wallet") {
        const walletDetails = await Wallet.findOne({ userId });
        if (!walletDetails) {
          return res.status(404).send("Wallet details not found");
        }
  
        if (walletDetails.balance < cartItems.grandTotal) {
          return res.status(400).json({success:false, message: "Insufficient wallet balance to place the order." });
        }
       
      }
  
      

    const orderItems = cartItems.items.map((item) => {
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.total,
        itemOrderStatus: "Pending", 
        paymentStatus:paymentStatus,
        originalPrice:item.originalPrice
      };
    });

    for (const item of orderItems) {
      await product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity,productSold: +item.quantity } }
      );
    }
       
    const orderId = generateOrderId();
  
    if( paymentMethod==='Wallet'){
      const  wallet = await Wallet.findOne({ userId });
       wallet.balance -=cartItems.grandTotal ;
       wallet.transaction.push({
         walletamount:cartItems.grandTotal ,
         transactionType: 'Debited',
         orderId: orderId,
         transactionDate: Date.now()
       });
       await wallet.save();
         
       }
       let status;
       if(paymentMethod==='Wallet'){
             status:true;
       }

      let adjustedTotal=cartItems.grandTotal-cartItems.tax-cartItems.couponDiscount;
      let taxRate=.18
      let taxAmount=adjustedTotal*taxRate;
      let finalAmount=adjustedTotal+taxAmount



  
    const newOrder = new Order({
      userId: userId,
      orderId: orderId,
      items: orderItems,
     

      shippingAddress: address,
      paymentMethod: req.body.paymentMethod,
      orderStatus: "Pending", 
      couponDiscount:cartItems.couponDiscount,
      totalDiscount:cartItems.totalDiscount,
      isPaid:status,
      subTotal:cartItems.subTotal,
      tax:taxAmount,
      totalAmount:finalAmount
    
     
    });


console.log('new order in ',newOrder)
  
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
    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    const { orderId, productId, reason } = req.body;
    if (!orderId || !productId || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orders = await Order.findOne({ orderId });
    if (!orders) {
      return res.status(404).json({ error: "Order not found" });
    }

   
    const itemIndex = orders.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "No item found" });
    }

    const canceledItem = orders.items[itemIndex];
    const { quantity, originalPrice } = canceledItem;
    const originalTotal = quantity * originalPrice;

  
    canceledItem.itemOrderStatus = "Cancelled";
    canceledItem.cancellationReason = reason;
    canceledItem.paymentStatus = "refunded";
    orders.updatedAt = Date.now();
    await orders.save();

    const Product = await product.findById(productId);
    if (!Product) {
      return res.status(404).json({ error: "Product not found" });
    }
    Product.quantity += quantity;
    Product.productSold-=quantity;
    await Product.save();

    const totalProductPrice = orders.items.reduce(
      (sum, item) => sum + item.quantity * item.originalPrice,
      0
    );
    const couponDiscount = orders.couponDiscount || 0;
    const tax = orders.tax || 0;

    const proportionalCouponDiscount = Math.round((originalTotal / totalProductPrice) * couponDiscount);
    const proportionalTax = Math.round((originalTotal / totalProductPrice) * tax);

    const refundableAmount = orders.items[itemIndex].itemTotal - proportionalCouponDiscount + proportionalTax;
    console.log('item total',orders.items[itemIndex].itemTotal)
    console.log("originalTotal:", originalTotal);
    console.log("totalProductPrice:", totalProductPrice);
    console.log("couponDiscount:", couponDiscount);
    console.log("tax:", tax);
    console.log("proportionalCouponDiscount:", proportionalCouponDiscount);
    console.log("proportionalTax:", proportionalTax);
    
  
    if (["Razorpay", "Wallet"].includes(orders.paymentMethod)) {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
       
        wallet = new Wallet({
          userId,
          balance: refundableAmount,
          transaction: [
            {
              walletamount: refundableAmount,
              transactionType: "Credited",
              orderId,
              transactionDate: Date.now(),
            },
          ],
        });
        await wallet.save();
      } else {
       
        wallet.balance += refundableAmount;
        wallet.transaction.push({
          walletamount: refundableAmount,
          transactionType: "Credited",
          orderId,
          transactionDate: Date.now(),
        });
        await wallet.save();
      }

      console.log("Wallet credited with refund amount:", refundableAmount);
    }

    res.status(200).json({
      success: true,
      message: "Order item cancelled successfully",
      refundableAmount,
    });
  } catch (error) {
    console.error("Error in canceling item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




exports.returnOrder = async (req, res) => {
  try {
    const userId = req.session.user._id; 
    if (!userId) {
      return res.status(400).json({ error: "User ID not found in session" });
    }

    const { orderId, productId, reason } = req.body;
    if (!orderId || !productId || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }


    const orders = await Order.findOne({ orderId });
    if (!orders) {
      return res.status(404).json({ error: "Order not found" });
    }

   
    const itemIndex = orders.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "No item found" });
    }

    const returnedItem = orders.items[itemIndex];
    const { quantity, originalPrice } = returnedItem;
    const originalTotal = quantity * originalPrice;

    
    returnedItem.itemOrderStatus = "return requested";
    returnedItem. returnReason = reason;
 
    orders.updatedAt = Date.now();
    await orders.save();


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

exports.retryPayment = async (req, res) => {
  try {
      const { orderId } = req.body;

    
      const order = await Order.findOne({ orderId });
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found or already paid' });
      }

      const orderOptions = {
          amount: order.totalAmount * 100, 
          currency: "INR",
          receipt: "retry_" + orderId,
      };

      const newRazorpayOrder = await razorpayInstance.orders.create(orderOptions);
      console.log("Retry order created:", newRazorpayOrder);

      res.json({ success: true, razorpayOrder: newRazorpayOrder });
  } catch (error) {
      console.error("Error during retryPayment:", error);
      res.status(500).json({ success: false, message: "Failed to create retry payment." });
  }
};


exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId }).populate('items.productId');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const doc = new PDFDocument();

    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice-${orderId}.pdf`
    );

    doc.pipe(res);

    
    doc
      .fontSize(20)
      .text('LapMart', 160, 50)
      .fontSize(10)
      .text('Digital LapMart Store', 160, 70)
      .moveDown();

   
    doc
      .fontSize(20)
      .text('INVOICE', { align: 'center' })
      .moveDown();

   
    doc
      .fontSize(12)
      .text(`Order ID: ${order.orderId}`)
      .text(`User ID: ${order.userId}`)
      .text(`Payment Method: ${order.paymentMethod}`)
      .text(`Date: ${order.createdAt.toDateString()}`)
      .moveDown();

    
    const address = order.shippingAddress;
    doc
      .fontSize(14)
      .text('Shipping Address:')
      .fontSize(12)
      .text(`${address.addressLine1}`);
    if (address.addressLine2) {
      doc.text(`${address.addressLine2}`);
    }
    doc
      .text(`${address.street}`)
      .text(`${address.city}, ${address.state} - ${address.zipCode}`)
      .text(`${address.country}`)
      .text(`Phone: ${address.phoneNo}`)
      .moveDown();

   
    doc
      .fontSize(14)
      .text('Order Items:')
      .moveDown()
      .fontSize(12);

    const tableTop = doc.y; 
    const itemWidth = 200; 
    const quantityWidth = 70; 
    const priceWidth = 80; 
    const totalWidth = 100;
    const rowHeight = 20; 

  
    doc
      .fontSize(12)
      .text('Product Name', 50, tableTop)
      .text('Quantity', 50 + itemWidth, tableTop)
      .text('Price (\u20B9)', 50 + itemWidth + quantityWidth, tableTop)
      .text('Total (\u20B9)', 50 + itemWidth + quantityWidth + priceWidth, tableTop);

   
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(50 + itemWidth + quantityWidth + priceWidth + totalWidth, tableTop + 15)
      .stroke();

   
    let currentY = tableTop + 25;
    order.items.forEach((item) => {
      doc
        .fontSize(10)
        .text(item.productId.name, 50, currentY, { width: itemWidth, ellipsis: true })
        .text(item.quantity.toString(), 50 + itemWidth, currentY, { width: quantityWidth, align: 'center' })
        .text(`\u20B9${item.price.toFixed(2)}`, 50 + itemWidth + quantityWidth, currentY, { width: priceWidth, align: 'right' })
        .text(`\u20B9${item.itemTotal.toFixed(2)}`, 50 + itemWidth + quantityWidth + priceWidth, currentY, { width: totalWidth, align: 'right' });

      currentY += rowHeight; 
    });

   
    currentY += 10; 
    doc
      .fontSize(10)
      .text(`Subtotal: \u20B9${order.subTotal.toFixed(2)}`, 50 + itemWidth + quantityWidth + priceWidth, currentY, { width: totalWidth, align: 'right' })
      .text(`Tax: \u20B9${order.tax ? order.tax.toFixed(2) : '0.00'}`, 50 + itemWidth + quantityWidth + priceWidth, currentY + 20, { width: totalWidth, align: 'right' })
      .text(`Discount: \u20B9${order.totalDiscount ? order.totalDiscount.toFixed(2) : '0.00'}`, 50 + itemWidth + quantityWidth + priceWidth, currentY + 40, { width: totalWidth, align: 'right' })
      .text(`Total Amount: \u20B9${order.totalAmount.toFixed(2)}`, 50 + itemWidth + quantityWidth + priceWidth, currentY + 60, { width: totalWidth, align: 'right' });

  
    doc
      .moveDown()
      .text('Thank you for shopping with LapMart!', { align: 'center' })
      .text('For any queries, please contact support@lapmart.com', { align: 'center' });


    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};
