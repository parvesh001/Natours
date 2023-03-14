const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRESIN,
  });
};

const createSendToken = (res, user, statusCode) => {
  const token = signToken(user._id);
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

exports.signup = catchAsync(async (req, res, next) => {
  //Validation logic is running in model,here we only need to focus on response
  //Create User
  const newUser = await User.create(req.body);
  //generate JWT and send back with response
  createSendToken(res, newUser, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)check if email and password are defined
  if (!email || !password) {
    return next(new AppError('provide email and password', 400));
  }
  //2)Check if email is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('incorrect email or password', 401));

  //3)Check if there is any loginProhibition
  if (user.loginProhibitionTime && user.loginProhibitionTime > Date.now()) {
    return next(
      new AppError(
        'You have exceeded login attemts limit, please try again after some time',
        403
      )
    );
  }

  //4)Check if the password matches, if not count the attempts and if they reach 3 set prohibition time
  if (!(await user.isComparable(password, user.password))) {
    const loginAttemts = user.loginAttempts || 0;
    await User.findByIdAndUpdate(user._id, { loginAttempts: loginAttemts + 1 });
    const updatedUser = await User.findById(user._id);
    if (updatedUser.loginAttempts === 3) {
      await User.findByIdAndUpdate(updatedUser._id, {
        loginProhibitionTime: Date.now() + 200000,
        $unset: { loginAttempts: 1 },
      });
      return next(
        new AppError(
          'You have exceeded login attempts limit, please try again after 30 minutes',
          400
        )
      );
    }
    return next(new AppError('incorrect email or password', 401));
  }
  //5)If all good, unset attempts and loginprohibition time and send back token
  await User.findByIdAndUpdate(user._id, {
    $unset: { loginAttempts: 1, loginProhibitionTime: 1 },
  });
  const updatedUser = await User.findById(user._id);
  createSendToken(res, updatedUser, 200);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Check if token exist within request header
  let token;
  if (req.headers.authorization) {
    token = req.get('Authorization').split(' ')[1];
  }
  if (!token) {
    return next(new AppError('Could not find token, please login again', 401));
  }

  //2)Check if token is valid:varify token
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

  //3)Check if the user still exist
  const freshUser = await User.findById(decodedToken.id);
  if (!freshUser) {
    return next(new AppError('User with this token do not exist', 401));
  }

  //4) Check if user has changed password after assigning token
  if (freshUser.isPasswordChandedAfter(decodedToken.iat)) {
    return next(
      new AppError('User has changed the password, please login again', 401)
    );
  }

  //5) Grant access
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not Authorized', 403));
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1) Check if email exist, then user exist with email
  if (!req.body.email)
    return next(new AppError('Please provide a valid email', 400));
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User with this email not found', 404));

  //2)Create token to send in email and store in database
  const forgetPasswordToken = await user.generateResetPasswordToken();

  //3) Send email with link contian token
  try {
    const url = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/resetPassword/${forgetPasswordToken}`;
    const subject = 'Reset Password Link(you only have 10 minutes)';
    const html = `<div>
                        <p>Requested for password resitting? here is link</p>
                        <a href=${url}>Click here</a>
                  </div>
                   `;
    await sendEmail({
      from: 'vparvesh830@gmail.com',
      email: user.email,
      subject,
      html,
    });

    res.status(200).json({
      status: 'success',
      message: 'Please check you email to change password',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('something went wrong while sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Extract the token and hash it
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //2) Check if token is valid and user exists with the token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('User do not exist or token is invalid', 400));
  }

  //3) Change the password, set change password time,and erase reset token and expiresIn time
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;
  user.passwordChangedAt = Date.now() - 1000;
  await user.save();

  //4) Send a response with login token
  createSendToken(res, user, 200);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;

  //1)Get user from database with password
  const user = await User.findById(req.user._id).select('+password');

  //2) Check if oldPassword is correct
  const isEqual = await user.isComparable(oldPassword, user.password);
  if (!isEqual) return next(new AppError('password is incorrect', 401));

  //3)Update the password and time at which password updated
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  user.passwordChangedAt = Date.now() - 1000;
  await user.save();

  //4)Send back response with token
  createSendToken(res, user, 200);
});

