const path = require("path");

const promisfy = (val) => new Promise((resolve, reject) => resolve(val));
export const bookOrMusicQuestion = [
  {
    type: "list",
    name: "bookOrMusic",
    message: "Process Audiobooks or Music",
    choices: ["Audiobooks", "Music"],
    filter(val) {
      return val.toLowerCase();
    },
  },
];

export type MusicAnswers = {
  dir: string;
  depth: number;
  outputfileName: string;
  outputLocation: string;
};
export const musicQuestions = [
  {
    type: "input",
    name: "dir",
    message: "What is the directory to start from?",
    default: "D:/Dropbox/Mark/myMusic",
    filter(val) {
      return fixPath(val);
    },
  },
  {
    type: "list",
    name: "depth",
    message: "Depth? If first dir is Artist then 0, if Genre then -1",
    choices: [-1, 0],
  },
  {
    type: "input",
    name: "outputfileName",
    message: "Output filename?",
    default: "music-data.json",
    filter(val) {
      const extName = path.extname(val);
      if (extName !== ".json") {
        val = `${val}.json`;
      }
      return val;
    },
  },
  {
    type: "input",
    name: "outputLocation",
    message: "What is the directory to for Output file?",
    default: "D:/Dropbox/Mark/myMusic",
    filter(val) {
      return fixPath(val);
    },
  },
];

export type BookAnswers = {
  startingDir: string;
  depthToCategory: number;
  mongoDBUpdateFlag: boolean;
  outputFilename: string;
  outputDir: string;
  queryGoogle: "yes" | "no" | "force";
  onlyAggregateFlag: boolean;
};
export const bookQuestions = [
  {
    type: "input",
    name: "startingDir",
    message: "What is the directory to start from?",
    default: "D:/Dropbox/Mark/myAudioBooks",
    filter(val) {
      return fixPath(val);
    },
  },
  {
    type: "input",
    name: "depthToCategory",
    message: `What is the Depth To Category?
  This is number of dirs before we hit the primary category, if left blank, don't calc primary/secondary dirs
  For D:/Dropbox/Mark/myAudioBooks, depth would be 4 and that assumes the directory after myAudioBooks is the Primary Category`,
    default: 4,
  },
  {
    type: "confirm",
    name: "mongoDBUpdateFlag",
    message: "Update/Create Mongo DB Records?",
    default: true,
  },
  {
    type: "input",
    name: "outputFilename",
    message: "Name of the output file.",
    default: "audiobook-metadata.json",
    filter(val) {
      const extName = path.extname(val);
      if (extName !== ".json") {
        val = `${val}.json`;
      }
      return val;
    },
  },
  {
    type: "input",
    name: "outputDir",
    message: "What is the directory to output file to?",
    default: "D:/Dropbox/Mark/myAudioBooks/output_ignore",
    filter(val) {
      return fixPath(val);
    },
  },
  {
    type: "list",
    name: "queryGoogle",
    message: `When and IF to query google?`,
    choices: [
      "Yes - Query Google only for NEW books",
      "No - Do not Query Google at all",
      "Force - Query google for EVERY book, even if it already has data",
    ],
    filter(val) {
      const validatedData = val.includes("Yes")
        ? "yes"
        : val.includes("Force")
        ? "force"
        : "no";
      return validatedData;
    },
  },
  {
    type: "confirm",
    name: "onlyAggregateFlag",
    message: `ONLY Aggregate?\n  Select N to Look for NEW books and update the metadata files\n  Select Y to ONLY aggregate existing metadata files`,
    default: false,
  },
];

function fixPath(inputPath) {
  return inputPath.normalize().split(path.sep).join("/");
}
