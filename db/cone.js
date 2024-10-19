import mongoose from "mongoose"
import dotenv from "dotenv";

dotenv.config(); //
const dburl = process.env.DBURL;

mongoose.connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});
