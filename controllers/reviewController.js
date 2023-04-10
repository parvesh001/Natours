const Review = require('../models/reviewsModel');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
// const AppError = require('../utils/appError');

exports.addTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createReview = catchAsync(async (req, res, next) => {
  //1) Check if there is tourId and if yes, it is valid
  if (!req.body.tour)
    return next(new AppError('Please provide a tour Id', 400));
  const tour = await Tour.findById(req.body.tour);
  if (!tour) return next(new AppError('There is no tour with this Id', 404));

  //2)Check if current user has booked the reviewing tour and tour date has passed
  const bookingByCurrentUser = await Booking.find({
    tour: req.body.tour,
    user: req.body.user,
  });
  if (!bookingByCurrentUser.length) {
    return next(new AppError('You have not booked this tour', 409));
  }
  if (new Date(bookingByCurrentUser[0].startDate) > new Date()) {
    return next(new AppError('You have not enjoyed tour yet', 409));
  }

  //3)check if current user has already reviewed the tour
  const reviewByCurrentUser = await Review.find({
    tour: req.body.tour,
    user: req.body.user,
  });
  if (reviewByCurrentUser.length) {
    return next(new AppError('You have already reviewed this tour', 409));
  }
  //4)All good? create review and send back response
  const newReview = await Review.create(req.body);
  res.status(201).json({ status: 'success', data: { data: newReview } });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);

exports.getMyReviews = catchAsync(async (req, res, next) => {
  const currentUserReviews = await Review.find({ user: req.user._id });
  if (!currentUserReviews) return next('you have not reviewed yet', 404);
  res
    .status(200)
    .json({ status: 'success', data: { reviews: currentUserReviews } });
});
