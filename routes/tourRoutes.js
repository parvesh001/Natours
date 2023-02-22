const router = require('express').Router();

const tourController = require('../controllers/tourController');

router.route("/tours-stats").get(tourController.getToursStats)
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan)

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
