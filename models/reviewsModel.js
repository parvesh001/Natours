const mongoose = require('mongoose');

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
  { timestamps:true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.pre(/^find/, function(next){
  this.populate({path:'user', select:'name photo'})
  next()
})

module.exports = mongoose.model('Review', reviewSchema);
