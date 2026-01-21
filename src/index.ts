import express from "express";
import router from "./routes/subjects";
import cors from "cors";

const app = express();

const PORT = 8000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());

app.use("/api/subjects", router);

app.get("/", (req, res) => {
  res.send("Hello welcome to classroom API");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
