/**
 * Function will read through a directory structure and return an object
 * of meta data.
 * Expects the directory structure to be formatted as follows if you pass in:
 * c:\hold\Fiction
 * - GenreOne
 * | - Author-Title
 * | - Author-Title
 * - GenreTwo
 * | - Author-Title
 * | - Author-Title
 *  ...
 *
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

import { parseFolderName, parseBookInfoText, getMetadataFromFile, updateMongoDb } from "./parsers";
import { getBookData, fakeGetBookData } from "./fetchData";
import type { BookInfo } from "./parsers";
import type { GoogleData } from "./fetchData";
import { createCleanFile } from "./audiobook-createCleanFile";
import { getChapterData } from "./toneChapters";
export type FolderMetadata = {
  id: string;
  folderName: string;
  fullPath: string;
  audioFileCount: number;
  textFileCount: number;
  dirCount: number;
  infoFileData: BookInfo;
  folderImages: string[];
  folderNameData: {
    title: string;
    publishedYear: string;
    author: string;
    category: string;
  };
  googleAPIData: GoogleData;
  mongoDBId: string | undefined;
  forceMongoUpdate?: boolean | undefined;
};

//-- Local contants
const AUDIOFORMATS = [".mp3", ".mb4", ".mp4", ".m4a"];
const IMAGEFORMATS = [".jpg", ".png"];
/**
 * Convert the passed dirPath to use the passed pathSep
 * @param {*} dirPath
 * @param {*} pathSep
 * @returns
 */
function formatPath(dirPath, pathSep = "/") {
  const pathArray = dirPath.split(path.sep);
  return pathArray.join(pathSep);
}

//~ - TYPE
type FirstPassObj = {
  basePath: string;
  baseName: string;
  dirCount: number;
  audioFileCount: number;
  textFileCount: number;
  folderImages: string[];
  dirArray: string[];
  bookInfo: BookInfo;
};
/**
 * no = do not query google
 * yes = query google IF no google data found in folders metadata json file
 * force = query google regardless of precense in metadata json file
 */
type QueryGoogle = "no" | "yes" | "force";

//--======================================================
//-- Recursive Walk Function to write Metadata file
//-- In each directory.  Return
//--======================================================
export async function walkAndTagDirs(
  // Directory to start at
  dir: string,
  // "no" | "yes" | "force" default "no"
  // Should we query google? "yes" will only query google if folder' metadata DOES NOT
  // have any google info.  "force" will force a search regardless of data in metadata json file
  queryGoogle?: QueryGoogle,
  // Used in recursion (do not pass when calling)
  // Should we update/create records in MongoDB
  mongoDBUpdateFlag?: boolean,
  processChapters?: boolean,
  chapterFileTypes?: "m4b" | "both",
  chapterForce?: boolean,
  // Used in recursion (do not pass when calling at top level)
  dirArray?: string[],
  folderMetadataArray?: FolderMetadata[]
): Promise<{
  queryGoogle: QueryGoogle;
  dirArray: string[];
  folderMetadataArray: FolderMetadata[];
}>;
export async function walkAndTagDirs(
  dir: string,
  queryGoogle: QueryGoogle = "no",
  mongoDBUpdateFlag: boolean = true,
  processChapters: boolean = true,
  chapterFileTypes: "m4b" | "both" = "m4b",
  chapterForce = false,
  dirArray: string[] = [],
  folderMetadataArray: FolderMetadata[] = []
) {
  // Read the directory passed (probably need a check or error handling if not a dir passed)
  // Exclude any files or directories that have "_ignore" in them.
  const files = fs.readdirSync(dir).filter((file) => !file.toLowerCase().includes("_ignore"));
  let terminalDirFlag = false;
  const directDirName = formatPath(dir);
  const baseName = path.basename(dir);

  const currentMetadata: {
    googleData: GoogleData;
    wasGoogleQueried: boolean;
    mongoDBId;
    forceMongoUpdate;
  } = {
    googleData: undefined,
    wasGoogleQueried: false,
    mongoDBId: undefined,
    forceMongoUpdate: false,
  };
  const {
    id: folderId,
    author: folderBookAuthor,
    title: folderBookTitle,
    category: folderBookCategory,
    year: folderBookYear,
  } = parseFolderName(path.basename(dir));

  //-- First loop does NOT recurse, but builds info
  //-- and sets terminalDirFlag (no more recursing)
  let firstPassObj: FirstPassObj = {
    basePath: directDirName,
    baseName: baseName,
    dirCount: 0,
    audioFileCount: 0,
    textFileCount: 0,
    folderImages: [],
    dirArray: [],
    bookInfo: {},
  };

  //~ ---------------------------------
  //~ First Pass Start  ---------------
  //~ ---------------------------------
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const dirPath = path.join(dir, files[i]);
    const isDir = fs.statSync(dirPath).isDirectory();
    const ext = path.extname(files[i]);

    // if (fileName.includes("Other_")) {
    //   console.log("Other found", fileName, dirPath);
    //   terminalDirFlag = true;
    //   break;
    // }
    //--assign to dirArray if in directory
    if (isDir) {
      firstPassObj.dirCount = firstPassObj.dirCount + 1;
      firstPassObj.dirArray.push(dirPath);
    }
    //-- count audio files
    if (AUDIOFORMATS.some((el) => el === ext)) {
      firstPassObj.audioFileCount = firstPassObj.audioFileCount + 1;
    }
    //-- delete txt file if has the "downloaded from" in it
    if (ext === ".txt" && fileName.toLowerCase().includes("downloaded from")) {
      fs.unlinkSync(dirPath);
    }

    //-- if txt file and has part of the author extracted from folder then process as info file
    if (
      ext === ".txt" &&
      fileName.toLowerCase().includes(folderBookAuthor.toLowerCase().slice(0, 4))
    ) {
      firstPassObj.textFileCount = firstPassObj.textFileCount + 1;
      firstPassObj.bookInfo = parseBookInfoText(dirPath);
    }
    if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
      // if metadata json file exists pull some data to determine if we need to
      // query google and/or upload to mongoDB
      const { googleData, mongoDBId, forceMongoUpdate } = getMetadataFromFile(dirPath);
      currentMetadata.googleData = googleData;
      currentMetadata.mongoDBId = mongoDBId;
      currentMetadata.forceMongoUpdate = forceMongoUpdate; // if true, we will update mongo
    }

    //-- store images in file
    if (IMAGEFORMATS.some((el) => el === ext)) {
      firstPassObj.folderImages.push(fileName);
    }
  }
  //~ ---------------------------------
  //~ First Pass END ------------------
  //~ ---------------------------------

  // console.log("firstPassObj", firstPassObj);
  // Is the directory we just read an Audio book directory?
  // dirCount is zero OR audiobook file count > 0 OR bookInfo is populated
  // If so :
  // 1. Set "terminalDirFlag" so that we don't recurse even if directories in the dirArray
  // 2. Create Object with info about book in directory
  // 3. Push that onto the fileArray (will build a final array of books)
  // 4. Create/Write a json book metadata file in the current directory
  //    filename - {bookTitle}-{bookAuthor}-metadata.json
  if (
    firstPassObj.dirCount === 0 ||
    firstPassObj.audioFileCount > 0 ||
    Object.keys(firstPassObj.bookInfo).length > 0 ||
    firstPassObj.bookInfo?.stopFlag // Allows you to create a stopFlag field in the folder .txt file to stop processing
  ) {
    terminalDirFlag = true;
    let googleData;
    // if query flag true AND we didn't already find populated google data, then query
    // else keep same
    if ((queryGoogle === "yes" && !currentMetadata.googleData) || queryGoogle === "force") {
      // console.log("In Getting goold Data");
      googleData = await getBookData(folderBookAuthor, folderBookTitle);
      currentMetadata.wasGoogleQueried = true;
    } else {
      googleData = currentMetadata.googleData || {};
      currentMetadata.wasGoogleQueried = false;
    }

    // console.log("IN FILE Array - Terminal Dir Flag", terminalDirFlag);
    // This file will be written to the title-author-metadata.json file in the
    // audio book directory
    const folderMetadata: FolderMetadata = {
      id: folderId,
      folderName: firstPassObj.baseName,
      fullPath: firstPassObj.basePath,
      audioFileCount: firstPassObj.audioFileCount,
      textFileCount: firstPassObj.textFileCount,
      infoFileData: firstPassObj.bookInfo,
      dirCount: firstPassObj.dirCount,
      folderImages: firstPassObj.folderImages,
      folderNameData: {
        title: folderBookTitle,
        publishedYear: folderBookYear,
        author: folderBookAuthor,
        category: folderBookCategory,
      },
      googleAPIData: googleData,
      mongoDBId: currentMetadata.mongoDBId, // Temp value, will be updated after update function
      forceMongoUpdate: currentMetadata.forceMongoUpdate,
    };

    // Will add book to mongo if not already there and update the mongoDBId on the folderMetadata record at same time.
    // passing object so it will update in function
    if (mongoDBUpdateFlag) {
      await updateMongoDb(folderMetadata);
    }

    folderMetadataArray.push(folderMetadata);

    // Construct filename for metadata
    const outTitle = folderBookTitle;
    const outAuthor =
      firstPassObj.bookInfo.author === "" || !firstPassObj.bookInfo.author
        ? folderBookAuthor
        : firstPassObj.bookInfo.author;
    const tempFilename = `${outTitle}-${outAuthor}`;
    // Sanitize filename
    const re = /^[ .]|[/<>:\"\\|?*]+|[ .]$/;
    const outFilename = tempFilename.replace(re, "_");
    fs.writeFileSync(
      `${firstPassObj.basePath}/${outTitle}-${outAuthor}-metadata.json`,
      JSON.stringify(folderMetadata)
    );
    // Console output the status
    console.log(
      chalk.cyan(outFilename),
      " - Processed ",
      chalk.bgCyan(currentMetadata.wasGoogleQueried ? " !Google Queried!" : "")
    );

    // Call TONE.exe to get potential chapter information
    //! Need to be able to pass flag to force overwrite of existing file
    if (processChapters) {
      await getChapterData(`${firstPassObj.basePath}`, chapterFileTypes, chapterForce);
    }
  }

  if (terminalDirFlag) {
    return { queryGoogle, dirArray, folderMetadataArray };
  }
  //! Loop only using the FirstPassObj
  const firstPassDirs = firstPassObj.dirArray;

  for (let i = 0; i < firstPassDirs.length; i++) {
    if (firstPassDirs[i]) {
      const dirPath = firstPassDirs[i];
      // dirArray.push({
      //   path: formatPath(dirPath),
      //   dirCount: firstPassObj.dirCount,
      //   baseDir: firstPassObj.baseName,
      // });
      // dirLog = { ...dirLog, dirObj };
      dirArray.push(formatPath(dirPath));
      await walkAndTagDirs(
        dirPath,
        queryGoogle,
        mongoDBUpdateFlag,
        processChapters,
        chapterFileTypes,
        chapterForce,
        dirArray,
        folderMetadataArray
      );
    }
  }

  return { queryGoogle, dirArray, folderMetadataArray };

  //! END FIRST PASS RECURSE LOOP
}

//--======================================================
//-- Recursive Walk Function to write Metadata file
//-- In each directory.  Return
//--======================================================
export function walkAndAggrMetadata(
  dir: string,
  dirArray?: string[],
  folderMetadataArray?: FolderMetadata[] //Record<string, string>[]
): {
  dirArray: string[];
  folderMetadataArray: FolderMetadata[]; //Record<string, string>[];
};
export function walkAndAggrMetadata(dir, dirArray = [], folderMetadataArray = []) {
  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const dirPath = path.join(dir, files[i]);
    const isDir = fs.statSync(dirPath).isDirectory();
    const ext = path.extname(files[i]);

    if (isDir) {
      walkAndAggrMetadata(dirPath, dirArray, folderMetadataArray);
    }

    if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
      const metadata: FolderMetadata = JSON.parse(fs.readFileSync(dirPath, "utf8"));
      folderMetadataArray.push(metadata);
    }
  }
  return { dirArray, folderMetadataArray };
}

//-------------------------------------
//-- writeAggrMetaData
//-------------------------------------
export function writeAggrMetaData(
  dir: string,
  outputPath?: string,
  outputFilename?: string,
  createCleanFileFlag?: boolean,
  depthToCategory?: number
): string;
export function writeAggrMetaData(
  dir,
  outputPath,
  outputFilename = "audioBookMetadata.json",
  createCleanFileFlag = false,
  depthToCategory = undefined
) {
  const res = walkAndAggrMetadata(dir);

  fs.writeFileSync(
    path.join(outputPath || dir, outputFilename),
    JSON.stringify(res.folderMetadataArray)
  );
  if (createCleanFileFlag) {
    const cleanFile = createCleanFile(res.folderMetadataArray, depthToCategory);
    fs.writeFileSync(
      path.join(outputPath || dir, `clean-${outputFilename}`),
      JSON.stringify(cleanFile)
    );
  }
  return "Success";
}
