const router = require('express').Router();

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');

router.route('/tours-stats').get(tourController.getToursStats);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('guide', 'user', 'admin'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// domain/api/v1/tours/2mdsm33/reviews
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
