const Review = require('../models/reviewsModel');
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
// const AppError = require('../utils/appError');



exports.addTourUserIds = (req,res,next)=>{
  if(!req.body.tour) req.body.tour = req.params.tourId
  if(!req.body.user) req.body.user = req.user._id
  next()
}
exports.createReview = catchAsync(async(req,res,next)=>{
   //1)Check if current user has booked the reviewing tour and already added a review to the tour
   const bookingByCurrentUser = await Booking.find({tour:req.body.tour,user:req.body.user})
   const reviewByCurrentUser = await Review.find({tour:req.body.tour,user:req.body.user})
  
   if(!bookingByCurrentUser.length){
    return next(new AppError('You have not booked this tour', 409))
   }
   if(reviewByCurrentUser.length){
    return next(new AppError('You have already reviewed this tour', 409))
   }
   //2)All good? create review and send back response
   const newReview = await Review.create(req.body)
   res.status(201).json({ status: 'success', data: { data: newReview } });
})

exports.getAllReviews = factory.getAll(Review)
exports.getReview = factory.getOne(Review)
exports.deleteReview = factory.deleteOne(Review)
exports.updateReview = factory.updateOne(Review)