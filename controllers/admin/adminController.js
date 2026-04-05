
const User = require('../../model/userSchema')
const Address=require('../../model/addressSchema')
const messages = require('../../constants/messages')
const USER_STATUS = require('../../constants/status')
const STATUS_CODES = require('../../constants/statusCodes')


exports.loadLogin = async (req,res) => {
 if(req.session.admin) {
  res.redirect('/admin/dashboard')
 } else {
  res.render('admin/adminlogin')
 }
}

exports.getDashboard=async(req,res) => {
  try{
    res.render("admin/adminDashboard")
  } catch (error) {
    console.log(error);
    
  }
}

exports.validateAdmin = async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL.trim();
  const adminPassword = process.env.ADMIN_PASSWORD.trim();

  const inputEmail = req.body.email.trim();
  const inputPassword = req.body.password.trim();

  let error = "";

  if (inputEmail !== adminEmail && inputPassword !== adminPassword) {
    error = messages.AUTH.INVALID_BOTH;
  } else if (inputEmail !== adminEmail) {
    error = messages.AUTH.INVALID_EMAIL;
  } else if (inputPassword !== adminPassword) {
    error = messages.AUTH.INVALID_PASSWORD;
  }


  if (error) {
    return res.render('admin/adminlogin', { error });
  }

 
  req.session.admin = true;
  return res.redirect('/admin/dashboard');
};

//-----------------to show customers.......//

exports.loadCustomers = async (req,res) => {
  try {
    const page = parseInt(req.params.page);
    const limit=8;
    const skip=(page-1)*limit;
    const totalCustomer= await User.countDocuments();
    const totalPages= Math.ceil(totalCustomer / limit);
    let customers = await User.find().populate('address').skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
   
customers.forEach(customer => {
  console.log(`Customer ID: ${customer._id}, Address ID: ${customer.address}`);
});


  const startIndex=skip+1
  
    res.render('admin/adminCustomer',{customers,currentPage: page,
      totalPages: totalPages,startIndex }) 
  } catch (error) {
   console.log(error.message) 
  }
}


//------blocking User------//

exports.blockUser=async(req,res)=>{
  try{
    const userId=req.params.id;
    await User.findByIdAndUpdate(userId,{isBlocked:true,status:USER_STATUS.INACTIVE});
    res.redirect('/admin/customers')
  }catch(error){
    console.log(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.USER.BLOCK_ERROR);
  }
}



//----unblocking User----//
exports.unBlockUser=async(req,res)=>{
  try{
    const userId=req.params.id;
    await User.findByIdAndUpdate(userId,{isBlocked:false,status:USER_STATUS.ACTIVE});
      res.redirect('/admin/customers')
    
  }catch(error){
    console.log(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.USER.UNBLOCK_ERROR)
  }
} 

exports.removeCustomer = async (req, res) => {
  try {
 
    const customerId = req.params.id;
    const user = await User.findByIdAndDelete(customerId);

    res.render('admin/adminCustomer',{ customers: await User.find(),message:{ text: messages.USER.DELETE_SUCCESS, type: 'success' }});
  } catch (error) {
  
    console.error(error);

    res.render('admin/adminCustomer',{ customers: await User.find(),message:{ text: messages.COMMON.INTERNAL_ERROR, type: 'error' }});
  }
};


exports.getLogout=async (req,res) => {                                                   
  req.session.destroy((message)=>{
    if(message){
      console.log(message);
      
    }else{
      res.redirect('/admin/login')
    }
  })
}