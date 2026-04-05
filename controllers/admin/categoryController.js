const messages = require('../../constants/messages');
const CATEGORY_STATUS = require('../../constants/status');
const STATUS_CODES = require('../../constants/statusCodes');
const Category=require('../../model/categorySchema');


exports.adminCategorylist= async (req,res) => {
  try{
    const categories= await Category.find()
    res.render('admin/adminCategory',{categories})
  }catch(error){
    res.render('admin/adminCategory', { categories: [] })
  }
}


exports.getAddCategory= async (req,res)=>{
  try{
    res.render('admin/addCategory',{message:""})
  }catch(error){
    res.render('admin/addCategory', {
    message:messages.COMMON.INTERNAL_ERROR,
      type: "error"
    }
    )
 
}
}

 exports.postAddCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const formattedName = name.trim();
    
    // --------->Check if the name starts with a capital letter and others are lowercase
    if (!/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/.test(formattedName)) {
      return res.render('admin/addCategory', {
        message: { text: messages.CATEGORY.INVALID_FORMAT, type: 'error' }
      });
    }

    // ------->Check if it starts with a number
    if (/^\d/.test(formattedName)) {
      return res.render('admin/addCategory', {
        message: { text: messages.CATEGORY.STARTS_WITH_NUMBER, type: 'error' }
      });
    }

    // -------->Check if it has more than 10 words
    if (formattedName.split(' ').length > 10) {
      return res.render('admin/addCategory', {
        message: { text: messages.CATEGORY.TOO_LONG, type: 'error' }
      });
    }

    // ---------->Check for existing category
    const existingCategory = await Category.findOne({ name: formattedName });
    if (existingCategory) {
      return res.render('admin/addCategory', {
        message: { text: messages.CATEGORY.EXISTS, type: 'error' }
      });
    }

    //--------> Add new category
    const newCategory = new Category({ name: formattedName });
    await newCategory.save();
    const categories = await Category.find();
    req.flash('success',messages.CATEGORY.ADD_SUCCESS)
    res.redirect('/admin/categoryList')
   
  } catch (error) {
    return res.render('admin/addCategory', {
      message: { text: messages.CATEGORY.ADD_ERROR, type: 'error' }
    });
  }
};


 exports.getEditCategory=async(req,res)=>{
  try{
    const categoryId=req.params.id;
    const category= await Category.findById(categoryId);
   
    if(!category){
      return res.render('admin/adminCategory',{message:messages.CATEGORY.NOT_FOUND})
    }
    res.render('admin/editCategory',{category})

  }catch(error){
    res.render('admin/adminCategory',{message: messages.COMMON.INTERNAL_ERROR})
  }
 }

exports.postEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    let { name, status } = req.body;

    const formattedName = name.trim();
    const category = await Category.findById(categoryId);
    

    if (!/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/.test(formattedName)) {
      return res.render('admin/editCategory', {
        message: { text: messages.CATEGORY.INVALID_FORMAT, type: 'error'},category
      });
    }

    const existingCategory = await Category.findOne({ name: formattedName });
    if (existingCategory) {
      return res.render('admin/editCategory', {category,
        message: { text: messages.CATEGORY.EXISTS, type: 'error' }
      });
    }
   
    await Category.findByIdAndUpdate(categoryId, {
      name: formattedName,
      status: status === 'on' ? CATEGORY_STATUS.ACTIVE : CATEGORY_STATUS.INACTIVE
    });
     req.flash('success',messages.CATEGORY.UPDATE_SUCCESS)
    res.redirect('/admin/categoryList');
  } catch (error) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.CATEGORY.UPDATE_ERROR);
  }
};

exports.blockAndUnblockcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const action = req.params.action;
    const newStatus = action === 'block' ? CATEGORY_STATUS.INACTIVE : CATEGORY_STATUS.ACTIVE;
    
    await Category.findByIdAndUpdate(categoryId, { status: newStatus });
    req.flash('success',`category ${action}ed successfully`)
    res.redirect('/admin/categoryList');
  } catch (error) {  
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(messages.COMMON.INTERNAL_ERROR);
  }
};
exports.deletecategory =async(req,res)=>{
  try{
    const {id}=req.params;
   
    await Category.findByIdAndDelete(id);
    const categories=await Category.find()
    req.flash('success', messages.CATEGORY.DELETE_SUCCESS)
    res.redirect('/admin/categoryList')

  }catch(error){ 
    req.flash('error', messages.CATEGORY.DELETE_ERROR)
    res.redirect('/admin/categoryList')
  
  }
}
