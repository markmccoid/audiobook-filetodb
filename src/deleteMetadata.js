const fs = require("fs");

function deleteMetadataFiles(path) {
  const files = fs.readdirSync(path);
  for (const file of files) {
    const fullPath = path + "/" + file;
    if (fs.lstatSync(fullPath).isDirectory()) {
      deleteMetadataFiles(fullPath);
    } else if (file.endsWith(".json") && file.includes("metadata")) {
      fs.unlinkSync(fullPath);
    }
  }
}

if (process.argv.length < 3) {
  console.error("Please provide the path to the directory to search.");
  process.exit(1);
}

const pathIn = process.argv[2];
deleteMetadataFiles(pathIn);
