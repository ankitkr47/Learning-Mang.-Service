const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt= require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Email is required"],
      minLength: [5, "name must be at-least 5 character"],
      maxLength: [50, "name must be less than 50 characters"],
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is reuired"],
      unique: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
        "Please fill in a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 character"],
      select: false,
    },

    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {},
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
      // require:true
    },

    forgetPasswordToken: String,

    forgerPasswordExpiry: Date,
  },

  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  console.log("password converted");
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods = {
  comparePassword: async function (plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },
  // comparePassword : function(plainTextPassword){
  //   return this.password === plainTextPassword;
  // },

  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id,
        role: this.role,
        email: this.email,
        subscription: this.subscription,
      },
      process.env.SECRET,
      {
        expiresIn: "24h",
      }
    );
  },
  generatePasswordToken: async function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.forgetPasswordToken = crypto
                              .createHash('sha256')
                              .update(resetToken)
                              .digest('hex');

    this.forgerPasswordExpiry = Date.now() + 15 * 60 * 1000;  //15 min from now

    return resetToken;
  }
};

const User = model("USER", userSchema);

module.exports = User;
