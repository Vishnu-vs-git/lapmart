
const User = require('../../model/userSchema')
const Address=require('../../model/addressSchema')


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
    console.log("error in login",error);
    
  }
}

exports.validateAdmin = async (req, res) => {
  console.log('Attempting login with:', req.body.email, req.body.password);
  
  if (req.body.email === process.env.ADMIN_EMAIL && req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true; 
    console.log('Admin session set:', req.session.admin); 
    return res.redirect('/admin/dashboard');
  } else {
    console.log('Invalid credentials');
    return res.render('admin/adminlogin', { error: 'Invalid email or password' });
  }
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
  console.log('startInddex',startIndex)
     
    // Fetch all users
    console.log('my new customer',customers)
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
    await User.findByIdAndUpdate(userId,{isBlocked:true,status:'Inactive'});
    res.redirect('/admin/customers')
  }catch(error){
    console.log(error.message);
    res.status(500).send('Error blocking user');
  }
}



//----unblocking User----//
exports.unBlockUser=async(req,res)=>{
  try{
    const userId=req.params.id;
    await User.findByIdAndUpdate(userId,{isBlocked:false,status:'Active'});
      res.redirect('/admin/customers')
    
  }catch(error){
    console.log(error.message);
    res.status(404).send('Error blocking user')
  }
} 
// Controller (adminController.js)
exports.removeCustomer = async (req, res) => {
  try {
 
    const customerId = req.params.id;
    const user = await User.findByIdAndDelete(customerId);

    



    res.render('admin/adminCustomer',{ customers: await User.find(),message:{ text: 'Customer removed successfully', type: 'success' }});
  } catch (error) {
  
    console.error(error);

    res.render('admin/adminCustomer',{ customers: await User.find(),message:{ text: 'something went wrong', type: 'error' }});
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