const Product=require('../../model/productSchema');
const User=require('../../model/userSchema');
const Order=require('../../model/orderSchema');








exports.renderDashboardPage = (req, res) => {
  try {
      res.render('admin/admindash', { pageTitle: 'Admin Dashboard' });
  } catch (error) {
      console.error('Error rendering dashboard page:', error);
      res.status(500).send('Internal Server Error');
  }
};


exports.getDashboardController = async (req, res) => {
  try {
    const { filter } = req.query; // 'monthly', 'yearly', 'weekly', 'daily'
    const dateFilter = {};

    // Set date filter based on user input
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
        dateFilter.createdAt = { $gte: new Date(0) }; // default to 'yearly' filter
    }

    // Get total sales, orders, and customers based on the date filter
    const totalSales = await Order.aggregate([
      // Unwind the items array to work with individual items
      { $unwind: "$items" },
    
      // Match only items with paymentStatus as "paid"
      { $match: { "items.paymentStatus": "paid", ...dateFilter } },
    
      // Group to sum up itemTotal for all paid items
      {
        $group: {
          _id: null,
          total: { $sum: "$items.itemTotal" }, // Sum of itemTotal for paid items
        },
      },
    ]);
    
    // Compute total orders where at least one item is paid
    const totalOrders = await Order.countDocuments({
      ...dateFilter,
      "items.paymentStatus": "paid",
    });
    
    const totalCustomers = await User.countDocuments({
      createdAt: dateFilter.createdAt || new Date(0), // apply the date filter directly
    });

    // Best-selling products (based on order quantity)
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
      // Unwind the items array to work with individual items
      { $unwind: "$items" },
    
      // Match only items with paymentStatus as "paid"
      { $match: { "items.paymentStatus": "paid" } },
    
      // Lookup product details
      {
        $lookup: {
          from: "products", // Ensure your collection name for products is 'products'
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
    
      // Group by the category and calculate total revenue and total quantity sold
      {
        $group: {
          _id: "$productDetails.category", // Group by category
          totalRevenue: { $sum: "$items.itemTotal" }, // Sum up the itemTotal
          totalSold: { $sum: "$items.quantity" }, // Sum up the quantity sold
        },
      },
    
      // Sort categories by total revenue in descending order
      { $sort: { totalRevenue: -1 } },
    
      // Limit the result to top 10 categories
      { $limit: 10 },
    
      // Project the desired fields for response clarity
      {
        $project: {
          category: "$_id",
          totalRevenue: 1,
          totalSold: 1,
          _id: 0,
        },
      },
    ]);
console.log("best selling categry", bestSellingCategories);

    res.json({
      bestSellingProducts,
      bestSellingCategories,
      totalSales: totalSales[0]?.total || 0,
      totalOrders,
      totalCustomers,
      filter: filter || 'yearly',
    });
  } catch (error) {
    console.error('Error in adminDashboardController:', error);
    res.status(500).send('Internal Server Error');
  }
};
