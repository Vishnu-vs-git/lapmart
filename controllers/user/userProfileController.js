const User = require('../../model/userSchema');
const Address=require('../../model/addressSchema');
const bcrypt = require("bcrypt");

// Render user profile
exports.getUserProfile = async (req, res) => {
   if (!req.session.user) {
      console.log("Session user is missing, redirecting to login");
      return res.redirect('/user/login');
   }
   
   try {
      const userId = req.session.user._id;
      const user = await User.findById(userId);

      if (!user) {
         console.log("User not found in the database");
         return res.status(404).send('User not found');
      }

      const { userName, phone, email } = user;
      return res.render('user/userProfile', { userName, phone, email });
   } catch (error) {
      console.error('An error occurred:', error);
      return res.status(500).send('Internal Server Error');
   }
};


exports.postUserprofile= async(req,res)=>{
   console.log('post user route reache')
   if(req.session.user){
      const userId=req.session.user._id;
      try{
           const {userName,phone}=req.body;
           await User.findByIdAndUpdate(userId,{userName,phone});
           res.redirect('/user/userProfile')

      }catch(error){
         console.error('something error happened',error);
         res.render('user/userProfile')
      }
   }else{
      res.status(404).send('User not found')
   }
}

exports.getUserAddress =async(req,res)=>{
   try{
      
 

       const userId= req.session.user_id;
       const user = await User.findById(userId).populate('address')
      // const addresses= await Address.find({userId})
      
      res.render('user/userAddress',{user});
   }catch(error){
      console.error('Something error happened',error);
      res.redirect('/user/address')
   }
   
};
//----->getting add addresss page
exports.getAddAddress=async(req,res)=>{
    try{
      const userId=req.session.user_id;

      const user=await User.findById(userId).populate('address')
   
      res.render('user/addAddress',{user})

    }catch(error){
      console.error('Error in getting page',error);
      res.redirect('/user/address')

    }
}
exports.postGetAddress=async(req,res)=>{
   try{
    
       const userId=req.session.user_id;

       const{addressLine1,addressLine2,street,state,country,zipCode,phoneNo,userName,city}=req.body;
       const saveUser=async()=>{
         const address= new Address({
           
            addressLine1,
            addressLine2,
            street,
            state,
            country,
            zipCode,
            phoneNo,
            city,
            User:userId,
             userName

         })
         
        const savedAddress=await address.save();
        await User.findByIdAndUpdate(userId,{$push:{address:savedAddress._id}})
       }
       saveUser();
       res.redirect('/user/userProfile')

   }catch(error){
      console.error('Error in adding address',error);
      res.redirect('/user/addAddress')

   }  
}

//--------->get edit page
exports.getEdiAddress=async(req,res)=>{
   try{
     const addressId=req.params.id;
     const userId=req.session.user._id;
  
  
     const address=await Address.findOne({_id:addressId,User:userId})
       if(!address){
         return res.status(404).send('Address Not found')
       }
     res.render('user/userEditAddress',{address})

   }catch(error){
      console.error('Error in updating address',error);
      res.status(500).send('something error happened')

   }
}
exports.postEditAddress=async(req,res)=>{
   try{
      console.log('this is user post edit page')
      const addressId=req.params.id;
      const userId=req.session.user._id;

      const{addressLine1,addressLine2,street,state,country,zipCode,phoneNo,userName,city}=req.body;
     const address= await Address.findByIdAndUpdate({_id:addressId,User:userId}, {
         addressLine1,addressLine2,street,state,country,zipCode,userName,city,phoneNo
      })
      console.log('my updated address',address)
      if(!address){
         res.status(404).send('Address not found');
      }

      res.redirect('/user/address');

     

   
   }catch(error){;

      console.error('Error in updating address',error) ;
      res.status(500).send('something error Happened');
}
}
exports.deleteAddress=async(req,res)=>{
   try{
      const addressid=req.params.id;
      const userid=req.session.user._id;
      await Address.findByIdAndDelete({_id:addressid,User:userid})
      res.redirect('/user/address')
   }catch(error){

      console.error('Error in deleting address',error);
      res.status(500).send('Something went wrong')
   }
}

//-------------->rendering changing password page

exports.getChangePassword = async(req,res)=>{
   try{
      const message=(req.session.message)
      const messages=(req.session.messages)
      delete req.session.message;
      delete req.session.messages
      res.render('user/userPasswordChange',{message,messages})
   }catch(error){
      console.error('Error in changing password',error);
    res.status(500).send('Some errors happened')
   }
}

//-------------------->post change pass word

exports.postChangepassword=async(req,res)=>{
   try{
      const userId=req.session.user._id;
      const{password,newPassword,confirmPassword}=req.body;
      const user=await User.findById(userId);
      const userPassword=user.password;
     const match=await bcrypt.compare(password,userPassword);
     console.log('the match vakue is',match)

     if(!match){
      req.session.message={type:'error',text:'Your current pasword is not matching'};
      return res.redirect('/user/changePassword')
     }
      
      
      
      
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

      if (!passwordRegex.test(newPassword)) {
             req.session.message={type:'error',text:'Password must contain one uppercase one lowerCase and one special charactor'};
             return res.redirect('/user/changePassword')
    
  }
  if(newPassword!==confirmPassword){
     req.session.message={type:'error',text:'newPassword and confirm password do not match'};
     return res.redirect('/user/changePassword');
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  console.log('hashed  password',hashedPassword)
  await user.save();
  req.session.messages={type:'success',text:'Password changed successfully'}
return res.redirect('/user/changePassword')
  

   }catch(error){
      console.log('something error happened ',error);
      res.status(500).send('Something error happened')

      
   }
}





