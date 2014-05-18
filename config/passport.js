var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

//let facebook know where it need to redirect to
passport.use(new FacebookStrategy({
  //clientID: "295942617240131",
  //clientSecret: "a6299e6f60d4af0f996b9e942c0aa15b",
  clientID: process.env.FB_APP_ID,
  clientSecret: process.env.FB_APP_SECRET,
  callbackURL: "/fbcb"
}, function(accessToken, refreshToken, profile, done){
  // Passport profile:
  // http://passportjs.org/guide/profile/
  // Once the profile is stored in session, it will be available in req.user.
  //

  done(null, profile); //redirect to success route specified in json's property "successRedirect"
}));


// Extract needed data from Passport profile object.
// For this app, we only need to know user.id.
//
// Required by Passport.
// Ref: https://github.com/jaredhanson/passport#sessions
//
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Returns user object from facebook id.
//
// Required by Passport.
// Ref: https://github.com/jaredhanson/passport#sessions
//
passport.deserializeUser(function(id, done) {
  done(null, {id: id});
});