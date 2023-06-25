const { isValidObjectId } = require("mongoose");

const { AppError } = require("../helpers");

const isValidId = (req, res, next) => {
  const { contactId } = req.params;
  if (!isValidObjectId(contactId)) {
    next(AppError(400, `${contactId} is not valid id`));
  }
  next();
};

module.exports = isValidId;
