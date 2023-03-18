const router = require('express').Router()

const checkoutController = require('../controllers/checkoutController')
const authController = require('../controllers/authController')

router.get('/checkout-session/:tourId', authController.protect, checkoutController.getCheckoutSession)

module.exports = router