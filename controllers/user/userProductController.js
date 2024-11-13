const Product = require("../../model/productSchema");

//.....> listing all products

exports.allproducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();

    const totalPages = Math.ceil(totalProducts / limit);

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "All Products", url: "#" },
    ];

    const { sort } = req.query;
    console.log(req.query);
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

    

    const { filter } = req.query;

    const filterData = filter ? { category: filter } : {};
    console.log(filterData);

    const products = await Product.find(filterData)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit); // Assuming pagi

    res.render("user/allProducts", {
      products,
      breadcrumbs,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
  }
};
exports.productList = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "All Products", url: "/user/products" },
      { name: product.name, url: "#" },
    ];

    //--------> feting product details
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId },
    }).limit(4);
    res.render("user/productlist", { product, relatedProducts, breadcrumbs });
  } catch (error) {
    console.error("error in fetching product category", error);
    res.status(500).send("server error");
  }
};
