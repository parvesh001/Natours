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
  let tours = await Tour.find();

  let tourBookingsPerStartDate = await Booking.aggregate([
    {
      $group: {
        _id: {
          tour: '$tour',
          startDate: '$startDate',
        },
        participants: { $sum: 1 },
      },
    },
  ]);

  tourBookingsPerStartDate = tourBookingsPerStartDate.map((BPSD) => {
    const { tour, startDate } = BPSD._id;
    return {
      tour,
      startDate,
      participants: BPSD.participants,
    };
  });

  tourBookingsPerStartDate = tourBookingsPerStartDate.reduce(
    (result, booking) => {
      let { tour, startDate, participants } = booking;

      if (!result[tour]) {
        result[tour] = {};
      }
     
      startDate = new Date(startDate).toISOString().slice(0,10)
      result[tour][startDate] = participants;

      return result;
    },
    {}
  );

  const toursWithBookingDetails = tours.map((tour) => {
    const tourBookings = tourBookingsPerStartDate[tour._id];

    let bookingsPerStartDate;
    if (tourBookings) {
      bookingsPerStartDate = tour.startDates.map((SD) => {
        SD = new Date(SD).toISOString().slice(0,10)
        return {
          startDate: SD,
          participants: tourBookings[SD] || 0,
          availableCapacity: tour.maxGroupSize - (tourBookings[SD] || 0),
        };
      });
    } else {
      bookingsPerStartDate = tour.startDates.map((SD) => {
        return {
          startDate: SD,
          participants: 0,
          availableCapacity: tour.maxGroupSize,
        };
      });
    }

    return {
      ...tour.toObject(),
      bookingsPerStartDate,
    };
  });

  res
    .status(200)
    .json({
      status: 'success',
      result: tourBookingsPerStartDate.length,
      data: { tours: toursWithBookingDetails },
    });

  // tours = tours.map((tour) => {
  //   let tourBookigs =
  //     bookingsPerStartDate.filter((BPSD) => BPSD.tour === tour._id) || [];

  //   tour.bookingsPerStartDate = tour.startDates.map((SD) => {
  //     const SDBooking = tourBookigs.find((TB) => TB.startDate === SD);
  //     return {
  //       startDate: SD,
  //       participants: SDBooking ? SDBooking.participants : 0,
  //       availableCapacity: SDBooking
  //         ? tour.maxGroupSize - SDBooking.participants
  //         : tour.maxGroupSize,
  //     };
  //   });
  //   return { ...tour };
  // });

  // console.log(bookingsPerStartDate);

  //how each bookin look like
  //  {
  //   tour:ObjectId(),
  //   user:ObjectId(),
  //   startDate:Date,
  //   price:Number
  //  }

  //how each tour should look like
  // {
  //     _id: 'sddsfsdfsd',
  //     name: 'forest hicker',
  //     BookingsPerStartDate: [
  //       { startDate: 12 - 4 - 2033, participants: 6, availableCapacity: 2 },
  //     ],
  //     totalAvailability: 5,
  //   };
});

exports.getTour = catchAsync(async (req, res, next) => {
  const slug = req.params.slug;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user -tour',
  });
  if (!tour) {
    return next(new AppError('No Tour Found With This Name', 404));
  }
  res.status(200).json({ status: 'success', data: { data: tour } });
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
