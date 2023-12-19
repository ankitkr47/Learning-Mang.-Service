const express = require("express");
const {
  register,
  login,
  logout,
  getProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  updateUser
} = require("../controllers/user.controller");
const { isLoggedIn } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");


const router = express.Router();

router.post("/register",upload.single('avatar'), register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me",isLoggedIn, getProfile);
router.post("/reset",forgetPassword);
router.post('/reset/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn,changePassword)
router.put("/update/:id",isLoggedIn,upload.single('avatar'),updateUser);

module.exports = router;
