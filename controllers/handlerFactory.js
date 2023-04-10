const path = require('path');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const deleteFile = require('../utils/file');

const deleteExistingFiles = async(Model, id)=>{
 //query the being updated document
 const beingUpdatedDoc = await Model.findById(id);

 //check for any file and delete them
 if (beingUpdatedDoc.imageCover) {
   const filePath = path.join(
     '/public',
     'img',
     'tours',
     beingUpdatedDoc.imageCover
   );
   deleteFile(filePath, (err) => {
     if (err) return next(new AppError('internal server problem', 500));
   });
 }
 if (beingUpdatedDoc.images) {
   beingUpdatedDoc.images.forEach((image) => {
     const filePath = path.join('/public', 'img', 'tours', image);
     deleteFile(filePath, (err) => {
       if (err) return next(new AppError('internal server problem', 500));
     });
   });
 }
//  if (beingUpdatedDoc.photo && beingUpdatedDoc.photo !== 'default.jpg') {
//    const filePath = path.join(
//      '/public',
//      'img',
//      'users',
//      beingUpdatedDoc.photo
//    );
//    deleteFile(filePath, (err) => {
//      if (err) return next(new AppError('internal server problem', 500));
//    });
//  }
}


exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    await deleteExistingFiles(Model, req.params.id);
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError('No document found', 404));
    res.status(204).json({ status: 'success', data: null });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    
    //Delete existing files first
    await deleteExistingFiles(Model, req.params.id)

    //Update now
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });

    if (!doc) {
      return next(new AppError('No document found!', 404));
    }

    res.status(200).json({ status: 'success', data: { data: doc } });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: { data: doc } });
  });
};

exports.getOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError('No document found!', 404));
    }
    res.status(200).json({ status: 'success', data: { data: doc } });
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //a small hack for tour/review
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const apiFeatures = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    //Finally Getting Docs
    const docsArray = await apiFeatures.query;
    res.status(200).json({
      status: 'success',
      result: docsArray.length,
      data: { data: docsArray },
    });
  });
};
