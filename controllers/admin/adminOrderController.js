const User=require('../../model/userSchema');
const Order=require('../../model/orderSchema');
const Product=require('../../model/productSchema');
const Wallet=require('../../model/walletSchema');
const STATUS_CODES = require('../../constants/statusCodes');
const messages = require('../../constants/messages');


exports.getOrderMangement=async(req,res)=>{
  try{

    const page = parseInt(req.query.page) || 1; 
    const limit = 8; 
    const skip = (page - 1) * limit; 

    const message=req.session.message;
    delete req.session.message

        
    const orders= await Order.find().populate('userId').populate('items.productId').skip(skip).limit(limit)
    if(!orders){
      return res.status(STATUS_CODES.NOT_FOUND).json({message: messages.ORDER.NOT_FOUND});
    }

    const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/adminOrders',{orders,currentPage: page,totalPages: totalPages,message})
   
  }catch(error){
     return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render('admin/adminOrders', {
    orders: [],
    currentPage: 1,
    totalPages: 1,
    message: {
      text: messages.COMMON.INTERNAL_ERROR,
      type: "error"
    }
  });
  }
}
exports.changeOrderStatus = async (req,res) => {
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
      return res.redirect('/orders');
  }
};

exports.getOrderDetails=async(req,res)=>{
  try{
    const{orderId}=req.body;
    const order=await Order.findOne({orderId}).populate('items.productId').populate('userId')

    if(!order){
      return res.status(STATUS_CODES.NOT_FOUND).send(messages.ORDER.DETAILS_NOT_FOUND);
    } 
    res.render('admin/adminOrderDetails',{order})

  }catch(error){   
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.COMMON.INTERNAL_ERROR);
  }
}

exports.acceptReturn = async (req, res) => {

  try {
const { orderId, productId,userId} = req.body;

if (!orderId || !productId||!userId ) {
  return res.status(STATUS_CODES.BAD_REQUEST).json({ error: messages.ORDER.MISSING_FIELDS  });
}

const orders = await Order.findById( orderId );
if (!orders) {
  return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.ORDER.NOT_FOUND });
}

const itemIndex = orders.items.findIndex(
  (item) => item.productId.toString() === productId
);

if (itemIndex === -1) {
  return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.ORDER.ITEM_NOT_FOUND });
}

const returnedItem = orders.items[itemIndex];
const { quantity, originalPrice } =returnedItem;
const originalTotal = quantity * originalPrice;


returnedItem.itemOrderStatus = "returned";
orders.isPaid=false;
returnedItem.paymentStatus = "refunded";
orders.updatedAt = Date.now();
await orders.save();

const product = await Product.findById(productId);
if (!product) {
  return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.PRODUCT.NOT_FOUND });
}
product.quantity += quantity;
product.productSold-=quantity;
await product.save();


const totalProductPrice = orders.items.reduce(
  (sum, item) => sum + item.quantity * item.originalPrice,
  0
);
const couponDiscount = orders.couponDiscount || 0;
const tax = orders.tax || 0;

const proportionalCouponDiscount = Math.round((originalTotal / totalProductPrice) * couponDiscount);
const proportionalTax = Math.round((originalTotal / totalProductPrice) * tax);
const refundableAmount = orders.items[itemIndex].itemTotal - proportionalCouponDiscount + proportionalTax;


if (["Razorpay", "Wallet",'Cash on Delivery'].includes(orders.paymentMethod)) {
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
     
      orderId,
      transactionDate: Date.now(),
    });
    await wallet.save();
  }

}
    req.session.message= messages.ORDER.RETURN_ACCEPTED;
    res.redirect('/admin/orders');
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render('user/servererror');
  }
};

  
exports.rejectReturn = async (req, res) => {
  try {
    const { orderId, productId } = req.body; 
    const order = await Order.findById( orderId ).populate('items.productId').populate('userId');

    if (!order) {
      return res.status(STATUS_CODES.NOT_FOUND).send(messages.ORDER.DETAILS_NOT_FOUND);
    }

    const productItem = order.items.find(item => item.productId._id.toString() === productId);

    if (!productItem) {
      return res.status(STATUS_CODES.NOT_FOUND).send(messages.ORDER.PRODUCT_NOT_FOUND);
    }
    productItem.itemOrderStatus = 'return rejected';
    await order.save();

    req.session.message= messages.ORDER.RETURN_REJECTED;
    res.redirect('/admin/orders');
  } catch (error) {   
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render('user/servererror');
  }
};


  
 
  
  
