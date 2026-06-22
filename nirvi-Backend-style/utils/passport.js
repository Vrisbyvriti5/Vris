const bcrypt = require('bcryptjs');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const UserModel = require('../models/userModel');

const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth not configured: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing.');
    return passport;
  }

  const callbackURL = String(process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback').trim();

  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = String(profile?.emails?.[0]?.value || '').trim().toLowerCase();
        const name = String(profile?.displayName || 'Google User').trim();
        const googleId = profile?.id;

        if (!email || !googleId) {
          return done(new Error('Google profile is missing required fields.'));
        }

        let user = await UserModel.findByGoogleId(googleId);
        if (!user) {
          user = await UserModel.findByEmail(email);
        }

        if (!user) {
          const randomPassword = await bcrypt.hash(`google_${googleId}_${Date.now()}`, 12);
          user = await UserModel.createGoogleUser({
            name,
            email,
            googleId,
            password: randomPassword,
          });
        } else if (!user.google_id) {
          await UserModel.linkGoogleIdByEmail(email, googleId);
          user = await UserModel.findByEmail(email);
        }

        return done(null, {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      } catch (error) {
        return done(error);
      }
    },
  ));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user || false);
    } catch (error) {
      done(error);
    }
  });

  return passport;
};

module.exports = { configurePassport };
