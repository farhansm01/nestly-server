const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const mongoose = require("mongoose");

let authInstance = null;

const getAuth = () => {
  if (!authInstance && mongoose.connection.db) {
    authInstance = betterAuth({
      database: mongodbAdapter(mongoose.connection.db),
      emailAndPassword: { enabled: true },
      trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://nestly-client-silk.vercel.app",
        "https://nestly-server-sigma.vercel.app",
        process.env.CLIENT_URL,
        process.env.ALLOWED_ORIGIN,
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      ].filter(Boolean),
      user: {
        additionalFields: {
          role: {
            type: "string",
            defaultValue: "buyer",
          },
        },
      },
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
