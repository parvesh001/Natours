const router = require('express').Router()

const bookingController = require('../controllers/bookingController')
const authController = require('../controllers/authController')

router.get('/checkout-session/tour/:tourId/startDate/:startDate', authController.protect, bookingController.getCheckoutSession)

router.post('/create-booking', authController.protect, bookingController.createBooking)

router.get('/my-bookings', authController.protect, bookingController.getMyBookings )

module.exports = router