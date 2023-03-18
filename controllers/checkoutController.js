const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //get tour
  const tour = await Tour.findById(req.params.tourId);

  //create session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${process.env.FRONT_END_DOMAIN}/bookings/success`,
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

  //send back session
  res.status(200).json({status:'success', data:{session}})
});
