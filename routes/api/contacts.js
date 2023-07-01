const express = require("express");

const ctrl = require("../../controllers/contacts");

const { isValidId, authenticate } = require("../../middlewares");

const router = express.Router();

router.get("/", authenticate, ctrl.getAllContacts);

router.get("/:contactId", authenticate, isValidId, ctrl.getById);

router.post("/", authenticate, ctrl.addNewContact);

router.delete("/:contactId", authenticate, isValidId, ctrl.deleteById);

router.put("/:contactId", authenticate, isValidId, ctrl.updateById);

router.patch(
  "/:contactId/favorite",
  authenticate,
  isValidId,
  ctrl.updateFavorite
);

module.exports = router;
