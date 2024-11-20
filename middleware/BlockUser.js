
const User =require('../model/userSchema');




exports.blockUser = async (req, res, next) => {
  try {
    let userId;

    // Check if session exists
    if (req.session.user && req.session.user._id) {
      userId = req.session.user._id;
    } else {
      console.log('No session found. Trying to extract userId from cookies.');
      // Extract userId from cookies or another source (if implemented)
      userId = req.cookies?.userId; // Replace with your actual logic
    }

    if (!userId) {
      console.log('No userId found. Redirecting to login.');
      return res.redirect('/user/login');
    }

    // Find user in the database
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found in DB. Redirecting to login.');
      return res.redirect('/user/login');
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      console.log('User account is blocked. Rendering account blocked page.');
      return res.status(403).render('admin/accountBlockedPage', {
        message: 'Your account has been blocked. Please contact support for assistance.',
        contactEmail: 'support@lapmart.com',
      });
    }

    // Update session if missing but user is valid
    if (!req.session.user) {
      req.session.user = { _id: user._id };
    }

    console.log('User is not blocked. Proceeding...');
    next();
  } catch (error) {
    console.error('Error in blockUser middleware:', error);
    res.status(500).send('An error occurred while checking user status.');
  }
};
