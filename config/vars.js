require("dotenv").config();

module.exports = {
  urlPrefix: process.env.URL_PREFIX,
  dbClient: process.env.DB_CLIENT,
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  dbPort: parseInt(process.env.DB_PORT, 10),
  dbMongoDbOnline: process.env.DB_MONGODB_ONLINE,
  dbMongoDbOffline: process.env.DB_MONGODB_OFFLINE,
  secretKey: process.env.SECRET_KEY,
  defaultTimeout: process.env.DEFAULT_TIMEOUT
    ? parseInt(process.env.DEFAULT_TIMEOUT, 10)
    : 25000,
  frontendUrl: process.env.FRONTEND_URL,
  apiUrl: process.env.URL_API,
  roleIdUser: process.env.ROLEID_USER,
  roleIdAdmin: process.env.ROLEID_ADMIN,
  emailTesting: process.env.EMAIL_TESTING,
  sendGridAPIKey: process.env.SEND_GRID_APIKEY,
};
