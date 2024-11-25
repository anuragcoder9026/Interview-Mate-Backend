import { User } from "../models/userschema.js"
import jwt from "jsonwebtoken"
import { Post } from "../models/postschema.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { Notification } from "../models/notificationschema.js";
import { populate } from "dotenv";
import { Message } from "../models/messageSchema.js";
//saving profile intro
const Intro = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const introData = req.body; 
        const user = await User.findById(userId);
        if (!user)return res.status(404).json({ message: "User not found" });
        user.name = introData.name;
        user.intro = {...user.intro, ...introData};
        await user.save();
        res.status(200).json({ message: "Intro updated successfully", intro: user.intro });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while updating intro" });
    }
};

const getTotalImpressions = async (req, res) => {
    const userId=req.user?._id;
    try {
        const user = await User.findById(userId).select('posts');
        if (!user || user.posts.length === 0) {
            return res.status(200).json({ userId, totalImpressions: 0 });
        }

     
        const totalImpressions = await Post.aggregate([
            { $match: { _id: { $in: user.posts } } },  
            { $group: { _id: null, totalImpressions: { $sum: "$impression" } } } 
        ]);

        const impressionsCount = totalImpressions[0]?.totalImpressions || 0;
        res.status(200).json({ impressions: impressionsCount });
    } catch (error) {
        console.error("Error calculating total impressions:", error);
        res.status(500).json({ message: "Error calculating total impressions", error });
    }
};

//saving profile Education
const Education = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const { id, education } = req.body; 

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (id === -1) {
            user.educations.unshift(education); 
        } else {
            const index = user.educations.findIndex((item) => item._id.equals(education._id));
            if (index !== -1) {
                user.educations[index] = { ...user.educations[index], ...education }; 
            } else {
                return res.status(404).json({ message: "Education entry not found" });
            }
        }
        await user.save();
        res.status(200).json({ message: "Education updated successfully", edu: user.educations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating education" });
    }
};

const deleteEducation = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { educationId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.educations = user.educations.filter((education) => !education._id.equals(educationId));
        await user.save();

        res.status(200).json({ message: "Education deleted successfully", educations: user.educations });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting education" });
    }
};

//saving profile Experiences
const Experience = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const { id, experience } = req.body; 

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (id === -1) {
            user.experiences.unshift(experience); 
        } else {
            const index = user.experiences.findIndex((item) => item._id.equals(experience._id));
            if (index !== -1) {
                user.experiences[index] = { ...user.experiences[index], ...experience }; 
            } else {
                return res.status(404).json({ message: "Experience entry not found" });
            }
        }
        await user.save();
        res.status(200).json({ message: "Experience updated successfully", exp: user.experiences });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while updating Experience" });
    }
};

const deleteExperience = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { experienceId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.experiences = user.experiences.filter((experience) => !experience._id.equals(experienceId));
        await user.save();

        res.status(200).json({ message: "Experience deleted successfully", expe: user.experiences });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting Experience" });
    }
};

//saving profile About
const About = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const {about} = req.body; 
        const user = await User.findById(userId);
        if (!user)return res.status(404).json({ message: "User not found" });
        user.about = about;
        await user.save();
        res.status(200).json({ message: "about updated successfully", about: user.about });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while updating about" });
    }
};

// update user skills
const Skill = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { skill } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.skills.push(skill);
        await user.save();

        res.status(200).json({ message: "Skill updated successfully", skills: user.skills });
    } catch (error) {
        res.status(500).json({ message: "An error occurred while deleting Skill" });
    }
};

//SignUp the user
const SignUp=async(req,res)=>{
    const { name,username,email,password,branch,year,college}=req.body;
    if([email,username,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required"});
    }
    else{
        let existedUser=await User.findOne({username})
        if(existedUser){
            return res.status(400).json({"message":"Username already exist."});
        }
        existedUser=await User.findOne({email})
        if(existedUser){
            return res.status(400).json({"message":"Email already exist."});
        }
        else{
        let user=await User.create({name,username,email,password,branch,year,college});    
        let createdUser=await User.findById(user._id).select("-password");
        if(!createdUser){
        res.status(400).send({"message":"Something went wrong while regestering the user"});
        }
        else{
         const accessToken=createdUser.generateAccessToken();
         
         const options = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in milliseconds
            httpOnly: true,
            path: '/',
            secure: true,
            sameSite: 'None'
          };
          
         return res.status(200)
        .cookie("accessToken",accessToken,options)
        .json({"content":createdUser,"message":"User signup sucessfully"})}
        }
    }

}

//Login the User
const LogIn=async (req,res)=>{
    const {email,password}=req.body;
    
    if([email,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required "});
    }
    else{
        let existedUser=await User.findOne({email});
    if(!existedUser){
        return res.status(400).json({message:"Email does not match "})
    }
    else{
        let check=false;
        if(existedUser.password){check=await existedUser.isPasswordCorrect(password);}
        if(!check){
            return res.status(400).send({message:"Password does not match"})
        }
        else{
            const accessToken=existedUser.generateAccessToken();
            const options = {
               maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
               httpOnly: true,
               path: '/',
               secure: true,
               sameSite: 'None'
             };      
           
           res.cookie("accessToken",accessToken,options)  ;
           res.status(200).json({"message":"User Login sucessfully",user:existedUser});
        }
    }
}

}

const LogOut = async (req, res) => {
    // Clear all cookies
    await User.findByIdAndUpdate(req.user?._id,{online:false});
    Object.keys(req.cookies).forEach((cookieName) => {
        res.clearCookie(cookieName, {
            path: '/',
            secure: true,
            sameSite: 'None'
        });
    });

    res.status(200).send('User logged out successfully');
};

const getProfile=async (req,res)=>{
        const username=req.params.username;
        try {
            let existedUser=await User.findOne({username});
            existedUser.views +=1;
            await existedUser.save();
            res.status(200).send(existedUser);
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
    }

const followUser=async (req,res)=>{
      if(!req.user) return res.status(400).send("not Authenticated");
      const {username,follow}=req.body;
      
      try {
          let user=await User.findById(req.user?._id);
          let followedUser=await User.findOne({username});
        if (follow === 'Follow') {
            if (!followedUser.followers.includes(user._id)) {
                followedUser.followers.push(user._id);
                const notification = new Notification({
                    user: followedUser._id,
                    actionUser: req.user._id,
                    type: 'follow',
                    message: `started following you`,
                  });
                  await notification.save();
                  followedUser.notifications.push(notification._id);
            }
            if (!user.following.includes(followedUser._id)) {
                user.following.push(followedUser._id);
            }
            await followedUser.save();
            await user.save();
            res.status(200).send({ "message": `You are Following ${followedUser.name}` });
        } else if (follow === 'Following') {
            followedUser.followers = followedUser.followers.filter(follower => follower.toString()!== user._id.toString());
            user.following = user.following.filter(following => following.toString()!== followedUser._id.toString());
            await followedUser.save();
            await user.save();
            res.status(200).send({ "message": `You have Unfollowed ${followedUser.name}` });
        } else {
            res.status(400).json({ "message": "Invalid follow action" });
        }
    } catch (error) {
        res.status(400).send({"message":"something went wrong"})
    }
}   

const getFollowerSuggestions = async (req, res) => {
    try {
        // Get the ID of the requesting user
        const userId = req.user?._id;

        // Find the user and populate the 'following' field
        const user = await User.findById(userId).populate('following', '_id');

        // Extract the IDs of users that the current user is following
        const followingIds = user.following.map(follow => follow._id);

        // Create a set of user IDs already connected to the user (for exclusion)
        const excludedIds = new Set([...followingIds, userId]);

        // Step 1: Find second-degree connections (users followed by those in the user's following list)
        const secondDegreeConnections = await User.aggregate([
            // Match users in the following list
            { $match: { _id: { $in: followingIds } } },

            // Unwind 'following' field to get each followed user individually
            { $unwind: '$following' },

            // Group by followed user ID
            { 
                $group: { 
                    _id: '$following', 
                    count: { $sum: 1 } 
                }
            },

            // Filter out users that the initial user is already following or is the user themself
            { $match: { _id: { $nin: Array.from(excludedIds) } } },

            // Sort by count of followers (mutuals in the user's following list)
            { $sort: { count: -1 } },

            // Limit results to top suggestions (e.g., top 10)
            { $limit: 10 }
        ]);

        // Step 2: For each suggested user, calculate the exact mutual count and details of one mutual connection
        const suggestedUsers = await Promise.all(secondDegreeConnections.map(async (conn) => {
            const suggestedUserId = conn._id;

            // Get the suggested user's following list
            const suggestedUser = await User.findById(suggestedUserId).populate('following', '_id name profileimg coverImage');
            const suggestedUserFollowingIds = suggestedUser.following.map(f => f._id.toString());

            // Find mutual connections by intersecting following arrays
            const mutualConnections = followingIds.filter(id => suggestedUserFollowingIds.includes(id.toString()));

            const mutualCount = mutualConnections.length;

            // Get details of one mutual connection if available
            let mutualConnectionDetail = null;
            if (mutualConnections.length > 0) {
                const mutualConnectionId = mutualConnections[0];
                const mutualConnectionUser = suggestedUser.following.find(f => f._id.toString() === mutualConnectionId.toString());
                mutualConnectionDetail = {
                    name: mutualConnectionUser.name,
                    profileimg: mutualConnectionUser.profileimg
                };
            }

            return {
                _id: suggestedUserId,
                name: suggestedUser.name,
                username: suggestedUser.username,
                profileimg: suggestedUser.profileimg,
                coverImage:suggestedUser.coverImage,
                mutualCount: mutualCount,
                mutualConnection: mutualConnectionDetail
            };
        }));

        res.status(200).json({ suggestions: suggestedUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch follower suggestions' });
    }
};

const getUserFollowers = async (req, res) => {
    try {
      const user = await User.findById(req.user?._id).populate({path: 'followers',
        select: 'name username profileimg intro.tagline'
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user.followers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getUserFollowings = async (req, res) => {
    try {
      const user = await User.findById(req.user?._id).populate({path: 'following',
        select: 'name username profileimg intro.tagline'
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(user.following);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
 
  const getUserFollowerList = async (req, res) => {
    const username=req.params.username;
    const authenticatedUserId = req.user?._id;
  
    try {
      const user = await User.findOne({username}).populate({
        path: 'followers',
        select: 'name username profileimg followers following intro.tagline intro.headline intro.city intro.country',
      });
 
      if (!user)return res.status(404).json({ message: 'User not found' });
      const authenticatedUser = await User.findById(authenticatedUserId).select('following');
      const followersWithDetails = user.followers.map((follower) => {
        const isFollow = authenticatedUser.following.some(
          (followingId) => followingId.equals(follower._id)
        );
  
        const mutualConnections = follower.following.filter((followedId) =>
          authenticatedUser.following.includes(followedId)).length;
  
        return {
          ...follower._doc, 
          isFollow,
          mutualConnections,
        };
      });
      res.status(200).json(followersWithDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  const getUserFollowingList = async (req, res) => {
    const username = req.params.username;
    const authenticatedUserId = req.user?._id;
  
    try {
      // Find the user by username and populate their following list
      const user = await User.findOne({ username }).populate({
        path: 'following',
        select: 'name username profileimg followers following intro.tagline intro.headline intro.city intro.country',
      });
  
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Fetch the authenticated user's following list
      const authenticatedUser = await User.findById(authenticatedUserId).select('following');
  
      // Map over the user's following list to add isFollow and mutual connections
      const followingWithDetails = user.following.map((followingUser) => {
        // Check if the authenticated user is also following this user
        const isFollow = authenticatedUser.following.some(
          (followingId) => followingId.equals(followingUser._id)
        );
  
        // Calculate mutual connections (intersection of both followers lists)
        const mutualConnections = followingUser.following.filter((followerId) =>
          authenticatedUser.following.includes(followerId)
        ).length;
  
        return {
          ...followingUser._doc, // Spread followingUser fields
          isFollow, // Add isFollow field
          mutualConnections, // Add mutual connection count
        };
      });
  
      // Respond with the updated following list
      res.status(200).json(followingWithDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
 
  const UserProfileImage=async(req,res)=>{
        try {
            if(req.file){
                let profileLocalPath=req.file.path;
                const profile=await uploadOnCloudinary(profileLocalPath);
                let profileimg=profile.url;
               const user=await User.findByIdAndUpdate(req.user._id,{profileimg},{new:true});
               return res.status(200).send("profile image uploade succssfully");
            }
            else{
                return res.status(400).send({"message":"something went wrong"})
            }
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
}

const UserCoverImage=async(req,res)=>{
        try {
            if(req.file){
                let coverLocalPath=req.file.path;
                const cover=await uploadOnCloudinary(coverLocalPath);
                let coverImage=cover.url;
               const user=await User.findByIdAndUpdate(req.user._id,{coverImage},{new:true});
               return res.status(200).send("cover image uploade succssfully");
            }
            else{
                return res.status(400).send({"message":"something went wrong"})
            }
        } catch (error) {
            res.status(400).send({"message":"something went wrong"})
        }
}

const getUserFollowersSummary = async (req, res) => {
    const { username } = req.query;
  
    try {
      const requser = await User.findOne({ username });
      const user=await await User.findOne({ username }).populate({
        path: 'followers',
        select: 'name profileimg',
        options: { limit: 2 }, 
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const followersSummary = {
        totalFollowers: requser.followers.length,
        followers: user.followers.map(follower => ({
          name: follower.name,
          profileimg: follower.profileimg,
        })),
      };
  
      res.status(200).json(followersSummary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  const getFollowerNotifications = async (req, res) => {
    try {
      const user = await User.findById(req.user?._id).populate({
        path: 'notifications',
        match: { type: 'follow' },
        options: { sort: { createdAt: -1 } },
        populate: { path: 'actionUser', select: '_id name username profileimg intro.tagline' },
      });
     
      const notifications = await Promise.all(
        user.notifications.map(async (notification) => {
          const isFollowing = user.following.includes(notification.actionUser._id);
          const isRead = user.readNotifications.includes(notification._id);
          return {
            ...notification.toObject(),
            isRead:isRead,
            actionUser: {
              ...notification.actionUser.toObject(),
              isFollowing,
            },
          };
        })
      );

      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching follower notifications' });
    }
  };

  // Fetch post notifications
  const getPostNotifications = async (req, res) => {
    try {
      const user = await User.findById(req.user?._id).populate({
        path: 'notifications',
        match: { type: { $in: ['like', 'comment', 'post'] } },
        options: { sort: { createdAt: -1 } },
        populate: [
          { path: 'actionUser', select: '_id username name profileimg' },
          { path: 'post', select: '_id content' },
          { path: 'user', select: '_id username name' }
        ]
      });
      
      const notifications = await Promise.all(
        user.notifications.map(async (notification) => {
          const isRead = user.readNotifications.includes(notification._id);
          
          return {
            ...notification.toObject(),
            isRead:isRead
          };
        })
      );
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching post notifications' });
    }
  };
 
 const setReadNotification =async(req,res)=>{
       const {notificationId}=req.body;
       try {
           const user=await User.findById(req.user?._id);
           if(!user.readNotifications.includes(notificationId)){
           user.readNotifications.push(notificationId);
           }
           await user.save();
           res.status(200).json("notification read successfully");
       } catch (error) {
        res.status(500).json({ message: 'Error reading notifications' });
       }
 }

 const deleteNotification = async (req, res) => {
    const { notificationId } = req.body;
    try {
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $pull: {
            notifications: notificationId,
            readNotifications: notificationId
          }
        },
        { new: true }
      );
      if (!user)return res.status(404).json({ message: 'User not found or notification does not exist' });
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting notification' });
    }
  };
  
  const getUnseenMessageCount=async(req,res)=>{
  try {
    const unseenCount = await Message.countDocuments({receiver: req.user?._id,status: { $ne:'seen'}});
    res.status(200).json({unseenCount});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Unseen notification' });
  }
  }

export {LogOut,SignUp,LogIn,Intro,About,Education,deleteEducation,Experience,deleteExperience,Skill,getProfile,followUser,getTotalImpressions,getFollowerSuggestions,getUserFollowers,getUserFollowings,getUserFollowerList,getUserFollowingList,UserProfileImage,UserCoverImage,getUserFollowersSummary,getFollowerNotifications,getPostNotifications,setReadNotification,deleteNotification,getUnseenMessageCount}