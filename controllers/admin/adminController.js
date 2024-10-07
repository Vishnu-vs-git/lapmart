// router.get('/login',(req,res)=>{
//   res.render('adminlogin')
// })

exports.loadLogin = async (req,res) => {
  try {
  res.render('admin/adminlogin')
    
  } catch (error) {
    console.log(error.message)
  }
}
exports.validateAdmin = async(req,res) => {
try {
  if(req.body.email===process.env.ADMIN_EMAIL&&req.body.password==process.env.ADMIN_PASSWORD){
    res.render('admin/adminDashboard')
  }
} catch (error) {
  console.log(error.message)
}
}

//-----------------to show customers

exports.loadCustomers = async (req,res) => {
  try {
   res.render('admin/adminCustomer') 
  } catch (error) {
   console.log(error.message) 
  }
}