const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handleFactory = require('../controllers/handlerFactory')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {

  //1)Check if current user has made any booking for the tour,if yes don't allow to book again
  const currentUser = await Booking.find({user:req.user._id, tour:req.params.tourId})

  if(currentUser.length) return next(new AppError('You have already booked this tour', 409))
  
  //2)Caluculate total participants on given tour on given date, to see availability
  const totalParticipantsOnDate = await Booking.aggregate([
    {
      $match: {
        $and: [
          { tour: mongoose.Types.ObjectId(req.params.tourId) },
          {
            $expr: {
              $eq: [{ $toDate: '$startDate' }, new Date(req.params.startDate)],
            },
          },
        ],
      },
    },
    {
      $count: 'participants',
    },
  ]);
 
  //3)get tour
  const tour = await Tour.findById(req.params.tourId);

  //4)Check available capacity, if not not allow to proceed
  let availableCapacity = tour.maxGroupSize
  if(totalParticipantsOnDate[0] && totalParticipantsOnDate[0].participants){
    availableCapacity = availableCapacity - totalParticipantsOnDate[0].participants
  }

  if (availableCapacity <= 0)
    return next(
      new AppError(
        'Tour is fully booked on this date, try on another date',
        409
      )
    );

  //5)All good? create session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${process.env.FRONT_END_DOMAIN}/bookings/success?tourId=${tour._id}&price=${tour.price}&startDate=${req.params.startDate}&userId=${req.user._id}`,
    cancel_url: `${process.env.FRONT_END_DOMAIN}/bookings/fails`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  //6)send back session
  res.status(200).json({ status: 'success', data: { session } });
});

exports.bookTour = catchAsync(async (req, res, next) => {
  const { tourId, price, startDate, userId } = req.body;
  const tour = await Tour.findById(tourId);
  const user = await User.findById(userId);
  if (!tour || !user)
    return next(
      new AppError('bad request, not allowed to perform this action', 400)
    );
  await Booking.create({ tour: tourId, user: userId, startDate, price });
  res
    .status(201)
    .json({ status: 'success', message: 'Tour booked successfully' });
});

exports.getMyBookings = catchAsync(async(req,res,next)=>{
  const currentUserBookings = await Booking.find({user:req.user._id})
  if(!currentUserBookings.length){
    return next(new AppError('You have not booked any tour yet!', 404))
  }
  res.status(200).json({status:'success', data:{bookings:currentUserBookings}})
})


exports.createBooking = handleFactory.createOne(Booking)
exports.getBookings = handleFactory.getAll(Booking)
exports.updateBooking = handleFactory.updateOne(Booking)
exports.deleteBooking = handleFactory.deleteOne(Booking)