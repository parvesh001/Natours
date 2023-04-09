const multer = require('multer');
const sharp = require('sharp');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) return cb(null, true);
  cb(new AppError('The file is not an image file', 400), false);
};

exports.uploadTourPhotos = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}).fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.processTourPhotos = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.imageCover || !req.files.images) return next();

  //1) process imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //process images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

// exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getAllTours = catchAsync(async (req, res, next) => {

  //1)Caluculate tours totalBookings irrespective of date, and construct a array of all its participants
  let toursBookingsWithParticipants = await Booking.aggregate([
    {
      $group: {
        _id: '$tour',
        totalBookings: { $sum: 1 },
        participants: { $push: '$user' },
      },
    },
  ]);

  //2)reduce data for better usability
  toursBookingsWithParticipants = toursBookingsWithParticipants.reduce(
    (acc, curr) => {
      acc[curr._id] = {
        totalBookings: curr.totalBookings,
        participants: [...curr.participants],
      };
      return acc;
    },
    {}
  );

  let tours = await Tour.find();

  //3)map each tour with their booking details
  const toursWithBookingDetails = tours.map((tour) => {
    let tourBookingsDetails = toursBookingsWithParticipants[tour._id];

    if (tourBookingsDetails) {
      tourBookingsDetails = {
        participants: [...tourBookingsDetails.participants],
        availableCapacity:
          tour.maxGroupSize * tour.startDates.length -
          tourBookingsDetails.totalBookings,
      };
    } else {
      tourBookingsDetails = {
        participants: [],
        availableCapacity: tour.maxGroupSize * tour.startDates.length,
      };
    }
    return {
      ...tour.toObject(),
      tourBookingsDetails,
    };
  });

  //4)send back response
  res.status(200).json({
    status: 'success',
    result: toursWithBookingDetails.length,
    data: { tours: toursWithBookingDetails },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1)Check if tour exist or not with given slug
  const slug = req.params.slug;
  let queriedTour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user -tour',
  });
  if (!queriedTour) {
    return next(new AppError('No Tour Found With This Name', 404));
  }

  //2)Caluculate tour bookings per its startDate
  let tourBookingsPerStartDate = await Booking.aggregate([
    {
      $match: { tour: { $eq: queriedTour._id } },
    },
    {
      $group: {
        _id: '$startDate',
        participants: { $push: '$user' },
      },
    },
  ]);

  tourBookingsPerStartDate = tourBookingsPerStartDate.map((TBPSD) => {
    const startDate = TBPSD._id;
    return {
      startDate,
      participants: [...TBPSD.participants],
    };
  });

  //3) Reduce data for better usability
  tourBookingsPerStartDate = tourBookingsPerStartDate.reduce((acc, curr) => {
    let startDate = new Date(curr.startDate).toISOString().slice(0, 10);
    acc[startDate] = [...curr.participants];
    return acc;
  }, {});

  //4)Map tour with its booking details
  let queriedTourAsObject = { ...queriedTour.toObject() };
  queriedTourAsObject['bookingsPerStartDate'] = queriedTour.startDates.map(
    (SD) => {
      SD = new Date(SD).toISOString().slice(0, 10);
      const participants = tourBookingsPerStartDate[SD] || []
      return {
        startDate: SD,
        participants: participants,
        availableCapacity:
          queriedTour.maxGroupSize - participants.length,
      };
    }
  );
  
  res
    .status(200)
    .json({ status: 'success', data: { data: queriedTourAsObject } });
});

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
        Oky: 1,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
  ]);

  res.status(200).json({ status: 'success', data: { plan } });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');
  const radians = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !long)
    return next(new AppError('please provide latitude and longitude!', 400));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[long, lat], radians] } },
  });

  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { data: tours } });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlong, unit } = req.params;
  const [lat, long] = latlong.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if ((!lat, !long))
    return next(new AppError('please provide latitude and longitude!', 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [long * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({ status: 'success', data: { data: distances } });
});
