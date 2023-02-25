const crypto = require('crypto')
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
  role:{
    type:String,
    enum:['user', 'admin', 'lead-guide', 'guide'],
    default:'user'
  },
  photo: String,
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
  passwordChangedAt:Date,
  passwordResetToken:String,
  passwordResetExpiresIn:Date,
  active:{
    type:Boolean,
    default:true,
    select:false
  }
});

//Document Middleware:runs before saving document
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

//Query Middleware:runs before defined query
userSchema.pre(/^find/,function(next){
  //filter out active users only
  //as it is qury middleware 'this' refers to query
  this.find({active:true})
  next()
})

userSchema.methods.isComparable = async function (inputPass, encryptedPass) {
  return await bcrypt.compare(inputPass, encryptedPass);
};

userSchema.methods.isPasswordChandedAfter = function(tokenIssuedAt){
  if(this.passwordChangedAt){
    const passwordChangedAt = this.passwordChangedAt.getTime() / 1000
    return tokenIssuedAt < passwordChangedAt
  }
  return false
}

userSchema.methods.generateResetPasswordToken = async function(){
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  this.passwordResetToken = hashedResetToken
  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000
  await this.save({validateBeforeSave:false})
  return resetToken
}



module.exports = mongoose.model('User', userSchema);
