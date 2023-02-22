//Required Packages
const express = require('express');
const morgan = require('morgan');

//Required Routes
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');

//Required Controllers
const globalErrorHandler = require('./controllers/errorController');

//Required Utils
const AppError = require('./utils/appError');

const app = express();

//MIDDLEWARES:runs on each request
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

//ROUTES
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/users', userRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} route!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
