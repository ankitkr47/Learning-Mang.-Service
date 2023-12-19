const app = require("./app.js");
const connectToDB = require("./config/dbConnection");
const dotenv = require("dotenv");
const { v2 } = require('cloudinary');

dotenv.config();

v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const PORT = process.env.PORT;

app.listen(PORT , async() => {
    await connectToDB();
    console.log(`App is running at http:localhost:${PORT}`);
});