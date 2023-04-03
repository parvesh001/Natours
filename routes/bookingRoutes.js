const router = require('express').Router()

const checkoutController = require('../controllers/checkoutController')
const authController = require('../controllers/authController')

router.get('/checkout-session/tour/:tourId/startDate/:startDate', authController.protect, checkoutController.getCheckoutSession)

router.post('/create-booking', authController.protect, checkoutController.createBooking)

module.exports = router