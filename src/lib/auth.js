const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const mongoose = require("mongoose");

let authInstance = null;

const getAuth = () => {
  if (!authInstance && mongoose.connection.db) {
    authInstance = betterAuth({
      database: mongodbAdapter(mongoose.connection.db),
      emailAndPassword: { enabled: true },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
      },
      secret: process.env.BETTER_AUTH_SECRET || "default_secret_key",
    });
  }
  return authInstance;
};

module.exports = { getAuth };
