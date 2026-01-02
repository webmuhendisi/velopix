import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Uploads klasörünü oluştur
const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Image optimization function
async function optimizeImage(inputPath: string, outputPath: string): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(1920, 1920, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(outputPath);
  } catch (error) {
    // If optimization fails, just copy the original
    fs.copyFileSync(inputPath, outputPath);
  }
}

// Multer storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Dosya adını benzersiz yap: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    
    cb(null, filename);
  },
});

// Dosya filtresi - resimler ve videolar
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|ogg|mov|avi/;
  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImageTypes.test(ext) && file.mimetype.startsWith("image/");
  const isVideo = allowedVideoTypes.test(ext) && file.mimetype.startsWith("video/");

  if (isImage || isVideo) {
    return cb(null, true);
  } else {
    cb(new Error("Sadece resim (jpeg, jpg, png, gif, webp) veya video (mp4, webm, ogg, mov, avi) dosyaları yüklenebilir"));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (videolar için daha fazla)
  },
  fileFilter: fileFilter,
});

// Middleware to optimize images after upload
export async function optimizeUploadedImage(filePath: string): Promise<string> {
  if (!filePath || !fs.existsSync(filePath)) {
    return filePath;
  }

  const ext = path.extname(filePath).toLowerCase();
  const isImage = [".jpg", ".jpeg", ".png", ".gif"].includes(ext);

  if (!isImage) {
    return filePath;
  }

  try {
    const webpPath = filePath.replace(/\.[^.]+$/, ".webp");
    await optimizeImage(filePath, webpPath);
    
    // Delete original if WebP was created successfully
    if (fs.existsSync(webpPath)) {
      fs.unlinkSync(filePath);
      return webpPath;
    }
  } catch (error) {
    console.error("Image optimization error:", error);
  }

  return filePath;
}

