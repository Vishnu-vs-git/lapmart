const product = require('../model/productSchema')
const cart = require('../model/cartSchema')

const isAdmin =(req,res,next) =>{
  if(req.session.admin) {
    console.log(req.session.admin)
    next()
  } else {
    res.redirect('/admin/login')
  }
}


module.exports ={
  isAdmin
}