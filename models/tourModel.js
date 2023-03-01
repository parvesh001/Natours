const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: [20, 'Tour name must contains less or equal to 20 characters'],
      minLength: [5, 'Tour name must contains minimum 5 characters'],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must gave group size'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be eqal or more than 1.0'],
      max: [5, 'Rating must be less than or equal to 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: `The discount ({VALUE}) must be less than actual price`,
      },
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either:easy, medium, or difficult',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have image cover'],
    },
    images: [String],
    startDates: [Date],
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.virtual('tourWeeks').get(function () {
  return (this.duration / 7).toFixed(1);
});

//DOCUMENT MIDDLERWARE:runs before or after the .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE:runs before or after the query
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function(next){
  this.populate({path:'guides', select:'-__v -passwordChangedAt'})
  next()
})
//AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model('Tour', tourSchema);
