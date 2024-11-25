const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./model/userSchema"); // Assuming User schema is already defined
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
      
        // // let user = await User.findOne({ googleId: profile.id });
         let user = await User.findOne({ email:profile.emails[0].value });

        // if (!user) {
        //   user = await User.create({
        //     googleId: profile.id,
        //     userName: profile.displayName,
        //     email: profile.emails[0].value,
        //   });
        // }
        // done(null, user);
        if (user) {
          // Update the existing user with the Google ID if not already linked
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          done(null, user);
          console.log("User already exists, proceeding with login...");
        } else {
          user = await User.create({
              googleId: profile.id,
                userName: profile.displayName,
                email: profile.emails[0].value,
          
        })
        done(null, user);

        console.log("New user created:", user);
      }



      } catch (err) {
        done(err, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, false);
  }
});
