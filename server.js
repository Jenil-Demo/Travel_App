require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const luggageRoutes = require("./routes/luggageRoutes");
const masterRoutes = require("./routes/masterRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/luggage", luggageRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => res.send("API is running..."));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
