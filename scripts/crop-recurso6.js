const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "..", "5x");
const inputPath = path.join(dir, "Recurso 6@5x.png");
const tempPath = path.join(dir, "Recurso-6-5x-temp.png");

sharp(inputPath)
  .trim({ threshold: 15 })
  .toFile(tempPath)
  .then((info) => {
    fs.renameSync(tempPath, inputPath);
    console.log("Recorte aplicado:", info);
  })
  .catch((err) => {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error(err);
    process.exit(1);
  });
