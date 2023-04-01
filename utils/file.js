const fs = require('fs');
const path = require('path');


module.exports = (filePath, cb) => {
  //checks if file exist over mentioned path or not
  fs.stat(path.join(__dirname, '..', filePath), (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('File not found!');
        return cb();
      } else {
        return cb(err);
      }
    } else {
      //delete the file from the mentioned path
      fs.unlink(path.join(__dirname, '..', filePath), (err) => {
        if (err) return cb(err);
        cb();
      });
    }
  });
};
