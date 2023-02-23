const AppError = require('../utils/appError');


//Function for processing database errors:CasteError,DuplicateKey Error, and ValidationError
const handleCasteError = (err) => {
  const message = `Invalid ${err.path} value:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const message = `${Object.keys(
    err.keyPattern
  )} already exist`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
   const value = Object.values(err.errors).map(val => {
    return val.name === 'CastError'? `Incorrect value "${val.value}" for ${val.path}` : val.message
   }).join('. ')

   const message = `Invalid Input:${value}`
   return new AppError(message,400)
};

//Function for handling errors:Development mode
const devModeError = (err, res) => {
  res.status(err.statusCode).json({
    errors: err,
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

//Function for handling errors:Production Mode
const prodModeError = (err, res) => {
  //Operational Error: Inform client full information
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });

    //Programming or other unknown error:Not leak details to client
  } else {
    console.log(`Error!!: ${err}`);
    res.status(500).json({ status: 'error', message: 'something went wrong' });
  }
};

//Controller
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'server internal error';

  if (process.env.NODE_ENV === 'development') {
    devModeError(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCasteError(error);
    if (err.code === 11000) error = handleDuplicateKeyError(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    prodModeError(error, res);
  }
};
