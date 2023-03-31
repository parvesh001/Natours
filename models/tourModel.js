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
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
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
      set: (val) => Math.round(val * 10) / 10,
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
          if(this.price) return val < this.price;
          return val <  this._update['$set'].price
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
    imageCover: String,
    images: [String],
    startDates: [Date],
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//SET INDEXES
//setting compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
//setting single index
tourSchema.index({slug:1})
//setting geo index
tourSchema.index({startLocation:'2dsphere'})

//VIRTUALS
//Add virtual Field
tourSchema.virtual('tourWeeks').get(function () {
  return (this.duration / 7).toFixed(1);
});

//Add Virtual field and Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//MIDDLEWARES
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

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

//AGGREGATE MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

module.exports = mongoose.model('Tour', tourSchema);
