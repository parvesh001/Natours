const router = require('express').Router();

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//User Authentication Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//This middleware will run for all the below described routes
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updateMyPassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.processUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

//This middleware will run for all the below described routes
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
