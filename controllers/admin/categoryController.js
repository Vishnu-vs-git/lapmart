const Category=require('../../model/categorySchema');

//---listingCAtegory---//
exports.adminCategorylist=async(req,res)=>{
  try{
    const categories= await Category.find()
    res.render('admin/adminCategory',{categories})
  }catch(error){
    console.log(error)
    res.render('admin/adminCategory', { categories: [] })
  }
}


//--addingcategory--//
exports.getAddCategory= async(req,res)=>{
  try{
    res.render('admin/addCategory',{message:""})
  }catch(error){
    console.log(error)
  }
}
 //--postAddCategory--//
 exports.postAddCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Trim whitespace and validate name format
    const formattedName = name.trim();
    
    // --------->Check if the name starts with a capital letter and others are lowercase
    if (!/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/.test(formattedName)) {
      return res.render('admin/addCategory', {
        message: { text: 'Each word in the category name must start with a capital letter!', type: 'error' }
      });
    }

    // ------->Check if it starts with a number
    if (/^\d/.test(formattedName)) {
      return res.render('admin/addCategory', {
        message: { text: 'Category name cannot start with a number!', type: 'error' }
      });
    }

    // -------->Check if it has more than 10 words
    if (formattedName.split(' ').length > 10) {
      return res.render('admin/addCategory', {
        message: { text: 'Category name should not exceed 10 words!', type: 'error' }
      });
    }

    // ---------->Check for existing category
    const existingCategory = await Category.findOne({ name: formattedName });
    if (existingCategory) {
      return res.render('admin/addCategory', {
        message: { text: 'Category already exists!', type: 'error' }
      });
    }

    //--------> Add new category
    const newCategory = new Category({ name: formattedName });
    await newCategory.save();
    const categories=await Category.find();
    req.flash('success','category added successfully')
    res.redirect('/admin/categoryList')

   
  } catch (error) {
    console.error("Error while adding category:", error);
    return res.render('admin/addCategory', {
      message: { text: 'Error adding category!', type: 'error' }
    });
  }
};


 exports.getEditCategory=async(req,res)=>{
  try{
    const categoryId=req.params.id;
    const category= await Category.findById(categoryId);
   
    if(!category){
      return res.render('admin/adminCategory',{message:'Category not found'})
    }
    res.render('admin/editCategory',{category})

  }catch(error){
    console.error('Error fetching category:',error);
    res.render('admin/adminCategory',{message:'server error'})
  }
 }
// edit category----->post----
exports.postEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    let { name, status } = req.body;

    // ------->it eliminates whitespace and validate name format
    const formattedName = name.trim();
    const category = await Category.findById(categoryId);
    

    if (!/^([A-Z][a-z]*)(\s[A-Z][a-z]*)*$/.test(formattedName)) {
      return res.render('admin/editCategory', {
        message: { text: 'Each word in the category name must start with a capital letter!', type: 'error'},category
      });
    }

    const existingCategory = await Category.findOne({ name: formattedName });
    if (existingCategory) {
      return res.render('admin/editCategory', {category,
        message: { text: 'Category already exists!', type: 'error' }
      });
    }
    // -------> here Update the category
    await Category.findByIdAndUpdate(categoryId, {
      name: formattedName,
      status: status === 'on' ? 'Active' : 'Inactive'
    });
     req.flash('success','category edited successfully')
    res.redirect('/admin/categoryList');
  } catch (error) {
    console.error('Error updating category', error);
    res.status(500).send('Server error');
  }
};


//---> to blockCategory--//
exports.blockAndUnblockcategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const action = req.params.action;
    const newStatus = action === 'block' ? 'Inactive' : 'Active';
    
    await Category.findByIdAndUpdate(categoryId, { status: newStatus });
    req.flash('success',`category ${action}ed successfully`)
    res.redirect('/admin/categoryList');
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred');
  }
};
exports.deletecategory =async(req,res)=>{
  try{
    const {id}=req.params;
   
    await Category.findByIdAndDelete(id);
    const categories=await Category.find()
    req.flash('success','Category deleted successfully')
    res.redirect('/admin/categoryList')

  }catch(error){
    console.error('Error deleting category',error);
    req.flash('error','Error deleting Category')
    res.redirect('/admin/categoryList')
  
  }
}
