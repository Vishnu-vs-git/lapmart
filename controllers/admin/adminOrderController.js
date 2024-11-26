const User=require('../../model/userSchema');
const Order=require('../../model/orderSchema');
const Product=require('../../model/productSchema');
const Wallet=require('../../model/walletSchema')



//.......>getting admin order mangement page


exports.getOrderMangement=async(req,res)=>{
  try{

    const page = parseInt(req.query.page) || 1; 
    const limit = 8; 
    const skip = (page - 1) * limit; 

    const message=req.session.message;
    delete req.session.message

        
    const orders= await Order.find().populate('userId').populate('items.productId').skip(skip).limit(limit)
    if(!orders){
      return res.status(404).json({message:'orders not found'});
    }

    const totalOrders = await Order.countDocuments();
    console.log('total orders',totalOrders)
        const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/adminOrders',{orders,currentPage: page,totalPages: totalPages,message})
   
  }catch(error){

  }
}
exports.changeOrderStatus=async(req,res)=>{
  const { orderId, productId, newStatus } = req.body;

  try {
    
      const order = await Order.findById(orderId);

      
      if (order) {
          const item = order.items.find(item => item.productId.equals(productId));

          if (item) {
             
              item.itemOrderStatus = newStatus;

             
              await order.save();

              
              return res.redirect('/admin/orders'); 
          } else {
             
            
              return res.redirect('/orders');
          }
      } else {
         
          return res.redirect('/orders');
      }
  } catch (error) {
      console.error(error);
     
      return res.redirect('/orders');
  }
};

exports.getOrderDetails=async(req,res)=>{
  try{
    const{orderId}=req.body;
    const order=await Order.findOne({orderId}).populate('items.productId').populate('userId')

    if(!order){
      return res.status(404).send('Order details not found');
    }
    
    res.render('admin/adminOrderDetails',{order})

  }catch(error){
      console.error('Something  error happened ',error)
      res.status(500).send('Internal server error')
  }
}

exports.acceptReturn = async (req, res) => {
  try {
    // const { orderId, productId } = req.body; 
    
    // const order = await Order.findById( orderId ).populate('items.productId').populate('userId');

    // if (!order) {
    //   return res.status(404).send('Order details not found');
    // }

    // //------->here  Find the specific product in the order's items array
    // const productItem = order.items.find(item => item.productId._id.toString() === productId);
    // console.log('productItem',productItem)

    // if (!productItem) {
    //   return res.status(404).send('Product not found in the order');
    // }


    // productItem.itemOrderStatus = 'returned';
    // productItem.productId.quantity+=productItem.quantity
    // productItem.paymentStatus = 'refunded';
    // console.log('p', productItem.productId.quantity);
    // console.log('pq',productItem.quantity);
    // console.log('productitem in accept return',productItem);
    // const productid=productItem.productId._id
    // const product=await Product.findById(productid);
    // product.quantity+=productItem.quantity;
    // await product.save();



    // await order.save();



    


const { orderId, productId,userId} = req.body;
console.log('orderId in return request',orderId)
if (!orderId || !productId||!userId ) {
  return res.status(400).json({ error: "Missing required fields" });
}

// Find the order
const orders = await Order.findById( orderId );
if (!orders) {
  return res.status(404).json({ error: "Order not found" });
}

// Find the item to cancel
const itemIndex = orders.items.findIndex(
  (item) => item.productId.toString() === productId
);

if (itemIndex === -1) {
  return res.status(404).json({ error: "No item found" });
}

const returnedItem = orders.items[itemIndex];
const { quantity, originalPrice } =returnedItem;
const originalTotal = quantity * originalPrice;

// Mark the item as canceled
returnedItem.itemOrderStatus = "returned";
orders.isPaid=false;
returnedItem.paymentStatus = "refunded";
orders.updatedAt = Date.now();
await orders.save();

// Update product stock
const product = await Product.findById(productId);
if (!product) {
  return res.status(404).json({ error: "Product not found" });
}
product.quantity += quantity;
product.productSold-=quantity;
await product.save();

// Calculate proportional refund
const totalProductPrice = orders.items.reduce(
  (sum, item) => sum + item.quantity * item.originalPrice,
  0
);
const couponDiscount = orders.couponDiscount || 0;
const tax = orders.tax || 0;

const proportionalCouponDiscount = Math.round((originalTotal / totalProductPrice) * couponDiscount);
const proportionalTax = Math.round((originalTotal / totalProductPrice) * tax);
const refundableAmount = orders.items[itemIndex].itemTotal - proportionalCouponDiscount + proportionalTax;
console.log("originalTotal:", originalTotal);
console.log("totalProductPrice:", totalProductPrice);
console.log("couponDiscount:", couponDiscount);
console.log("tax:", tax);
console.log("proportionalCouponDiscount:", proportionalCouponDiscount);
console.log("proportionalTax:", proportionalTax);

// Process refund for Razorpay or Wallet payment methods
if (["Razorpay", "Wallet",'Cash on Delivery'].includes(orders.paymentMethod)) {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    // Create a new wallet
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
    // Update existing wallet
    wallet.balance += refundableAmount;
    wallet.transaction.push({
      walletamount: refundableAmount,
      transactionType: "Credited",
      orderId,
      transactionDate: Date.now(),
    });
    await wallet.save();
  }




}
    req.session.message='Return request rejected'
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).render('user/servererror');
  }
};

  
exports.rejectReturn = async (req, res) => {
  try {
    const { orderId, productId } = req.body; 
    console.log('orderId',orderId)
    console.log('orderId',productId)
    const order = await Order.findById( orderId ).populate('items.productId').populate('userId');

    if (!order) {
      return res.status(404).send('Order details not found');
    }

    //------->here  Find the specific product in the order's items array
    const productItem = order.items.find(item => item.productId._id.toString() === productId);

    if (!productItem) {
      return res.status(404).send('Product not found in the order');
    }


    productItem.itemOrderStatus = 'return rejected';



    await order.save();

    req.session.message='Return request rejected'
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).render('user/servererror');
  }
};


  
 
  
  
