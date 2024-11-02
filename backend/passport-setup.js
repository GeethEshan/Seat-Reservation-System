// passport-setup.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./modals/UserModal"); // Adjust the path if necessary

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({
          email: profile.emails[0].value,
        });
        if (existingUser) {
          done(null, existingUser);
        } else {
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            nicNo: "", // You can prompt user to fill this in later
            contactNo: "", // You can prompt user to fill this in later
            password: "", // You can also store a random password or set a flag
          });
          await newUser.save();
          done(null, newUser);
        }
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);
