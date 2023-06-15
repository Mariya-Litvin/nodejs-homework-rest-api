const Joi = require("joi");

const contacts = require("../models/contacts");

const { AppError, ctrlWrapper } = require("../helpers");

const addSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[a-zA-Zа-яА-Я]+(([' -][a-zA-Zа-яА-Я ])?[a-zA-Zа-яА-Я]*)*$/)
    .required(),
  email: Joi.string()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
});

const getAllContacts = async (req, res, next) => {
  const result = await contacts.listContacts();
  res.status(200).json(result);
};

const getById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await contacts.getContactById(contactId);

  if (!result) {
    throw AppError(404, "Not found");
  }

  res.status(200).json(result);
};

const addNewContact = async (req, res, next) => {
  const { error } = addSchema.validate(req.body);
  if (error) {
    const arrayOfError = error.message.split(" ");
    const firstWordOfError = arrayOfError[0];
    throw AppError(400, `missing required ${firstWordOfError} field`);
  }
  const result = await contacts.addContact(req.body);
  res.status(201).json(result);
};

const deleteById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await contacts.removeContact(contactId);

  if (!result) {
    throw AppError(404, "Not found");
  }
  res.status(200).json({ message: "contact deleted" });
};

const updateById = async (req, res, next) => {
  const { error } = addSchema.validate(req.body);
  if (error) {
    throw AppError(400, "missing fields");
  }
  const { contactId } = req.params;
  const result = await contacts.updateContact(contactId, req.body);

  if (!result) {
    throw AppError(404, "Not found");
  }
  res.status(200).json(result);
};

module.exports = {
  getAllContacts: ctrlWrapper(getAllContacts),
  getById: ctrlWrapper(getById),
  addNewContact: ctrlWrapper(addNewContact),
  deleteById: ctrlWrapper(deleteById),
  updateById: ctrlWrapper(updateById),
};
