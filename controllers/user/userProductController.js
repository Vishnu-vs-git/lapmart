const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const Review = require("../../model/reviewSchema");


//.....> listing all products

exports.allproducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterByCategory = req.query.category || "";

    const totalProducts = await Product.countDocuments();
   

    const totalPages = Math.ceil(totalProducts / limit);

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "All Products", url: "#" },
    ];

    const { sort } = req.query;
    let sortCriteria;

    switch (sort) {
      // case "popularity":
      //   sortCriteria = { popularity: -1 };
      //   break;
      case "priceAsc":
        sortCriteria = { price: 1 };
        break;
      case "priceDesc":
        sortCriteria = { price: -1 };
        break;
      // case "rating":
      //   sortCriteria = { rating: -1 };
      //   break;
      case "featured":
        sortCriteria = { featured: -1 };
        break;
      case "newArrivals":
        sortCriteria = { createdAt: -1 };
        break;
      case "aToZ":
        sortCriteria = { name: 1 };
        break;
      case "zToA":
        sortCriteria = { name: -1 };
        break;
      default:
        sortCriteria = {}; // No sorting
        break;
    }

    const filterData = {};

    if (search) {
      const regex = RegExp(search, "i");
      filterData.name = regex;
    }
    if (filterByCategory) {
      filterData.category = filterByCategory;
    }

    const categories = await Category.find();

    const products = await Product.find(filterData)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit); // Assuming pagi

    res.render("user/allProducts", {
      products,
      breadcrumbs,
      currentPage: page,
      totalPages,
      categories,
      search,
      filterByCategory,
      
    });
  } catch (error) {
    console.error(error);
  }
};
// Controller for handling product search

exports.productList = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1️⃣ Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "All Products", url: "/user/products" },
      { name: product.name, url: "#" },
    ];

    // 2️⃣ Fetch related products
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId },
    }).limit(4);

    // 3️⃣ Fetch reviews
    const reviews = await Review.find({ productId })
      .populate("userId", "userName")
      .sort({ createdAt: -1 });

    // 4️⃣ Calculate rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    // 5️⃣ Send everything to view
    res.render("user/productlist", {
      product,
      relatedProducts,
      breadcrumbs,
      reviews,
      averageRating,
      totalReviews: reviews.length,
    });

  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).send("Server error");
  }
};


// exports.getProductdetails=async(req,res)=>{
//   try{
//     const{category}=req.params;

//   }
// }
