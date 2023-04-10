const router = require('express').Router({ mergeParams: true }); //merge params of the parant router

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//All requests have to pass this middleware
router.use(authController.protect)

//POST:domain/api/v1/tours/12fr221/reviews
//GET:domain/api/v1/tours/12fr221/reviews
//POST:domain/api/v1/reviews
//GET:domain/api/v1/reviews
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user', 'admin'),
    reviewController.addTourUserIds,
    reviewController.createReview
  );

router.get('/my-reviews', reviewController.getMyReviews)

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'),reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'),reviewController.deleteReview);

module.exports = router;
