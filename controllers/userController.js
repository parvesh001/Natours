const path = require('path');

const multer = require('multer');
const sharp = require('sharp');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const factory = require('../controllers/handlerFactory');
const deleteFile = require('../utils/file');
const filterObject = require('../utils/filterObject')

//As we need to configure image, at this time we do not want to store image in disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

//Storing img in memory storage
const multerStorage = multer.memoryStorage();

//adding filter to images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('file is not an Image', 400), false);
  }
};

exports.uploadUserPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}).single('photo');

exports.processUserPhoto = catchAsync(async(req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500, {
      fit: 'cover',
      position: 'center',
    })
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Check if password and confirm password are there
  if (req.body.newPassword || req.body.newPasswordConfirm) {
    return next(
      new AppError(
        `This route is to update user's email or name not for password`,
        400
      )
    );
  }
  //2)Filter out not-allowed fileds
  const filteredObj = filterObject(req.body, 'name', 'email');

  //3)Check if their is image file, if yes attach to obj and delete existing file if it is !== default.jpg
  if (req.file) {
    filteredObj.photo = req.file.filename;

    if (req.user.photo !== 'default.jpg') {
      const filePath = path.join('/public', 'img', 'users', req.user.photo);
      deleteFile(filePath, (err) => {
        if (err) return next(new AppError('internal server problem', 500));
      });
    }
  }
  //4)Update email or name or file (using findByIdAndUpdate to avoid extra validations which require fields)
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredObj, {
    new: true,
    runValidators: true,
  });
  //4) Send back response
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  //1) Get User and update active status to false
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

//donot use this route to create user go to :/signup
exports.createUser = factory.createOne(User)
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
