const router = require('express').Router();

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router.get(
  '/checkout-session/tour/:tourId/startDate/:startDate',
  bookingController.getCheckoutSession
);


router.get('/my-bookings', bookingController.getMyBookings);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(bookingController.getBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
