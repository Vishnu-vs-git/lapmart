const Product=require('../../model/productSchema');
const User=require('../../model/userSchema');
const Order=require('../../model/orderSchema');
const STATUS_CODES = require('../../constants/statusCodes');
const messages = require('../../constants/messages');








exports.renderDashboardPage = (req, res) => {
  try {
      res.render('admin/admindash', { pageTitle: 'Admin Dashboard' });
  } catch (error) {
      
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.COMMON.INTERNAL_ERROR);
  }
};


exports.getDashboardController = async (req, res) => {
  try {
    const { filter } = req.query; 
    const dateFilter = {};

    
    switch (filter) {
      case 'monthly':
        const startOfMonth = new Date(new Date().setDate(1));
        dateFilter.createdAt = { $gte: startOfMonth };
        break;
      case 'yearly':
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        dateFilter.createdAt = { $gte: startOfYear };
        break;
      case 'weekly':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        dateFilter.createdAt = { $gte: startOfWeek };
        break;
      case 'daily':
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter.createdAt = { $gte: startOfDay };
        break;
      default:
        dateFilter.createdAt = { $gte: new Date(0) }; 
    }

  
    const totalSales = await Order.aggregate([
    
      { $unwind: "$items" },
    
    
      { $match: { "items.paymentStatus": "paid", ...dateFilter } },
    
      
      {
        $group: {
          _id: null,
          total: { $sum: "$items.itemTotal" }, 
        },
      },
    ]);
    
    
    const totalOrders = await Order.countDocuments({
      ...dateFilter,
      "items.paymentStatus": "paid",
    });
    
    const totalCustomers = await User.countDocuments({
      createdAt: dateFilter.createdAt || new Date(0), 
    });

  
    const bestSellingProducts = await Product.aggregate([
      { $match: { productSold: { $gt: 0 } } },
      { $sort: { productSold: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          totalSold: '$productSold',
          totalRevenue: {
            $multiply: [
              { $cond: [{ $ifNull: ['$finalPrice', false] }, '$finalPrice', '$price'] },
              '$productSold'
            ],
          },
        },
      },
    ]);
    

    const bestSellingCategories = await Order.aggregate([
      
      { $unwind: "$items" },
    
     
      { $match: { "items.paymentStatus": "paid" } },
    
     
      {
        $lookup: {
          from: "products", 
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
    
     
      {
        $group: {
          _id: "$productDetails.category", 
          totalRevenue: { $sum: "$items.itemTotal" }, 
          totalSold: { $sum: "$items.quantity" }, 
        },
      },
    
      { $sort: { totalRevenue: -1 } },
    
      
      { $limit: 10 },
    
      
      {
        $project: {
          category: "$_id",
          totalRevenue: 1,
          totalSold: 1,
          _id: 0,
        },
      },
    ]);


    res.json({
      bestSellingProducts,
      bestSellingCategories,
      totalSales: totalSales[0]?.total || 0,
      totalOrders,
      totalCustomers,
      filter: filter || 'yearly',
    });
  } catch (error) {
    
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.COMMON.INTERNAL_ERROR);
  }
};
