import { Router } from "express";
import {LogOut} from "../controller/userController.js"
const router=Router();
router.route("/logout").get(LogOut);

export default router;