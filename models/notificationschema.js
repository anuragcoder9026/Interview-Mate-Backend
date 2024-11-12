import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // user who receives the notification
  actionUser: { type: Schema.Types.ObjectId, ref: 'User' }, // user who performs the action
  type: { type: String, enum: ['follow', 'like', 'comment','post'], required: true }, // type of notification
  post: { type: Schema.Types.ObjectId, ref: 'Post' }, // post related to the notification (if applicable)
  message: { type: String, required: true }, // notification message
  createdAt: { type: Date, default: Date.now },
});

const Notification = new mongoose.model("Notification", NotificationSchema);
export {Notification};