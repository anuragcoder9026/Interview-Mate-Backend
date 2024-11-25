import { User } from "../models/userschema.js"
import { Message } from "../models/messageSchema.js";
import { Chat } from "../models/chatSchema.js";
import { Event } from "../models/eventSchema.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { EventChat } from "../models/eventChatSchema.js";
const createEvent=async(req,res)=>{
    
  const{title,detail,time}=req.body;
  try {
    const event=await Event.create({title,detail,eventAdmin:req.user._id,time});
    let createdEvent=await Event.findById(event._id); 
    if(!createdEvent)return res.status(500).send("something went wrong while creating event");
    const user = await User.findById(req.user._id);
    user.events.push(createdEvent._id);
    await user.save();
    res.status(200).send("event created SuccessFully"); 
  } catch (error) {
    console.log(error);
    res.status(400).send("something went wrong while creating event");  
  }
}

const getEvent = async (req, res) => {
  const { eventId } = req.query;

  try {
    const event = await Event.findById(eventId)
      .populate({
        path: 'chats', // Populate the chats field
        populate: [
          {
            path: 'chatUser', // Populate the user who sent the chat
            select: 'username profileimg name _id',
          },
          {
            path: 'repliedTo', // Populate the repliedTo field (references another EventChat)
            select: 'username profileimg name', // Include text and chatUser of the replied message
          },
        ],
      })
      .exec();

 
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const chats = event.chats.map((chat) => ({
      id: chat._id,
      user: chat.chatUser?.name || 'Unknown User',
      userId:chat.chatUser?._id,
      content: chat.text,
      userType: chat.isAdminChat ? 'admin' : 'default',
      avatar: chat.chatUser?.profileimg || null,
      replyTo: chat.repliedTo || null, // If repliedTo is null, return null
    }));

    const response = {
      eventId: event._id,
      eventAdmin: event.eventAdmin?._id || null,
      status:event.status,
      chats,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event', error });
  }
};


const getAllActiveEvents = async (req, res) => {
    try {
      const events = await Event.find({ status: { $ne: 'ended' } })
        .populate({
          path: 'eventAdmin',
          select: 'username profileimg name',
        })
        .exec();
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching events', error });
    }
  };

  const getAllSavedEvents = async (req, res) => {
    try {
      const userId = req.user._id; 
      const user = await User.findById(userId).select('savedEvents').exec();
      if (!user) return res.status(404).json({ message: 'User not found' });
      const savedEvents = await Event.find({ _id: { $in: user.savedEvents } })
        .populate({
          path: 'eventAdmin',
          select: 'username profileimg name', 
        })
        .exec();
      res.status(200).json(savedEvents);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching saved events', error });
    }
  };

  const getUserEvents = async (req, res) => {
    try {
      const userId = req.user._id; 
      const user = await User.findById(userId).select('events').exec();
      if (!user) return res.status(404).json({ message: 'User not found' });
      const events = await Event.find({ _id: { $in: user.events } })
        .populate({
          path: 'eventAdmin',
          select: 'username profileimg name', 
        })
        .exec();
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching events', error });
    }
  };


  const saveEvent=async (req,res)=>{
    if(!req.user) return res.status(400).send("not Authenticated");
    const {eventId,save}=req.body;
    
    try {
        let user=await User.findById(req.user._id);
      if (save === 'Save') {
          if (!user.savedEvents.includes(eventId)) {
              user.savedEvents.push(eventId);
          }
          await user.save();
          res.status(200).send({ "message": `Event Saved SuccessFully.` });
      } else if (save === 'Unsave') {
        if (user.savedEvents.includes(eventId)) {
            user.savedEvents = user.savedEvents.filter(event => event.toString()!== eventId.toString());
        }
          await user.save();
          res.status(200).send({ "message": `Event UnSaved SuccessFully.` });
      } else {
          res.status(400).json({ "message": "Invalid Event action" });
      }
  } catch (error) {
      res.status(400).send({"message":"something went wrong"})
  }
}
export {createEvent,getAllActiveEvents,saveEvent,getAllSavedEvents,getUserEvents,getEvent}