const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const imageMiddleware = require("../middleware/image");
const { getKoreanDate } = require("../middleware/image");
const BASE_URL = "https://vavava-file.vavava.app";
const ERROR_MESSAGE = "파일 삭제 실패!";
const uploadDir = path.join(__dirname, "..", "public");

const createResponse = (statusCode, message, data = {}) => ({
	statusCode,
	message,
	...data,
});

router.post("/upload", imageMiddleware, (req, res) => {
	try {
		if (!req.file) {
			return res
				.status(400)
				.json(createResponse(400, "업로드된 파일이 없습니다."));
		}

		const dateFolder = getKoreanDate();
		const originalUrl = `${BASE_URL}/${dateFolder}/${req.thumbnail.original.filename}`;
		const thumbnailUrl = req.thumbnail.thumbnail
			? `${BASE_URL}/${dateFolder}/${req.thumbnail.thumbnail.filename}`
			: originalUrl;

		res.status(200).json(
			createResponse(200, "파일 업로드 성공!", {
				originalUrl,
				thumbnailUrl,
			})
		);
	} catch (error) {
		console.error("파일 업로드 오류:", error);
		res
			.status(500)
			.json(createResponse(500, "파일 업로드 실패!", { error: error.message }));
	}
});

const deleteFileIfExists = async (filePath) => {
	try {
		await fs.promises.access(filePath);
		await fs.promises.unlink(filePath);
		return true;
	} catch (err) {
		if (err.code !== "ENOENT") {
			console.log(`파일 삭제 실패 ${filePath}:`, err.message);
		}
		return false;
	}
};

router.delete("/delete/:id", async (req, res) => {
	const { "file-date": fileFolder } = req.headers;
	const { id: fileName } = req.params;

	if (!fileFolder || !fileName) {
		return res
			.status(400)
			.json(
				createResponse(400, "파일 폴더 또는 파일 이름이 제공되지 않았습니다.")
			);
	}

	const filePath = path.join(uploadDir, fileFolder, fileName);
	const thumbnailPath = path.join(
		uploadDir,
		fileFolder,
		`thumb_${fileName.split(".")[0]}.jpeg`
	);

	try {
		const fileDeleted = await deleteFileIfExists(filePath);
		if (!fileDeleted) {
			return res
				.status(404)
				.json(createResponse(404, "파일을 찾을 수 없습니다."));
		}

		await deleteFileIfExists(thumbnailPath);

		res.status(200).json(createResponse(200, "파일 삭제 성공!"));
	} catch (err) {
		console.error("파일 삭제 오류:", err);
		res
			.status(500)
			.json(createResponse(500, ERROR_MESSAGE, { error: err.message }));
	}
});

module.exports = router;
