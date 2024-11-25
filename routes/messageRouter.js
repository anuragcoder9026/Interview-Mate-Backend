import { Router } from "express";
import { getMessages,getUserChatsProfiles,getMessageImageUrl } from "../controller/messageController.js";
import {upload} from "../middleware/multer.js"
import isAuthenticated from "../middleware/checkAuth.js"

const router=Router();
router.route("/get-image-url").post(upload.single('messageImage'),isAuthenticated,getMessageImageUrl);
router.route("/get-message").get(isAuthenticated,getMessages);
router.route("/all-chats-profile").post(isAuthenticated,getUserChatsProfiles);


export default router;