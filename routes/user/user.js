const express=require('express')
const router=express.Router();
const userController=require('../../controllers/user/userController')
const userProductcontroller=require('../../controllers/user/userProductController')
const {isUser}=require('../../middleware/user')
const passport = require('passport');
const userProfileController=require('../../controllers/user/userProfileController');
const cartController=require('../../controllers/user/cartController');
const checkoutController=require('../../controllers/user/checkoutController')
const orderController=require('../../controllers/user/orderController')
const walletController=require('../../controllers/user/walletControler')
const couponController=require('../../controllers/user/coupon controller');
const wishlistController=require('../../controllers/user/wishlistController');
const checkStockAvailability=require('../../middleware/checkStock')
  const { blockUser } = require('../../middleware/BlockUser'); 
const checkUser= require('../../middleware/checkuser')

router.use(checkUser.checkuser)

  router.use(blockUser)


router.get('/',userController.userHome)
router.get('/signup',userController.loadSignup)
router.post('/signup',userController.insertUser)
router.get('/logout',userController.getLogout)

router.post('/verifyOtp',userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)
router.get('/login',userController.loadLogin)
 router.post('/login',userController.userLogin)

    //---forget password--routes---//
 router.get('/forgot-password',userController.loadForgotPassword)
 router.post('/forgot-password',userController.sendPasswordResetOtp)
 router.post('/verify-ResetOtp',userController.verifyResetOtp)
 router.post('/resendPasswordResetOtp',userController.resendPasswordResetOtp)
 router.post('/resetPassword',userController.resetPassword)
 
 
 router.get('/home',isUser,userController.userHome)
 router.get('/products',userProductcontroller.allproducts)
 router.get('/products/:id',userProductcontroller.productList)


// Initiate Google Authentication
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] , prompt:'select_account'}));

//Callback route for Google to redirect to
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    // Successful authentication, redirect to the homepage or dashboard
    console.log(`user from google is ${req.user}`)
    req.session.user=req.user
    req.session.user_id = req.user._id
    res.redirect('/user/home');
  }
);



//---userProfile related routes--->
router.get('/userProfile',isUser,userProfileController.getUserProfile)
router.post('/userProfile',isUser,userProfileController.postUserprofile)

//----userAddressRoutes
router.get('/address',isUser,userProfileController.getUserAddress)
router.get('/addAddress',isUser,userProfileController.getAddAddress)
router.post('/addAddress',isUser,userProfileController.postGetAddress)
router.get('/editAddress/:id',isUser,userProfileController.getEdiAddress)
router.post('/editAddress/:id',isUser,userProfileController.postEditAddress)
router.post('/deleteAddress/:id', isUser,userProfileController.deleteAddress)


router.get('/changePassword',isUser,userProfileController.getChangePassword)
router.post('/changePassword',isUser,userProfileController.postChangepassword)

//------>user cart related routes

router.get('/cart',isUser,cartController.getCartPage)
router.post('/addCart',isUser,cartController.addToCart)
router.post('/updateCart/:itemId',isUser,cartController.updateQuantity)
router.delete('/deleteCart/:itemId',isUser,cartController.removeCartitems )

//----->check out related routes
router.get('/checkout',isUser,checkoutController.getCheckpoutPage)
router.post('/checkoutAddress',isUser,checkoutController.postCheckoutAddress)

router.post('/placeOrder',isUser,orderController.confirmOrder)
 router.get('/orderConfirmation',isUser, orderController.showConfirmationorder);

 router.get('/userOrders',isUser,orderController.getuserorder);
 router.get('/orderdetails/:id',isUser,orderController.getOrderdetails)
 router.post('/cancelOrder',isUser,orderController.cancelOrder);
 router.post('/returnOrder',isUser,orderController.returnOrder);


 router.post('/createRpayOrder',isUser,checkoutController.createRazorPayOrder)
 router.post('/verifyPayment',isUser,checkoutController.verifyPayment)
 router.post('/retryPayment',isUser,orderController.retryPayment)

 router.get('/wallet',isUser,walletController.getwallet)
 router.post('/applyCoupon',isUser,couponController.applyCoupon);
 router.get('/coupons',isUser,couponController.getCoupon);


 ///--------->wishlist controllers
router.post('/addWishlist',wishlistController.addToWishlist);
router.get('/wishlist',wishlistController.viewWishlist);
router.post('/removeWishlist',wishlistController.removeFromWishList);










module.exports = router