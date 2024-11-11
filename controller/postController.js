import { User } from "../models/userschema.js"
import { Post } from "../models/postschema.js"
import { Comment } from "../models/commentschema.js";
import { Notification } from "../models/notificationschema.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const publishPost=async(req,res)=>{
    const {postId,title,content,postImage,imageExistType}=req.body;
    const postUser=req.user?._id;
    try {
        const user = await User.findById(postUser);
        if (!user) return res.status(404).json({ message: 'User not found' }); 
            let imageUrl;
            if(imageExistType == 1) {
                const image=await uploadOnCloudinary(req.file.path);
                imageUrl=image.url;
            }
            else if(imageExistType == 2){
                imageUrl=postImage;
            }
            else imageUrl=null;
        if(postId){
            const updatedPost=await Post.findByIdAndUpdate(postId, {title,content,postUser,postImage:imageUrl}, { new: true });
            return res.status(200).send(updatedPost);
           }
           let post=await Post.create({title,content,postUser,postImage:imageUrl});    
           let createdPost=await Post.findById(post._id); 
           if(createdPost){
            const notification = new Notification({
                user: createdPost.postUser._id,
                actionUser: user._id,
                type:'post',
                post: createdPost._id,
                message:`${content}`
              });
              await notification.save();
              const followers = await User.find({ _id: { $in: user.followers } });
                  followers.forEach(async (follower) => {
                  follower.notifications.push(notification._id);
                  await follower.save();
                });
           user.posts.push(createdPost._id);
           await user.save();
           res.status(200).send({message:'Post published SuccessFully',post:post}); 
           }
           else res.status(400).send("something went wrong while publishing post.");  
    } catch (error) {
        res.status(400).send("something went wrong while publishing post."); 
    }

}

const getAllPosts = async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('postUser', '_id name username profileimg intro.tagline online') 
        .populate('likes', 'name username _id profileimg') 
        .exec(); // Executes the query
  
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error retrieving posts:", error);
      res.status(500).json({ message: "Error retrieving posts", error });
    }
  };

  const getAllSavePosts = async (req, res) => {
    try {
        const user = await User.findById(req.user?._id)
        .populate({
            path: 'savedPosts',
            select: '_id title content postUser date postImage', // Select post fields
            populate: {
                path: 'postUser',
                select: 'profileimg name username intro.tagline intro.headline' // Select user fields in postUser
            }
        })
        .exec();
  
        res.status(200).json({
            savedPosts: user.savedPosts.map(post => ({
                _id: post._id,
                postUser: {
                    profileimg: post.postUser.profileimg,
                    name: post.postUser.name,
                    username: post.postUser.username,
                    tagline: post.postUser.intro?.tagline,
                    headline: post.postUser.intro?.headline
                },
                date: post.date,
                postImage: post.postImage,
                content: post.content
            }))
        });
    } catch (error) {
      console.error("Error retrieving Saved posts:", error);
      res.status(500).json({ message: "Error retrieving Saved posts", error });
    }
  };

  const getPost = async (req, res) => {
    const { postId } = req.query;
    try {
        const post = await Post.findById(postId)
            .populate({
                path: 'postUser',
                select: '_id name username profileimg intro.tagline',
            })
            .populate({
                path: 'likes',
                select: '_id name username profileimg intro.tagline intro.city intro.country',
            })
            .exec();
        post.impression += 1;
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.error("Error retrieving post:", error);
        res.status(500).json({ message: "Error retrieving post", error });
    }
};


const getPostComments = async (req, res) => {
    const { postId } = req.query;
    try {
        const post = await Post.findById(postId)
            .populate({
                path: 'comments',
                populate: {
                    path: 'commentUser',
                    select: 'name username profileimg intro.tagline' // Select only the necessary fields from the user
                }
            })
            .exec();

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json(post.comments);
    } catch (error) {
        console.error("Error retrieving comments:", error);
        res.status(500).json({ message: "Error retrieving comments", error });
    }
};



  const setComments=async(req,res)=>{
    if(!req.user)return res.status(400).send("token not exists");
        const {postId}=req.query;
        const {comment}=req.body;
        try {
              const newComment=await Comment.create({commentUser:req.user._id,post:postId,content:comment});
              const post = await Post.findById(postId);
              const postOwner=await User.findById(post.postUser._id);
              post.comments.push(newComment._id);
              const user =await User.findById(req.user._id);
              user.comments.push(newComment._id);
              
              
              if(postOwner._id!==user._id ){ 
                  const notification = new Notification({
                    user: post.postUser._id,
                    actionUser: req.user._id,
                    type:'comment',
                    post: postId,
                    message:`${comment}`
                  });
                  await notification.save();
                  postOwner.notifications.push(notification._id);
                  await postOwner.save();      
                  const followers = await User.find({ _id: { $in: user.followers } });
                      followers.forEach(async (follower) => {
                      follower.notifications.push(notification._id);
                      await follower.save();
                    });
              }

            await post.save();
            await user.save();
            if (!post) return res.status(404).send("Post not found");
            if (!user) return res.status(404).send("User not found");
            return res.status(200).send("commented successfully.")
            
        } catch (error) {
            return res.status(400).send("something went wrong");
        }
    }
 
    const setLikes = async (req, res) => {
        if (!req.user) return res.status(400).send("Token not exists");
        const { postId } = req.query;
        try {
            const post = await Post.findById(postId);
            if (!post) return res.status(404).send("Post not found");
            const userId = req.user._id;
            const likesArray = post.likes;
            if (likesArray.includes(userId)) {
                post.likes = post.likes.filter(id => id.toString() !== userId.toString());
                await post.save();
                return res.status(200).send("Unliked successfully.");
            } else {
                post.likes.push(userId);
                if(post.postUser._id!==userId){//other user liked your post
                const notification = new Notification({
                    user: post.postUser._id,
                    actionUser: userId,
                    type:'like',
                    post: postId,
                    message:'liked Your Post.'
                  });
                await notification.save();
                const postOwner = await User.findById(post.postUser._id);
                postOwner.notifications.push(notification._id);
                await postOwner.save();
                }
                await post.save();
                return res.status(200).send("Liked successfully.");
            }
        } catch (error) {
            return res.status(400).send("Something went wrong");
        }
    };
    
    const savePost=async (req,res)=>{
        if(!req.user) return res.status(400).send("not Authenticated");
        const {postId,save}=req.body;
        
        try {
            let user=await User.findById(req.user._id);
          if (save === 'Save') {
              if (!user.savedPosts.includes(postId)) {
                  user.savedPosts.push(postId);
              }
              await user.save();
              res.status(200).send({ "message": `Post Saved SuccessFully.` });
          } else if (save === 'Unsave') {
            if (user.savedPosts.includes(postId)) {
                user.savedPosts = user.savedPosts.filter(post => post.toString()!== postId.toString());
            }
              await user.save();
              res.status(200).send({ "message": `Post UnSaved SuccessFully.` });
          } else {
              res.status(400).json({ "message": "Invalid Save action" });
          }
      } catch (error) {
          res.status(400).send({"message":"something went wrong"})
      }
  }     

  const getUserPosts = async (req, res) => {
    const {userId}=req.query;
    try {
      const user = await User.findById(userId).populate({path: 'posts', select:'-impression'});
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user.posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getUserComments = async (req, res) => {
    const { userId } = req.query;
    try {
      const user = await User.findById(userId).populate({path: 'comments', select:'content date post'});
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user.comments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

export {publishPost,getAllPosts,setComments,setLikes,getPost,getPostComments,savePost,getAllSavePosts,getUserPosts,getUserComments}