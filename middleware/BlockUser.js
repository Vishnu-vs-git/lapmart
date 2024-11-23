
const User =require('../model/userSchema');






exports.blockUser = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;

    if (sessionUser) {
      // Fetch the latest user status from the database
      const user = await User.findById(sessionUser._id);

      if (user && user.isBlocked) { // Check if the user is blocked
        req.session.destroy((error) => {
          if (error) {
            console.error(error);
            return res.status(500).send("Something went wrong");
          }
          return res.render('user/accountBlockedPage', {
            message: 'Your account has been blocked',
          });
        });
      } else {
        next(); // Proceed if the user is not blocked
      }
    } else {
      next(); // Proceed if there is no session
    }
  } catch (error) {
    console.error(error);
    next(error); // Forward error to the error handler
  }
};


    
