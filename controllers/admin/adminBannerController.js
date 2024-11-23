const { title } = require("process");
const Banner = require("../../model/bannerSchema");

const cloudinary = require("../../services/cloudinary");
const fs = require("fs");

exports.getAddBanner = async (req, res) => {
  try {
    console.log("hello admin");
    res.render("admin/adminAddBanner");
  } catch {
    console.error("error in getting add banner page", error);
    res.status(500).json({ error: "something error happened"} );
  }
};

exports.addBanner = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(404).json({ error: "No image file uploaded" });
    }

    if (!title || !description) {
      return res
        .status(404)
        .json({ error: "Title and description is required." });
    }

    const newBanner = new Banner({
      title,
      description,
      titleImages: req.file.path,
    });

    await newBanner.save();
    req.session.message="Banner added successfully"
      res.redirect('/admin/bannerList')
    // res.status(200).json({ message: "banner added successfully" });
  } catch (error) {
    console.error("Error in adding banner", error);
    res.status(500).json({ error: "error in adding banner" });
  }
};

//----> here we list the banner

exports.listBanner = async (req, res) => {
  try {
  const messages=req.session.message||""
  delete req.session.message;

  const page=  req.query.page;
  const limit=5;
  const skip=(page-1)*limit;
  const totalBanners=await Banner.countDocuments();
   


    const banners =await Banner.find().skip(skip).limit(limit)

    if (!banners) {
      return res.status(404).json({ error: "banners not found" });
    }
    res.render("admin/adminBanner", { banners, messages, currentPage: page,
      totalPages: Math.ceil(totalBanners / limit),});
  } catch (error) {
    console.error("error in listing banner", error);
    res.status(500).json({ error: "error in listing banner" });
  }
};

exports.deleteBanner=async(req,res)=>{
  try{
    const {id}=req.params;
    if(!id){
      return res.status(404).json({error:"id not found"});

    }
   const banner =await Banner.findByIdAndDelete(id);
   if(!banner){
    return res.status(404).json({error:"banner  not found"});
   }
    res.status(200).json({success:"banner deleted successfully"})

  }catch(error){
    console.error('error in deleting banner')
    res.status(500).json({error:'error in deleting message'})
  }
}

exports.changeBannerStatus=async(req,res)=>{
  try{
    const{id}=req.params;

 
    const{status}=req.body
  
    if(!id){
      return res.status(400).json({error:"Id  is missing"})
    }
    const validStatus=[true,false];
    if(!validStatus.includes(status)){
      return res.status(400).json({error:'invalid status value'})
    }
    const banner=await Banner.findByIdAndUpdate(id,{status:status},{new:true});

    if(!banner){
      return res.status(404).json({error:'banner not found'})
    }
    res.status(200).json({success:'Status changed successfully'})

  }catch(error){
    console.error('An error occured while changing the banner Status',error);
    res.status(500).json({error:'Error in changing the status'})
  }
}

exports.getBannerEditPage=async(req,res)=>{
  try{
    const{id}=req.params
    const banner=await Banner.findById(id);
   res.render('admin/adminEditBanner',{banner})
  }catch(error){
      console.error('error in getting edit page',error);
      res.status(500).json({error:"Error in getting edit page"})
  }
}

exports.postEditBanner=async(req,res)=>{
  try{
 const{id}=req.params;
 if(!id){
  return res.status(400).json({error:"id not found"});
  
}
const { title, description } = req.body;
  if (!req.file || !req.file.path) {
    return res.status(404).json({ error: "No image file uploaded" });
  }

  if (!title || !description) {
    return res
      .status(404)
      .json({ error: "Title and description is required." });
  }
  const banner=await Banner.findByIdAndUpdate(id,{
     title:title,
     description:description,
     titleImages: req.file.path,

  })
  if(!banner){
   return  res.status(404).json({error:'Banner not found'})
  }
  res.status(200).json({success:'Banner edited successfully'})
 
  }catch(error){
    console.error('error in editing banner',error);
    res.status(500).json({error:'internal server error'})

  }
}