const fs = require("fs");
const path = require("path");
const multer = require("multer");
const randomString = require("randomstring");
const sharp = require("sharp");

const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 630;
const THUMBNAIL_QUALITY = 80;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES_PER_TYPE = 10;

const generateImageThumbnail = async (filePath, thumbnailPath) => {
	return sharp(filePath)
		.resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: "cover" })
		.jpeg({ quality: THUMBNAIL_QUALITY })
		.toFile(thumbnailPath);
};

const ensureDirectoryExists = (dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
};

const generateFileName = (mimeType) => {
	const ext = mimeType.split("/")[1];
	return `${randomString.generate(12)}.${ext}`;
};

const getKoreanDate = () => {
	const now = new Date();
	const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
	return koreanTime.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
};

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const koreanDate = getKoreanDate();
		const dest = path.join(__dirname, "..", "public", koreanDate);
		ensureDirectoryExists(dest);
		cb(null, dest);
	},
	filename: (req, file, cb) => {
		cb(null, generateFileName(file.mimetype));
	},
});

const upload = multer({
	storage,
	limits: { fileSize: MAX_FILE_SIZE },
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"), false);
		}
	}
}).single("image");

const processSingleFile = async (file) => {
	const thumbnailName = `thumb_${path.parse(file.filename).name}.jpeg`;
	const thumbnailPath = path.join(path.dirname(file.path), thumbnailName);
	
	try {
		await generateImageThumbnail(file.path, thumbnailPath);
		return {
			original: file,
			thumbnail: {
				filename: thumbnailName,
				path: thumbnailPath,
			},
		};
	} catch (error) {
		console.error(`썸네일 생성 실패 for ${file.filename}:`, error);
		return {
			original: file,
			thumbnail: null,
		};
	}
};

const uploadMiddleware = (req, res, next) => {
	upload(req, res, async (err) => {
		if (err) return next(err);
		if (!req.file) return next();

		try {
			const thumbnail = await processSingleFile(req.file);
			req.thumbnail = thumbnail;
			next();
		} catch (error) {
			console.error("미들웨어 처리 오류:", error);
			next(error);
		}
	});
};

module.exports = uploadMiddleware;
module.exports.getKoreanDate = getKoreanDate;