import { v2 as cloudinary } from 'cloudinary'
import * as fs from 'fs'

// Configure your Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Function to upload file and return URL
const uploadToCloudinary = async (filePath: string) => {
  try {
    if (!filePath) {
      throw new Error('File path is required')
    }
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    })
    fs.unlinkSync(filePath)
    return response
  } catch (error: Error | any) {
    // Handle the error appropriately
    console.error('Error uploading file to Cloudinary:', error)
    fs.unlinkSync(filePath)
    // Optionally, you can rethrow the error or handle it as needed
    throw new Error('Failed to upload file to Cloudinary: ' + error.message)
  }
}

export { uploadToCloudinary }
