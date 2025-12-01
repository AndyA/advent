const fs = require("node:fs");
const path = require("node:path");
const data = require("../www/data.json");

const WWWROOT = "www";
const IMGDIR = "i";

function readDir(dir) {
  return fs.readdirSync(dir).map(f => path.join(dir, f));
}

const allFiles = new Set(readDir(path.join(WWWROOT, IMGDIR)));

for (const day of data) {
  for (const key of ["image_url", "background_url", "media_url"]) {
    if (day[key]) allFiles.delete(path.join(WWWROOT, day[key]));
  }
}

console.log(allFiles);
