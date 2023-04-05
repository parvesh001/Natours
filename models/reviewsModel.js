const mongoose = require('mongoose');

const Tour = require('./tourModel');
const User = require('./userModel')

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'You must provide review'],
      minLength: [8, 'Review must be 8 chars long'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must have a tour'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a user'],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//Compound Index:This also makes sure compound index combination is unique
reviewSchema.index({tour:1, user:1}, {unique:true})

//STATIC METHOD:To caluculate the ratingsAvg of concerned tour
reviewSchema.statics.caluculateAvgRatings = async function (tourId) {
  //here this key refers to Review model/schema not document
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  return stats;
};

//MIDDLEWARES
//Document Middleware:To run static caluculate method after each review save
reviewSchema.post('save', async function () {
  const stats = await this.constructor.caluculateAvgRatings(this.tour);
  await Tour.findByIdAndUpdate(this.tour, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating,
  });
});

//Query Middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

//This middleware storing current doc before updating or delete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  try {
    this.doc = await this.model.findOne(this.getQuery());
    next();
  } catch (error) {
    next(error);
  }
});

reviewSchema.post(/^findOneAnd/, async function () {
  const stats = await this.doc.constructor.caluculateAvgRatings(this.doc.tour)
  if(stats.length){
    await Tour.findByIdAndUpdate(this.doc.tour, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  }else{
    await Tour.findByIdAndUpdate(this.doc.tour, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
});

reviewSchema.post('save', async function(doc, next){
    const user = await User.findById(doc.user, 'name photo')
    doc.user = user
    next()
})

module.exports = mongoose.model('Review', reviewSchema);
