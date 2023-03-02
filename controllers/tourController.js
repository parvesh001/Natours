const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
// const AppError = require("../utils/appError");
const factory = require('../controllers/handlerFactory')

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour, {path:'reviews', select:'-__v'})
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)


exports.getToursStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      //1)Stage 1: filtering the tours with rating gte to 4.5
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      //2)Stage 2: aggregating the remaining groups to find avg:rating and price, and min and max price
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({ status: 'success', data: { stats } });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
  ]);

  res.status(200).json({ status: 'success', data: { plan } });
});
