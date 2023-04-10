module.exports = (obj, ...allowFields) => {
  const filteredObj = {};
  for (let key in obj) {
    if (allowFields.includes(key)) filteredObj[key] = obj[key];
  }
  return filteredObj;
};
