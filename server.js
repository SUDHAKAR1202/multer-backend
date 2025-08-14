require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const File = require("./models/File");
const fs = require('fs');
const uploadDir = 'uploads';
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'doc', 'docx']
    }
});

const upload = multer({ storage });

const app = express();
app.use(cors({
    origin: 'https://multer-frontend-jcw7.onrender.com/',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}

));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

//Mongodb connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));




// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
   
    const file = new File({
      filename: req.file.originalname,
      path: req.file.path, 
      url: req.file.secure_url, 
      public_id: req.file.public_id, 
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    await file.save();
    res.json({ 
      message: "File uploaded successfully",
      file: {
        _id: file._id,
        filename: file.filename,
        url: file.url,
        size: file.size
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ 
      error: error.message,
      details: "Failed to upload file to Cloudinary"
    });
  }
});

app.get('/', (req, res) => {
    res.send('Backend is working!');
})

app.get("/files", async (req, res) => {
    try {
        const files = await File.find().sort({ uploadDate: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
})