import { Router } from "express";
import { getAllPosts, publishPost,setComments,setLikes,getPost,getPostComments, savePost, getAllSavePosts,getUserPosts,getUserComments} from "../controller/postController.js";
import {upload} from "../middleware/multer.js"
import isAuthenticated from "../middleware/checkAuth.js"
const router=Router();
router.route("/publish-post").post(upload.single('postImage'),isAuthenticated,publishPost);
router.route("/save-post").post(isAuthenticated,savePost);
router.route("/get-all-post").get(getAllPosts);
router.route("/set-comment").post(isAuthenticated,setComments);
router.route("/set-like").get(isAuthenticated,setLikes);
router.route("/get-post").get(getPost);
router.route("/get-all-savedpost").get(isAuthenticated,getAllSavePosts);
router.route("/get-post-comments").get(getPostComments);
router.route("/get-activity-posts").get(getUserPosts);
router.route("/get-activity-comments").get(getUserComments);

export default router;