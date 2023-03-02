const Review = require('../models/reviewsModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory')
// const AppError = require('../utils/appError');



exports.addTourUserIds = (req,res,next)=>{
  if(!req.body.tour) req.body.tour = req.params.tourId
  if(!req.body.user) req.body.user = req.user._id
  next()
}

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.createReview = factory.createOne(Review)
exports.deleteReview = factory.deleteOne(Review)
exports.updateReview = factory.updateOne(Review)