import { Router } from "express";
import { createEvent ,getAllActiveEvents,saveEvent,getAllSavedEvents,getUserEvents} from "../controller/eventController.js";
import {upload} from "../middleware/multer.js"
import isAuthenticated from "../middleware/checkAuth.js"

const router=Router();
// router.route("/get-image-url").post(upload.single('messageImage'),isAuthenticated,getMessageImageUrl);
// router.route("/get-message").get(isAuthenticated,getMessages);
// router.route("/all-chats-profile").post(isAuthenticated,getUserChatsProfiles);
router.route("/create-event").post(isAuthenticated,createEvent);
router.route("/get-all-event").get(getAllActiveEvents);
router.route("/save-event").post(isAuthenticated,saveEvent);
router.route("/get-all-savedevent").get(isAuthenticated,getAllSavedEvents);
router.route("/get-user-event").get(isAuthenticated,getUserEvents);
export default router;