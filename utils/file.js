const fs = require('fs');
const path = require('path');

module.exports = (filePath, cb) => {
  fs.unlink(path.join(__dirname,"..", filePath ), (err) => {
    if (err) return cb(err);
    cb();
  });
}
