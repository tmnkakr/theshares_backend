const setupUploadedMediaCount = (req, res, next) => {
  Object.defineProperty(req, "totalUploadedMedia", {
    value: 0,
    writable: true,
  });
  next();
};

module.exports = {
  mediaProp: setupUploadedMediaCount,
};
