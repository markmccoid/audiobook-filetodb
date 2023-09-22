const execSync = require("child_process").execSync;
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");

//~ Function called from walkDir
// fileTypes = 1 only m4b process
// fileTypes = 2 both m4b and mp3 process
export async function getChapterData(filePath, fileTypes = "m4b", forceRebuild = false) {
  let audioFilenames = getAudioFiles(filePath, fileTypes);
  // only use the first 2
  audioFilenames = audioFilenames.slice(0, 2);
  let logInfo;
  for (let audioFilename of audioFilenames) {
    const laabJSONFileName = `${sanitizeString(audioFilename)}_laabmeta.json`;
    // If
    if (fs.existsSync(path.join(filePath, laabJSONFileName)) && !forceRebuild) {
      console.log(
        "CHAPTER->",
        chalk.blue.bgWhite(sanitizeString(audioFilename)),
        " - chapter data exists "
      );
      continue;
    }
    try {
      const laabJSON = await callToneProcess(filePath, audioFilename);
      // Get the output filename
      const finalfileName = sanitizeString(audioFilename);
      fs.writeFileSync(path.join(filePath, laabJSONFileName), JSON.stringify(laabJSON));
      logInfo = `${finalfileName}_laabmeta.json \n${logInfo}`;
      console.log(
        "CHAPTER->",
        chalk.bgGreen(audioFilename),
        " - chapter data Processed to ",
        chalk.cyan(finalfileName)
      );
    } catch (err) {
      console.log(chalk.bgRed(audioFilename), " - chapter data failed ");
      // console.log("JSON Parse Err", err);
    }
  }
  return logInfo;
}

async function callToneProcess(filePath, fileName) {
  const pathPlusFilename = path.join(filePath, fileName);
  const externalCommand = `tone dump "${pathPlusFilename}" --format json --exclude-property=description --exclude-property=comment --exclude-property=embeddedPictures`;

  const toneMetaResult = execSync(externalCommand);
  // console.log("OUTPUT", toneMetaResult.toString());
  // Convert the result to string and then remove extra line feeds
  const finalJSON = JSON.parse(toneMetaResult.toString().replace(/\r\n/g, " "));
  // const output = execSync(command, { enconding: "utf-8" });
  // Build the chapters
  const chapters = buildChapters(finalJSON?.meta?.chapters);

  // Build the final JSON Output
  const laabJSON = {
    fileName: finalJSON?.file?.name,
    album: finalJSON?.meta?.album,
    albumArtist: finalJSON?.meta?.albumArtist,
    artist: finalJSON?.meta?.artist,
    copyright: finalJSON?.meta?.copyright,
    genre: finalJSON?.meta?.genre,
    narrator: finalJSON?.meta?.narrator,
    publisher: finalJSON?.meta?.publisher,
    publishingDate: finalJSON?.meta?.publishingDate,
    recordingDate: finalJSON?.meta?.recordingDate,
    title: finalJSON?.meta?.title,
    chapters,
  };
  return laabJSON;
}

function buildChapters(chapters) {
  if (!chapters) return;

  let chapterArray = [];
  for (const chapter of chapters) {
    const startSeconds = Math.ceil(chapter.start / 1000);
    // If the chapter duration is zero, make endSeconds == startSeconds
    const endSeconds =
      chapter.length === 0 ? startSeconds : Math.floor((chapter.start + chapter.length) / 1000);
    const durationSeconds = endSeconds - startSeconds;

    chapterArray.push({
      title: chapter.title,
      startSeconds,
      endSeconds,
      durationSeconds,
      startMilliSeconds: chapter.start,
      endMilliSeconds: chapter.start + chapter.length,
      lengthMilliSeconds: chapter.length,
    });
  }
  return chapterArray;
}

// Read a directory and return the filename of all m4b and mp3 files.
function getAudioFiles(filePath, fileTypes) {
  const files = fs.readdirSync(filePath);
  let audioFiles = [];
  if (fileTypes === "m4b") {
    audioFiles = files.filter((file) => file.endsWith(".m4b"));
  } else {
    audioFiles = files.filter((file) => file.endsWith(".m4b") || file.endsWith(".mp3"));
  }
  return audioFiles;
}

//NOTE: This MUST be the same logic as in little-ape-audio
// src/store/data/fileSystemAccess.ts -> getCleanFileName() function
function sanitizeString(stringToKey) {
  return stringToKey.replace(/[^/^\w.]+/g, "_").replace(/_$/, "");
}

// getChapterData(
//   // "D:/Dropbox/Mark/myAudioBooks/Fiction/Fantasy/Jim Butcher-Dead Beat Dresdon Files 7"
//   "D:/Dropbox/Mark/myAudioBooks/Fiction/SciFi/N-Z/Andy Weir-The Egg and Other Stories"
// );

// exports.module({
//   getChapterData,
// });
