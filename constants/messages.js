module.exports = {
  BANNER: {
    ADD_SUCCESS: "Banner added successfully",
    ADD_ERROR: "Error in adding banner",
    NOT_FOUND: "Banner not found",
    DELETE_SUCCESS: "Banner deleted successfully",
    EDIT_SUCCESS: "Banner edited successfully",
    DELETE_ERROR: "Error in deleting banner",
    STATUS_UPDATED: "Status changed successfully",
    STATUS_ERROR: "Error in changing banner status",
    IMAGE_REQUIRED: "No image file uploaded",
    VALIDATION_ERROR: "Title and description are required",
    LIST_ERROR:"Error in listing banner",
    STATUS_VALUE_ERROR:"Invalid status value",
    BANNER_EDIT_PAGE_ERROR:"Error in getting edit page"
  },
    AUTH: {
    INVALID_EMAIL: "Email is invalid",
    INVALID_PASSWORD: "Password is incorrect",
    INVALID_BOTH: "Email and password are invalid"
  },

  USER: {
    BLOCK_SUCCESS: "User blocked successfully",
    UNBLOCK_SUCCESS: "User unblocked successfully",
    BLOCK_ERROR: "Error blocking user",
    UNBLOCK_ERROR: "Error Unblocking user",
    DELETE_SUCCESS: "Customer removed successfully",
    DELETE_ERROR: "Something went wrong"
  },
   COUPON: {
    EXISTS: "Coupon code already exists",
    INVALID_DATE: "Start date must be before expiry date",
    ADD_SUCCESS: "Coupon added successfully",
    ADD_ERROR: "Failed to add coupon",
    BLOCK_SUCCESS: "Coupon blocked successfully",
    UNBLOCK_SUCCESS: "Coupon unblocked successfully",
    NOT_FOUND: "Coupon not found",
    DELETE_SUCCESS: "Coupon deleted successfully",
    DELETE_ERROR: "Error in removing coupon",
    UPDATE_SUCCESS: "Coupon updated successfully",
    UPDATE_ERROR: "Error in updating coupon",
    COUPON_LOAD_ERROR:"Failed to load coupons",
    FORM_LOAD_ERROR:"Failed to load form",
    ID_REQUIRED:"Coupon ID is required"
  },
  OFFER: {
    LOAD_ERROR: "Failed to load offers",
    ADD_ERROR: "Error adding offer",
    DELETE_SUCCESS: "Offer deleted successfully",
    DELETE_ERROR: "Error deleting offer",
    NOT_FOUND: "Offer not found",
    ID_REQUIRED: "Offer ID is required",
    STATUS_UPDATED: "Offer status updated successfully",
    STATUS_ERROR: "Error updating offer status",
    EDIT_LOAD_ERROR: "Error loading edit offer page",
    UPDATE_SUCCESS: "Offer updated successfully",
    UPDATE_ERROR: "Error updating offer",
    REQUIRED_FIELDS: "Required fields are missing",
    REQUIRED_FIELD_MISSING:"Some required fields are missing"
  },
 CATEGORY:{
    INVALID_FORMAT: "Each word must start with a capital letter",
    STARTS_WITH_NUMBER: "Category name cannot start with a number",
    TOO_LONG: "Category name should not exceed 10 words",
    EXISTS: "Category already exists",
    ADD_SUCCESS: "Category added successfully",
    ADD_ERROR: "Error adding category",
    NOT_FOUND: "Category not found",
    UPDATE_SUCCESS: "Category updated successfully",
    UPDATE_ERROR: "Error updating category",
    DELETE_SUCCESS: "Category deleted successfully",
    DELETE_ERROR: "Error deleting category",
    STATUS_UPDATED: "Category status updated successfully"
 },
 PRODUCT: {
  COLOR_REQUIRED: "Please add at least one color",
  REQUIRED_FIELDS: "All fields must be filled out",
  INVALID_NAME: "Product name must start with an uppercase letter",
  INVALID_COLOR: "Color must not contain numbers",
  CATEGORY_REQUIRED: "Please select a valid category",
  CATEGORY_NOT_FOUND: "Selected category does not exist",
  NUMERIC_ERROR: "Numeric values must not be negative",
  OS_INVALID: "Operating system must be a positive value",
  IMAGE_REQUIRED: "At least 3 images are required",

  ADD_SUCCESS: "Product added successfully",
  ADD_ERROR: "Error adding product",

  DELETE_SUCCESS: "Product deleted successfully",
  DELETE_ERROR: "Product deletion unsuccessful",

  BLOCK_SUCCESS: "Product blocked successfully",
  BLOCK_ERROR: "Error blocking product",

  UNBLOCK_SUCCESS: "Product unblocked successfully",
  UNBLOCK_ERROR: "Error unblocking product",

  NOT_FOUND: "Product not found",

  UPDATE_SUCCESS: "Product updated successfully",
  UPDATE_ERROR: "Error updating product",

  IMAGE_REMOVE_SUCCESS: "Image removed successfully",
  IMAGE_REMOVE_ERROR: "Error removing image"
},
 ORDER: {
    NOT_FOUND: "Order not found",
    DETAILS_NOT_FOUND: "Order details not found",
    PRODUCT_NOT_FOUND: "Product not found",
    ITEM_NOT_FOUND: "No item found in order",
    MISSING_FIELDS: "Missing required fields",
    STATUS_UPDATED: "Order status updated successfully",
    RETURN_ACCEPTED: "Return request accepted",
    RETURN_REJECTED: "Return request rejected"
  },
 REPORT: {
  LOAD_ERROR: "Error loading sales report",
  PDF_ERROR: "Error generating PDF report",
  EXCEL_ERROR: "Error generating Excel report"
},

  COMMON: {
    INTERNAL_ERROR: "Something went wrong",
    ID_MISSING: "ID is missing"
  }
};