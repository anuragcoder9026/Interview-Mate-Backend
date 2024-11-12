import { User } from "../models/userschema.js"
import { Message } from "../models/messageSchema.js";
import { Chat } from "../models/chatSchema.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getMessageImageUrl=async(req,res)=>{
  try {
    
    const messageImg=await uploadOnCloudinary(req.file.path);
    const imageUrl=messageImg.url;
    console.log(imageUrl);
    
    return res.status(200).send(imageUrl);
  } catch (error) {
    res.status(400).send("something went wrong while getting image url.");  
  }
}

const sendMessage = async (senderId, recipientId, content,time ) => {
  try {
    const message = await Message.create({sender:senderId,receiver:recipientId,content,time});
    const senderUser=await User.findById(senderId);
    const receiverUser=await User.findById(recipientId);
    let chat = await Chat.findOne({
      $and: [
        { users: { $elemMatch: { $eq: senderId } } },
        { users: { $elemMatch: { $eq: recipientId } } },
      ],
    });

    if (!chat) {
      chat = await Chat.create({
        users: [senderId, recipientId],
        lastMessage: message._id,
      });
      senderUser.chats.push(chat._id);
      receiverUser.chats.push(chat._id);
      await senderUser.save();
      await receiverUser.save();
    } else {
      chat.lastMessage = message._id;
      await chat.save();
    }
    return message;
  } catch (error) {
    return null;
  }
};

  

  const getMessages = async (req, res) => {
    const {receiverId } = req.query;
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.user._id, receiver: receiverId },
          { sender: receiverId, receiver: req.user._id }
        ]
      }).sort({timestamp:1});
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving messages' });
    }
  };

  const getUserChatsProfiles = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentuserId } = req.body;
     
        const userWithChats = await User.findById(userId)
            .populate({
                path: 'chats',
                populate: [
                    {
                        path: 'users',
                        match: { _id: { $ne: userId } },
                        select: 'name username profileimg online',
                    },
                    {
                        path: 'lastMessage',
                        select: 'content timestamp time',
                    },
                ],
            });

        // Extract users from 'chats' with their last message and unseen message count
        const chatUsers = await Promise.all(
            userWithChats.chats.map(async (chat) => {
                const otherUser = chat.users.find(user => user._id.toString() !== userId.toString());
                if (otherUser) {
                    const unseenMessageCount = await Message.countDocuments({
                        sender: otherUser._id,
                        receiver: userId,
                        status: { $in: ['sent', 'received'] }
                    });
                    return {
                        _id: otherUser._id,
                        name: otherUser.name,
                        username: otherUser.username,
                        online: otherUser.online,
                        profileimg: otherUser.profileimg,
                        lastMessage: chat.lastMessage ? {
                            _id: chat.lastMessage._id,
                            content: chat.lastMessage.content,
                            timestamp: chat.lastMessage.timestamp,
                            time: chat.lastMessage.time
                        } : null,
                        unseenMessageCount,
                    };
                }
                return null;
            })
        );

        const filteredChatUsers = chatUsers.filter(Boolean);

        // Populate the 'following' field to get following users
        const userWithFollowing = await User.findById(userId)
            .populate({
                path: 'following',
                match: { _id: { $ne: userId } },
                select: 'name username profileimg online',
            });

        const followingUsers = userWithFollowing.following.map(user => ({
            _id: user._id,
            name: user.name,
            username: user.username,
            profileimg: user.profileimg,
            online: user.online,
            lastMessage: null,
            unseenMessageCount: 0,
        }));

        const allUsersMap = new Map();

        filteredChatUsers.forEach(user => {
            if (user) allUsersMap.set(user._id.toString(), user);
        });

        followingUsers.forEach(user => {
            if (user && !allUsersMap.has(user._id.toString())) {
                allUsersMap.set(user._id.toString(), user);
            }
        });

        // Check if current user is already in allUsersMap
        let currentUserEntry = null;
        try {
          if (currentuserId !== req.user._id && !allUsersMap.has(currentuserId.toString())) {
            const currentUser = await User.findById(currentuserId)
                .select('name username profileimg online');
                
            if (currentUser) {
                currentUserEntry = {
                    _id: currentUser._id,
                    name: currentUser.name,
                    username: currentUser.username,
                    profileimg: currentUser.profileimg,
                    online: currentUser.online,
                    lastMessage: null,
                    unseenMessageCount: 0,
                };
            }
        } 
        else {
            currentUserEntry = allUsersMap.get(currentuserId.toString());
        }
        } catch (error) {
          currentUserEntry = null;
        }
      

        const allUniqueUsers = Array.from(allUsersMap.values()).sort((a, b) => {
            if (a.lastMessage && b.lastMessage) {
                return b.lastMessage.timestamp - a.lastMessage.timestamp;
            }
            return a.lastMessage ? -1 : 1;
        });

        // Add currentUserEntry to the beginning only if it exists
        if (currentUserEntry && !allUsersMap.has(currentuserId.toString())) {
            allUniqueUsers.unshift(currentUserEntry);
        }

        res.status(200).json({ users: allUniqueUsers ,currentUser:currentUserEntry});
    } catch (error) {
        console.error('Error fetching user data with messages:', error);
        res.status(500).json({ message: 'Failed to retrieve user data with messages', error });
    }
};




  
  

  export {sendMessage,getMessages,getUserChatsProfiles,getMessageImageUrl}