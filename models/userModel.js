const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxLength: [20, 'Tour name must contains less or equal to 20 characters'],
    minLength: [2, 'Tour name must contains minimum 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minLength: [6, 'Password must be 6 charachters long'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'confirm password is required'],
    validate: {
      //only works on create and save(mongoose validation methods by default triggers by only these two methods)
      validator: function (val) {
        return val === this.password;
      },
      message: 'password must be same',
    },
  },
  photo: String,
});

userSchema.pre('save', async function (next) {
  //run further only if password filed is modified
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.isComparable = async function (inputPass, encryptedPass) {
  return await bcrypt.compare(inputPass, encryptedPass);
};

module.exports = mongoose.model('User', userSchema);
