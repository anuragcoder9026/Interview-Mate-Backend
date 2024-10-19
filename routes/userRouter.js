import { Router } from "express";
import {LogOut,SignUp,LogIn} from "../controller/userController.js"
const router=Router();
router.route("/logout").get(LogOut);
router.route("/signup").post(SignUp);
router.route("/login").post(LogIn);
export default router;