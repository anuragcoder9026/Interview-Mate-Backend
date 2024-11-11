import { Router } from "express";
import {LogOut,SignUp,LogIn,Intro,About,Education,deleteEducation,Experience,deleteExperience,Skill,getProfile,followUser,getTotalImpressions,getFollowerSuggestions,getUserFollowings,getUserFollowers,getUserFollowingList,getUserFollowerList,UserProfileImage,UserCoverImage,getUserFollowersSummary,getFollowerNotifications,getPostNotifications,setReadNotification,deleteNotification,getUnseenMessageCount} from "../controller/userController.js"
import isAuthenticated from "../middleware/checkAuth.js"
import {upload} from "../middleware/multer.js"

import { sendMessage,getMessages,getUserChatsProfiles } from "../controller/messageController.js";

const router=Router();
router.route("/logout").get(isAuthenticated,LogOut);
router.route("/get-post-impression").get(isAuthenticated,getTotalImpressions);
router.route("/get-follwer-suggestions").get(isAuthenticated,getFollowerSuggestions);
router.route("/user-profile-img").post(isAuthenticated,upload.single('userProfile'),UserProfileImage)
router.route("/user-cover-img").post(isAuthenticated,upload.single('userCover'),UserCoverImage)
router.route("/signup").post(SignUp);
router.route("/login").post(LogIn);
router.route("/intro").post(isAuthenticated,Intro);
router.route("/about").post(isAuthenticated,About);
router.route("/education").post(isAuthenticated,Education);
router.route("/delete-education").post(isAuthenticated,deleteEducation);
router.route("/experience").post(isAuthenticated,Experience);
router.route("/delete-experience").post(isAuthenticated,deleteExperience);
router.route("/skill").post(isAuthenticated,Skill);
router.route("/get-profile/:username").get(getProfile);
router.route("/follow").post(isAuthenticated,followUser);
router.route("/get-user-followers").get(isAuthenticated,getUserFollowers);
router.route("/get-user-followings").get(isAuthenticated,getUserFollowings);
router.route("/get-followers-list/:username").get(isAuthenticated,getUserFollowerList);
router.route("/get-followings-list/:username").get(isAuthenticated,getUserFollowingList);
router.route("/get-followers-summary").get(getUserFollowersSummary);
router.route("/get-follower-notification").get(isAuthenticated,getFollowerNotifications);
router.route("/get-post-notification").get(isAuthenticated,getPostNotifications);
router.route("/read-notification").post(isAuthenticated,setReadNotification);
router.route("/delete-notification").post(isAuthenticated,deleteNotification);


router.route("/send-message").post(isAuthenticated,sendMessage);
router.route("/get-message").get(isAuthenticated,getMessages);
router.route("/all-chats-profile").get(isAuthenticated,getUserChatsProfiles);
router.route("/unseen-messages-count").get(isAuthenticated,getUnseenMessageCount);

export default router;