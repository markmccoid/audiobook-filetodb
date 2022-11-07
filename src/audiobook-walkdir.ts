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
 * This will save a json file in the format of:
 * {
 *  "GenreOne": {
 *    "basePath": "full path to genre folder",
 *    "genre": "GenreOne",
 *    "titles": [
 *      {
 *        "author": ,
 *        "title": ,
 *       }
 *     ]
 *  }
 * }
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";

import {
  parseFolderName,
  parseBookInfoText,
  getMetadataFromFile,
} from "./parsers";
import { getBookData, fakeGetBookData } from "./fetchData";
import type { BookInfo } from "./parsers";
import type { GoogleData } from "./fetchData";

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
};

//-- Local contants
const AUDIOFORMATS = [".mp3", ".mb4", ".mp4"];
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

//! - TYPE
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
  // Should we query google? "yes" will only query google if folder's metadata DOES NOT
  // have any google info.  "force" will force a search regardless of data in metadata json file
  queryGoogle?: QueryGoogle,
  // Used in recursion (do not pass when calling)
  dirArray?: string[],
  // Used in recursion (do not pass when calling)
  folderMetadataArray?: FolderMetadata[]
): Promise<{
  queryGoogle: QueryGoogle;
  dirArray: string[];
  folderMetadataArray: FolderMetadata[];
}>;
export async function walkAndTagDirs(
  dir: string,
  queryGoogle: QueryGoogle = "no",
  dirArray: string[] = [],
  folderMetadataArray: FolderMetadata[] = []
) {
  // Read the directory passed (probably need a check or error handling if not a dir passed)
  const files = fs.readdirSync(dir);
  let terminalDirFlag = false;
  const directDirName = formatPath(dir);
  const baseName = path.basename(dir);
  const currentMetadata: { googleData: GoogleData; wasGoogleQueried: boolean } =
    { googleData: undefined, wasGoogleQueried: false };
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
      fileName
        .toLowerCase()
        .includes(folderBookAuthor.toLowerCase().slice(0, 4))
    ) {
      firstPassObj.textFileCount = firstPassObj.textFileCount + 1;
      firstPassObj.bookInfo = parseBookInfoText(dirPath);
    }
    if (ext === ".json" && fileName.toLowerCase().includes("-metadata")) {
      currentMetadata.googleData = getMetadataFromFile(dirPath);
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
    Object.keys(firstPassObj.bookInfo).length > 0
  ) {
    terminalDirFlag = true;
    let googleData;
    // if query flag true AND we didn't already find populated google data, then query
    // else keep same
    if (
      (queryGoogle === "yes" && !currentMetadata.googleData) ||
      queryGoogle === "force"
    ) {
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
    };

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
      await walkAndTagDirs(dirPath, queryGoogle, dirArray, folderMetadataArray);
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
  folderMetadataArray?: Record<string, string>[]
): {
  dirArray: string[];
  folderMetadataArray: Record<string, string>[];
};
export function walkAndAggrMetadata(
  dir,
  dirArray = [],
  folderMetadataArray = []
) {
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
      const metadata: FolderMetadata = JSON.parse(
        fs.readFileSync(dirPath, "utf8")
      );
      folderMetadataArray.push(metadata);
    }
  }
  return { dirArray, folderMetadataArray };
}

export function writeAggrMetaData(
  dir: string,
  outputPath?: string,
  outputFilename?: string
): string;
export function writeAggrMetaData(
  dir,
  outputPath,
  outputFilename = "audioBookMetadata.json"
) {
  const res = walkAndAggrMetadata(dir);

  fs.writeFileSync(
    path.join(outputPath || dir, outputFilename),
    JSON.stringify(res.folderMetadataArray)
  );
  return "Success";
}
