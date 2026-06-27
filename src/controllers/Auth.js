import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { OTP } from "../models/Otp.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import otpGenerator from "otp-generator";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { mailSender } from "../utils/mailSender.js";
import { courseEnrollmentEmail } from "../mail/templates/courseEnrollmentEmail.js";

const sentOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("email from  req.body: ", email);

  const checkUserPresent = await User.findOne({ email });

  if (checkUserPresent) {
    throw new ApiError(400, "User already registered");
  }

  var otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  console.log("otp: -> :", otp);

  const result = await OTP.findOne({ otp: otp });
  console.log("first find the otp:- ", result);

  while (result) {
    otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    result = await OTP.findOne({ otp: otp });
  }

  const otpPayload = {
    email,
    otp,
  };

  // create an entry in db for otp
  const otpBody = await OTP.create(otpPayload);

  console.log("otp body -> :", otpBody);
  return res
    .status(200)
    .json(new ApiResponse(201, {}, "otp sent your on email"));
});

const signUp = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    accountType,
    contactNumber,
    otp,
  } = req.body;

  if (
    [firstName, lastName, email, password, confirmPassword, otp].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new ApiError(403, "All fields are required");
  }
  // validate the password

  if (password !== confirmPassword) {
    throw new ApiError(400, "password and confirmpassword not match");
  }
  // check existing or not

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "user already register");
  }

  const recentOtp = await OTP.findOne({ email })
    .sort({ createdAt: -1 })
    .limit(1);

  console.log("recent otp ->: ", recentOtp);

  if (recentOtp.length === 0) {
    throw new ApiError(400, "otp not found");
  } else if (otp !== recentOtp.otp) {
    throw new ApiError(400, "Invalid otp");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const profileDetails = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  });

  //entry create in db

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    confirmPassword: hashedPassword,
    accountType,
    contactNumber,
    additionalDetails: profileDetails,
    image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName}%20${lastName}`,
  });
 
  return res
    .status(200)
    .json(new ApiResponse(201, user, "successfully signup"));
 

});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(403, "all field are requirred");
  }

  const user = await User.findOne({ email }).populate("additionalDetails");

  if (!user) {
    throw new ApiError(401, "user is not regiterd");
  }

  if (await bcrypt.compare(password, user.password)) {
    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      // yha errror aayega
      expiresIn: "2h",
    });
    user.token = token;
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 100),
      httpOnly: true,
    };

    res
      .cookie("token", token, options)
      .status(200)
      .json(new ApiResponse(201, { user, token }, "login successfully"));
  } else {
    return res.status(401).json({
      success: false,
      message: "password is incorrect",
    });
  }
});

// change password
const changePassword = asyncHandler(async (req, res) => {
  // get data from body
  // password newPaswword, confirmpassword
  // validate newPass,confirmPass

  // update on db
  // send email password updated
  // return response
  const { oldPassword, newPassword, confirmPassword } = req.body;

  //    if(!oldPassword || !newPassword || confirmPassword){
  //        throw new ApiError(400,"All field are required")
  //     }
  if (
    [oldPassword, newPassword, confirmPassword].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new ApiError(400, "All field are required");
  }

  if (newPassword != confirmPassword) {
    throw new ApiError(400, "newpassword and confirmpassword is not match");
  }

  const user = await User.findById(req.user?.id);
  console.log("user after finding for change password -> :", user.password);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(401, "password does not match");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(
    req.user?.id,
    { password: hashedPassword },
    { new: true },
  );
  await mailSender(
    user.email,
    "Password Changed Successfully",
    "Your password has been changed successfully.",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "password successfully change"));
});

export { sentOtp, signUp, login, changePassword };
