import { Router } from "express";
import { addContact, deleteContact, getContacts } from "../controllers/contacts.controller";


const contactRouter = Router();


// --- Contact routes ---
contactRouter.post("/", addContact); // Add a new contact
contactRouter.get("/", getContacts); // Get all contacts of current user
contactRouter.delete("/:contactId", deleteContact); // Delete a contact by id

export { contactRouter };