const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    google_id: String,
    Name: String,
    email: String,
    profileimg :String
},{timestamps:true});

//saving schema to database
const UsersDB = new mongoose.model("users", userSchema);

//exporting db
module.exports = UsersDB;



