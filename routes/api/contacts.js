const express = require("express");

const ctrl = require("../../controllers/contacts");

const isValidId = require("../../middlewares");

const router = express.Router();

router.get("/", ctrl.getAllContacts);

router.get("/:contactId", isValidId, ctrl.getById);

router.post("/", ctrl.addNewContact);

router.delete("/:contactId", isValidId, ctrl.deleteById);

router.put("/:contactId", isValidId, ctrl.updateById);

router.patch("/:contactId/favorite", isValidId, ctrl.updateFavorite);

module.exports = router;
