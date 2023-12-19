const User = require("../models/user.model");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary");
const fs = require('fs/promises');
const crypto = require('crypto');

const cookieOptions = {
    secure:true,
    maxAge: 7 *24* 60 * 60 * 1000,
    httpOnly:true
}



const register = async (req, res,next) => {
  const { fullName, email, password,role } = req.body;
  // console.log(req.body);

  if (!fullName || !email || !password) {
    return next(new AppError("All feilds are required", 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("Email already exists", 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
    avatar: {
      public_id: email,
      secure_url: "https://i.pravatar.cc/150?img=3",
    },
  });
  // check here user or User
  if (!user) {
    return next(
      new AppError("user registration failed, please try again later", 400)
    );
  }

  //upload user picture
  console.log('file details >',JSON.stringify(req.file));
  if(req.file){
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path,{
        folder:'lms',
        width:250,
        height:250,
        gravity:'faces',
        crop:'fill'
      });

      if(result){
        user.avatar.public_id=result.public_id;
        user.avatar.secure_url=result.secure_url;
        // remove file from local server
        fs.rm(`./uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message||'file not uploaded, please try again',500));
    }
  }

  await user.save();

  /**
   * get JWT token in cookie
   * when we regiter then automatically signin
   * use auth login code to generate JWT
   */
  const token = await user.generateJWTToken();
  res.cookie("token", token, cookieOptions);

  user.password = undefined;
  res.status(200).json({
    success: true,
    message: "User Registered successfully",
    user,
  });
};



const login = async (req, res,next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("All feilds are required", 400));
  }

  const user = await User
    .findOne({
      email
    })
    .select("+password");

  if (!(user && await user.comparePassword(password))) {
    return next(new AppError("Email or password do not match", 400));
  }

  const token = await user.generateJWTToken();
  // user.password = undefined;

  res.cookie('token' , token , cookieOptions);

  res.status(201).json({
    success:true,
    message: "user signed succesfully",
    user
  })
};



const logout = (req, res,next) => {
  
  // try{
    // const user = User.findById(req.user.id);
    res.cookie('token',null,{
    secure:true,
    maxAge:0,
    httpOnly:false
  });

  res.status(200).json({
    success:true,
    message:"User logged out successfully",
    // user
  });
// }
// catch(e){
//   return next(new AppError("erroe in logging out",401))
// }
};



const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success:true,
    message:'User details',
    user
  });
};



const forgetPassword = async (req,res,next) => {
 const { email } = req.body;
 
  if(!email){
    return next(new AppError("Email is required",400));
  }

  const user = await User.findOne({email});
  if (!user) {
    return next(new AppError("Email is not registered", 400));
  }

  const resetToken = await user.generatePasswordToken();

  await user.save();

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = 'Reset password';
  const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
  
  console.log(resetPasswordUrl);

  try {
    // todo
    await sendEmail(email,subject,message);

    res.status(200).json({
      success:true,
      message:`Reset password token has been sent to ${email} successfully`
    });
  } catch (error) {
    user.forgerPasswordExpiry = undefined;
    user.forgetPasswordToken = undefined;
    await user.save();
    return next(new AppError(error.message,500));
  }
}

const resetPassword = async (req,res,next) => {
  const{ resetToken } = req.params;
  const { password } = req.body;

  const forgetPasswordToken = crypto
                              .createHash('sha256')
                              .update(resetToken)
                              .digest('hex');

  const user = await User.findOne({
    forgetPasswordToken,
    forgerPasswordExpiry : { $gt: Date.now() }
  });

  if(!user){
    return next(new AppError('Token is invalid or expired, please try again',400));
  }

  user.password = password;
  user.forgerPasswordExpiry = undefined;
  user.forgetPasswordToken = undefined;

  await user.save();

  res.status(200).json({
    status:true,
    message:'Password changed successfully'
  });
}



const changePassword = async(req,res,next) => {
  const { oldPassword,newPassword } = req.body;
  const { id } = req.user;
  
  if(!oldPassword || !newPassword){
    return next(new AppError('All feilds are mandatory',400));
  }

  const user = await User.findById(id).select('+password');

  if(!user){
    return next(new AppError("User does not exist", 400));
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if(!isPasswordValid){
    return next(new AppError("Invalid Old Password", 400));
  }

  user.password = newPassword;
  await user.save();
  user.password = undefined;

  res.status(200).json({
    status:true,
    message:'Password change successfully'
  });
};



const updateUser = async (req,res,next) => {
  const { fullName } = req.body;
  const { id } = req.user;

  const user = await User.findById(id);

  if(!user){
    return next(new AppError("User doesnot exist",400));
  }

  if(fullName){
    user.fullName = fullName;
  }

  if(req.file){
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "lms",
      width: 250,
      height: 250,
      gravity: "faces",
      crop: "fill",
    });

    if (result) {
      user.avatar.public_id = result.public_id;
      user.avatar.secure_url = result.secure_url;
      // remove file from local server
      fs.rm(`./uploads/${req.file.filename}`);
    }
  }
  await user.save();

  res.status(200).json({
    success:true,
    message:"User details updated successfully"
  });
   
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  forgetPassword,
  resetPassword,
  changePassword,
  updateUser
};
