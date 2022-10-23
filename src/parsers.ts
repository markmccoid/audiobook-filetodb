import { GoogleData } from "./fetchData";
import fs from "fs";
import { FolderMetadata } from "./audiobook-walkdir";

type ExtractCategoryReturn = {
  category: string | undefined;
  withoutCategory: string;
};
//--======================================================
//-- Extract Category from folder name
//--======================================================
/**
 * Expects name to be audio book Folder Name with a
 * category enclosed in parens.  If both opening and closing
 * parens not found, then the withoutCategory will be name unchanged
 * and category will be undefined
 *
 * @param name
 * @returns Object - { category: string | undefined;  withoutCategory: string; };
 */
function extractCategory(name: string): ExtractCategoryReturn {
  const returnObj: ExtractCategoryReturn = {
    category: undefined,
    withoutCategory: name,
  };
  const startParen = name.indexOf("(") + 1;
  const endParen = name.indexOf(")");
  if (startParen !== -1 && endParen !== -1) {
    returnObj.category = name.slice(startParen, endParen);
    returnObj.withoutCategory = name.slice(0, startParen - 1).trim();
  }
  return returnObj;
}

//--======================================================
//-- isYear helper.  Just confirms string has only 4 numbers in it
//--======================================================
function isYear(yearCheck: string) {
  let isNum = /^\d\d\d\d$/.test(yearCheck);
  return isNum;
}

//--======================================================
//-- Parse Folder Name
//--======================================================
export function parseFolderName(folderName: string) {
  const { category, withoutCategory } = extractCategory(folderName);
  let year = "";
  let authorArr = [];
  let titleArr = [];

  // Create an array splitting on the "-"
  const nameParseArray = withoutCategory.split("-");

  // Find the which element holds the year (this could be undefined)
  let yearIndex = nameParseArray
    .map((el, index) => (isYear(el.trim()) ? index : undefined))
    .filter((el) => el)[0];
  //-- Store the Year or empty
  year = yearIndex ? nameParseArray[yearIndex].trim() : "";
  // If there is no year, put a dummy element at year position
  // so that author and title code works the same for both with and w/o year
  !yearIndex && nameParseArray.splice(1, 0, "X");
  yearIndex = yearIndex ? yearIndex : 1;
  //-- Get Author up to yearIndex (or first hyphen)
  for (let i = 0; i < yearIndex; i++) {
    authorArr.push(nameParseArray[i]);
  }
  //-- Get title by grabbing all elements after the yearIndex
  for (let i = yearIndex + 1; i < nameParseArray.length; i++) {
    titleArr.push(nameParseArray[i]);
  }
  const rxSpecChars = /[,.']/g;
  const rxDoubleSpace = /\s\s/g;
  const folderIdAuth = authorArr
    .join("")
    .trim()
    .replace(rxSpecChars, "")
    .replace(rxDoubleSpace, " ");
  const folderIdTitle = titleArr
    .join("")
    .trim()
    .replace(rxSpecChars, "")
    .replace(rxDoubleSpace, " ");

  return {
    id: `${folderIdAuth}~${folderIdTitle}`.replace(/\s/g, "_"),
    year,
    author: authorArr.join("-").trim(),
    title: titleArr.join("-").trim(),
    category: category || "",
  };
}

//--======================================================
//-- Parse Book Info Text file
//--======================================================
export type BookInfo = {
  summary?: string;
  length?: string;
  author?: string;
  narratedBy?: string;
  releaseDate?: string;
  otherCategories?: string[];
};
export function parseBookInfoText(textFile) {
  let lines = fs.readFileSync(textFile, "utf8").toString().split("\r\n");
  if (lines.length === 1) {
    lines = fs.readFileSync(textFile, "utf16le").toString().split("\r\n");
  }
  let foundSummaryFlag = false;
  let bookInfo: BookInfo = {};
  let summary = [];
  for (let line of lines) {
    // Since summary exists at the end of the file and is multiple line
    // We set a flag and once true, just push all lines into summary array
    // before returning, we join array elements
    if (foundSummaryFlag) {
      summary.push(line);
      continue;
    }
    const lowercaseLine = line.toLowerCase();
    //-- Length Of Book
    if (lowercaseLine.includes("length:")) {
      bookInfo.length = line
        .slice(line.toLowerCase().indexOf("length:") + 7)
        .trim();
      continue;
    }
    //-- Author and Narrator
    if (lowercaseLine.includes("by:")) {
      if (lowercaseLine.indexOf("by:") < 2) {
        bookInfo.author = line.substring(lowercaseLine.indexOf(":") + 1).trim();
      }
      if (
        lowercaseLine.indexOf("by:") > 2 &&
        lowercaseLine.includes("narrat")
      ) {
        bookInfo.narratedBy = line
          .substring(lowercaseLine.indexOf(":") + 1)
          .trim();
      }
      continue;
    }
    //-- Release date
    if (lowercaseLine.includes("release")) {
      bookInfo.releaseDate = line
        .substring(lowercaseLine.indexOf(":") + 1)
        .trim();
    }
    //-- Other Categories
    if (lowercaseLine.includes("categor")) {
      bookInfo.otherCategories = line
        .substring(lowercaseLine.indexOf(":") + 1)
        .trim()
        .split(",")
        .map((el) => el.trim());
    }
    //-- Publisher Summary
    if (
      lowercaseLine.includes("publisher's summary") ||
      lowercaseLine.includes("summary")
    ) {
      foundSummaryFlag = true;
      continue;
    }
  }
  bookInfo.summary = summary.join(" ").trim();
  return bookInfo;
}

//--======================================================
//-- Get info from existing Metadata JSON
//--======================================================
export function getMetadataFromFile(dirPath: string): GoogleData {
  const metadata: FolderMetadata = JSON.parse(fs.readFileSync(dirPath, "utf8"));

  const queryDate = new Date(
    metadata?.googleAPIData?.queryDateString || "01/01/1970"
  );
  const todaysDate = new Date();
  const daysSinceLastQuery = Math.floor(
    // @ts-ignore
    (todaysDate - queryDate) / (1000 * 60 * 60 * 24)
  );
  // Check to make sure googleAPIData is populated with something
  // OR if it has only been 30 days since last query
  if (
    (metadata.googleAPIData?.title?.length > 1 &&
      metadata.googleAPIData?.imageURL?.length > 1 &&
      metadata.googleAPIData?.description?.length > 1) ||
    daysSinceLastQuery < 30
  ) {
    return metadata.googleAPIData;
  }

  return undefined;
}
