const User=require('../../model/userSchema');
const Order=require('../../model/orderSchema');
const Product=require('../../model/productSchema');




//.......>getting admin order mangement page


exports.getOrderMangement=async(req,res)=>{
  try{

    const page = parseInt(req.query.page) || 1; 
    const limit = 8; 
    const skip = (page - 1) * limit; 

    

        
    const orders= await Order.find().populate('userId').populate('items.productId').skip(skip).limit(limit)
    if(!orders){
      return res.status(404).json({message:'orders not found'});
    }

    const totalOrders = await Order.countDocuments();
    console.log('total orders',totalOrders)
        const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/adminOrders',{orders,currentPage: page,totalPages: totalPages})
   
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
    
    res.render('admin/adminOrderdetails',{order})

  }catch(error){
      console.error('Something  error happened ',error)
      res.status(500).send('Internal server error')
  }
}
  
  
  
