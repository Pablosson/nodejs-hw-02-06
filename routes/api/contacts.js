const express = require("express");
const {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateFavorite,
} = require("../../models/contacts");
const Joi = require("joi");
const { auth } = require("../../middleware/auth");

const router = express.Router();

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
});

router.get("/", auth, async (req, res, next) => {
  try {
    const { query } = req;
    const pageOptions = {
      page: parseInt(req.query.page, 10) || 0,
      limit: parseInt(req.query.limit, 10) || 5,
    };
    const contacts = await listContacts(pageOptions, query);
    res.status(200).json({
      status: 200,
      data: {
        result: contacts,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", auth, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const getContact = await getContactById(contactId);
    if (!getContact) {
      return res.status(404).json({
        message: `Contact with id "${contactId}" not found`,
        status: 404,
      });
    }
    res.status(200).json({
      status: 200,
      data: { getContact },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const contactBody = contactSchema.validate(req.body);
    if (contactBody.error) {
      return res.status(400).json({ message: contactBody.error.message });
    }
    const newContact = await addContact(req.body);
    res.status(201).json({ data: { newContact } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", auth, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await removeContact(contactId);
    if (!deleteContact) {
      return res.status(404).json({
        message: "Contact not found",
        status: 404,
      });
    }
    res.status(200).json({
      message: "Contact deleted",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", auth, async (req, res, next) => {
  try {
    const contactBody = contactSchema.validate(req.body);
    if (contactBody.error) {
      return res.status(400).json({ message: contactBody.error.message });
    }
    const { contactId } = req.params;
    const updateOldContact = await updateContact(contactId, req.body);
    if (!updateOldContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json({ data: { updateOldContact } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", auth, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;

    if (favorite === undefined || favorite === null) {
      return res.status(400).json({ message: "Missing field favorite" });
    }

    const setFavorite = await updateFavorite(contactId, favorite);
    if (!setFavorite) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ data: { setFavorite } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
