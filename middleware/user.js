const isUser=(req,res,next)=>{
  console.log('is user route reached')

if(req.session.user){
  console.log(req.session.user)
  next()
}else{
  res.redirect('/login')
}
}
module.exports={
  isUser
}