const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/admin/adminController");
const categoryController = require("../../controllers/admin/categoryController");
const productController = require("../../controllers/admin/productController");
const { isAdmin } = require("../../middleware/admin");
const adminOrderController = require("../../controllers/admin/adminOrderController");
const adminCouponController = require("../../controllers/admin/adminCouponController");
const adminofferController = require("../../controllers/admin/adminOfferController");
const salesReportController = require("../../controllers/admin/salesReport controller");
const validateDates = require("../../middleware/dateValidation");
const adminDashboardController = require("../../controllers/admin/adminDashboardController");
const adminBannerController = require("../../controllers/admin/adminBannerController");
const multer = require("multer");
const upload = multer();

const { storage } = require("../../services/cloudinary");
const bannerUpload = multer({ storage });

router.get("/login", adminController.loadLogin);
router.post("/login", adminController.validateAdmin);
router.get("/dashboard", isAdmin, adminDashboardController.renderDashboardPage);
router.get(
  "/dashboardData",
  isAdmin,
  adminDashboardController.getDashboardController
);
router.get("/customers", isAdmin, adminController.loadCustomers);
router.get("/logout", adminController.getLogout);

router.get("/blockUser/:id", isAdmin, adminController.blockUser);
router.get("/unBlockUser/:id", isAdmin, adminController.unBlockUser);

router.get("/removeUser/:id", isAdmin, adminController.removeCustomer);

router.get("/categoryList", isAdmin, categoryController.adminCategorylist);
router.get("/addCategory", isAdmin, categoryController.getAddCategory);
router.post("/addCategory", isAdmin, categoryController.postAddCategory);

router.get("/editCategory/:id", isAdmin, categoryController.getEditCategory);
router.post("/editCategory/:id", isAdmin, categoryController.postEditCategory);

router.get(
  "/categoryList/:action/:id",
  isAdmin,
  categoryController.blockAndUnblockcategory
);
router.get("/categoryDelete/:id", isAdmin, categoryController.deletecategory);

router.get("/Products", isAdmin, productController.getProducts);
router.get("/addProduct", isAdmin, productController.getAddproduct);
router.post("/addProduct", isAdmin, productController.postAddProduct);
router.get("/deleteProduct/:id", isAdmin, productController.deleteProduct);
router.get("/editProduct/:id", isAdmin, productController.getEditProduct);
router.post("/editProduct/:id", isAdmin, productController.postEditProduct);

router.get("/Product/inactive/:id", isAdmin, productController.blockProduct);
router.get("/Product/active/:id", isAdmin, productController.unBlockProduct);
router.post("/removeImage", isAdmin, productController.removeImage);

router.get("/orders", isAdmin, adminOrderController.getOrderMangement);
router.post(
  "/changeOrderstatus",
  isAdmin,
  adminOrderController.changeOrderStatus
);

router.post("/orderdetails", isAdmin, adminOrderController.getOrderDetails);
router.post("/acceptReturn", isAdmin, adminOrderController.acceptReturn);
router.post("/rejectReturn", isAdmin, adminOrderController.rejectReturn);

router.get("/coupons", isAdmin, adminCouponController.getCoupons);
router.post(
  "/coupons",
  isAdmin,
  upload.none(),
  adminCouponController.postAddCoupon
);
router.get("/addCoupon", isAdmin, adminCouponController.loadAddCoupon);
router.post("/couponstatusblock", isAdmin, adminCouponController.blockCoupon);
router.post(
  "/couponstatusUnblock",
  isAdmin,
  adminCouponController.UnblockCoupon
);
router.post("/removeCoupon", isAdmin, adminCouponController.removeCoupon);
router.get("/editCoupon/:id", isAdmin, adminCouponController.getEditCoupon);
router.post("/updateCoupon/:id", isAdmin, adminCouponController.postEditCoupon);

router.get("/offers", isAdmin, adminofferController.getOffers);
router.post("/addOffer", isAdmin, adminofferController.addOffer);
router.delete('/deleteOffer/:offerId',isAdmin,adminofferController.deleteOffer)
router.patch('/changeOfferstatus/:offerId',isAdmin,adminofferController.changeOfferStatus);
router.get('/editOffer/:offerId',isAdmin,adminofferController.getEditOffer)
router.post('/editOffer/:offerId',isAdmin,adminofferController.postEditOffer)

//------> sales report basedrouter.get('/sales-report', isAdmin, salesReportController.getSalesReport);
router.get("/salesReport", isAdmin, salesReportController.getSalesReport);
router.get("/sales-report/pdf", salesReportController.downloadSalesReportPDF);
router.get(
  "/sales-report/excel",
  salesReportController.downloadSalesReportExcel
);
                  
router.use("/sales-report/pdf", validateDates);
router.use("/sales-report/excel", validateDates);

//-----> banner related routes

router.get("/bannerList", isAdmin, adminBannerController.listBanner);

router.post(
  "/addBanner",
  isAdmin,
  bannerUpload.single("banner"),
  adminBannerController.addBanner
);

router.get("/addBanner", isAdmin, adminBannerController.getAddBanner);
router.delete('/deleteBanner/:id',isAdmin,adminBannerController.deleteBanner)
router.patch('/ChangeBannerStatus/:id',isAdmin,adminBannerController.changeBannerStatus)
router.get('/editBanner/:id',isAdmin,adminBannerController.getBannerEditPage)
router.post('/editBanner/:id',isAdmin, bannerUpload.single("banner"),adminBannerController.postEditBanner)

module.exports = router;
