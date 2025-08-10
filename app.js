const express = require("express");
const path = require("path");
const PORT = process.env.PORT;
const cors = require("cors");

const imageRouter = require("./routes/image");

const app = express();

const corsOptions = {
	origin: [
		"https://vavava-file.vavava.app",
		"https://vavava.app",
		"http://localhost:32705",
		"http://172.17.0.1",
	],
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/image", imageRouter);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
