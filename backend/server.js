const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ruta base
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// ejemplo endpoint
app.get("/test", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log("RUNNING 🚀 " + PORT);
});
