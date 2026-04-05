const { title } = require("process");
const Banner = require("../../model/bannerSchema");

const cloudinary = require("../../services/cloudinary");
const fs = require("fs");
const STATUS_CODES = require("../../constants/statusCodes");
const MESSAGES = require("../../constants/messages");

exports.getAddBanner = async (req, res) => {
  try {
   
    res.render("admin/adminAddBanner");
  } catch {
    
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.COMMON.INTERNAL_ERROR} );
  }
};

exports.addBanner = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ error: MESSAGES.BANNER.IMAGE_REQUIRED });
    }

    if (!title || !description) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ error: MESSAGES.BANNER.VALIDATION_ERROR });
    }

    const newBanner = new Banner({
      title,
      description,
      titleImages: req.file.path,
    });

    await newBanner.save();
    req.session.message=MESSAGES.BANNER.ADD_SUCCESS;
      res.redirect('/admin/bannerList')
    // res.status(200).json({ message: "banner added successfully" });
  } catch (error) {
  
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.BANNER.ADD_ERROR });
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
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: messages.BANNER.NOT_FOUND });
    }
    res.render("admin/adminBanner", { banners, messages, currentPage: page,
      totalPages: Math.ceil(totalBanners / limit),});
  } catch (error) {
    
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: MESSAGES.BANNER.LIST_ERROR });
  }
};

exports.deleteBanner=async(req,res)=>{
  try{
    const {id}=req.params;
    if(!id){
      return res.status(STATUS_CODES.BAD_REQUEST).json({error:MESSAGES.COMMON.ID_MISSING});

    }
   const banner =await Banner.findByIdAndDelete(id);
   if(!banner){
    return res.status(STATUS_CODES.NOT_FOUND).json({error:MESSAGES.BANNER.NOT_FOUND});
   }
    res.status(STATUS_CODES.OK).json({success:MESSAGES.BANNER.DELETE_SUCCESS});

  }catch(error){
   
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:MESSAGES.BANNER.DELETE_ERROR})
  }
}

exports.changeBannerStatus=async(req,res)=>{
  try{
    const{id}=req.params;

 
    const{status}=req.body
  
    if(!id){
           return res.status(STATUS_CODES.BAD_REQUEST).json({error:MESSAGES.COMMON.ID_MISSING});
    }
    const validStatus=[true,false];
    if(!validStatus.includes(status)){
      return res.status(STATUS_CODES.BAD_REQUEST).json({error:MESSAGES.BANNER.STATUS_VALUE_ERROR});
    }
    const banner=await Banner.findByIdAndUpdate(id,{status:status},{new:true});

    if(!banner){
      return res.status(STATUS_CODES.NOT_FOUND).json({error:MESSAGES.BANNER.NOT_FOUND});
    }
    res.status(STATUS_CODES.OK).json({success:MESSAGES.BANNER.STATUS_UPDATED})

  }catch(error){

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:MESSAGES.BANNER.STATUS_ERROR});
  }
}

exports.getBannerEditPage=async(req,res)=>{
  try{
    const{id}=req.params
    const banner=await Banner.findById(id);
   res.render('admin/adminEditBanner',{banner})
  }catch(error){
    
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:MESSAGES.BANNER.BANNER_EDIT_PAGE_ERROR});
  }
}

exports.postEditBanner=async(req,res)=>{
  try{
 const{id}=req.params;
 if(!id){
            return res.status(STATUS_CODES.BAD_REQUEST).json({error:MESSAGES.COMMON.ID_MISSING});
  
}
const { title, description } = req.body;
  if (!req.file || !req.file.path) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ error: MESSAGES.BANNER.IMAGE_REQUIRED });
  }

  if (!title || !description) {
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ error: MESSAGES.BANNER.VALIDATION_ERROR });
  }
  const banner=await Banner.findByIdAndUpdate(id,{
     title:title,
     description:description,
     titleImages: req.file.path,

  })
  if(!banner){
        return res.status(STATUS_CODES.NOT_FOUND).json({error:MESSAGES.BANNER.NOT_FOUND});
  }
  res.status(STATUS_CODES.OK).json({success:MESSAGES.BANNER.EDIT_SUCCESS});
 
  }catch(error){
   
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({error:MESSAGES.COMMON.INTERNAL_ERROR});

  }
}