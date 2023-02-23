const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');

const signToken = id =>{
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRESIN,
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const newUser = await User.create({ name, email, password, passwordConfirm });
  const token = signToken(newUser._id)
  res.status(201).json({ status: 'success', token, data: { user: newUser } });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password are defined
  if (!email || !password) {
    return next(new AppError('provide email and password', 400));
  }

  //check if email and password are correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !await user.isComparable(password, user.password)) {
    return next(new AppError("incorrect email or password", 401))
  }
  // send back response with jwt token
  const token = signToken(user._id)
  res.status(200).json({ status: 'success', token});
});
