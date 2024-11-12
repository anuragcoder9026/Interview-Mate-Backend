import {v2 as cloudinary} from "cloudinary";
import fs from "fs";//file system for nodejs
          
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary=async(localFilePth)=>{
 try{
    if(!localFilePth) return null;
    //upload file on cloudinary
    const response=await cloudinary.uploader.upload(localFilePth,{
        resource_type:"auto"
    })
    //file has been uploaded succesfully
    fs.unlinkSync(localFilePth)
    // console.log("file has been uploaded succesfully on cloudinary",response.url);
    return response;
 }
 catch(error){
  fs.unlinkSync(localFilePth)
  return null;
 }
 
}

export {uploadOnCloudinary}
