import fs from "fs";
import path from "path";
import {
  walkAndAggrMetadata,
  walkAndTagDirs,
  writeAggrMetaData,
} from "./audiobook-walkdir";

import inquirer from "inquirer";
import chalk = require("chalk");
import {
  bookOrMusicQuestion,
  bookQuestions,
  musicQuestions,
} from "./inquiererQuestions";
import type { MusicAnswers, BookAnswers } from "./inquiererQuestions";
import { musicWalker } from "./music-walkdir";

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//~~ This is the entry point when testing
//~~ using the "npm run start"
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// type Test = {
//   _id: string;
// };

// const dirToTest = "D:/Dropbox/Mark/myAudioBooks";

// async function main() {
//   return inquirer.prompt(bookOrMusicQuestion).then((answer) => {
//     if (answer === "audiobooks") {
//       console.log("aduiobook");
//     } else {
//       // return musicProcess();
//       console.log("Msuic");
//     }
//   });
// }

// //~ -----------------------------------------------------
// //~ BOOK Process
// //~ -----------------------------------------------------
async function bookProcess() {
  console.log(
    chalk.green(" ====== "),
    chalk.bgGreen("Audiobook Walker"),
    chalk.green(" ================"),
    `\n You will have the choice to write the data found to MongoDB and will always get two files
    written to your output directory.  The full aggregated metadata file and the clean aggregated metadata file.
    The clean file will simply have "clean-" prepended to your output filename.
    The clean file is used in the Audiobook Tracker application.\n`,
    chalk.green(`=====================================`)
  );

  const answers = (await inquirer.prompt(bookQuestions)) as BookAnswers;

  console.log(`Call Main with, ${JSON.stringify(answers)}`);

  //-------------------------------
  const { shouldContinue } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldContinue",
      message: `Continue using the following inputs?
        Starting Directory: ${chalk.cyan(answers.startingDir)}
        Depth: ${chalk.cyan(answers.depthToCategory)}
        Output Directory: ${chalk.cyan(answers.outputDir)}
        Output Filename: ${chalk.cyan(answers.outputFilename)}
        Save to MongoDB: ${chalk.cyan(answers.mongoDBUpdateFlag)}
        Only Aggregate Info: ${chalk.cyan(answers.onlyAggregateFlag)}\n`,
      default: true,
    },
  ]);

  if (!shouldContinue) return;

  if (!answers.onlyAggregateFlag) {
    const results = await walkAndTagDirs(
      answers.startingDir,
      answers.queryGoolge,
      answers.mongoDBUpdateFlag
    );
  }

  const final = writeAggrMetaData(
    answers.startingDir,
    answers.outputDir,
    answers.outputFilename,
    true, // Create clean file
    answers.depthToCategory
  );

  console.log(
    chalk.green(
      `Data written to ${path.join(
        answers.outputDir,
        answers.outputFilename
      )} and clean-${answers.outputFilename}`
    )
  );
  return chalk.green("Books Finished!");
  // return new Promise((res, rej) => res("Books Finished!"));
}

// //~ -----------------------------------------------------
// //~ MUSIC Process
// //~ -----------------------------------------------------
async function musicProcess() {
  console.log(
    chalk.cyan(" ====== "),
    chalk.bgCyan("Music Walker"),
    chalk.cyan(" ================"),
    `\n  Calls the module: walkentry {type} {starting directory} {output location} {output filename} {starting depth (optional)}
    starting depth should be 0 if artist dir in the starting dir (startingDir/artist1, startingDir/artist2, etc)
    starting depth should be -1 if there is a "genre" folder before artists (startingDir/genre1/artist1, startingDir/genre1/artist2, etc)\n`,
    chalk.cyan(`=====================================`)
  );
  const answers = await inquirer.prompt(musicQuestions);

  //-------------------------------
  const { shouldContinue } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldContinue",
      message: `Continue using the following inputs?
      Starting Directory: ${chalk.cyan(answers.dir)}
      Depth: ${chalk.cyan(answers.depth)}
      Output Directory: ${chalk.cyan(answers.outputLocation)}
      Output Filename: ${chalk.cyan(answers.outputfileName)}\n`,
      default: true,
    },
  ]);

  if (shouldContinue) {
    return await musicWalker(answers.dir, answers.depth).then((res) => {
      fs.writeFileSync(
        path.join(answers.outputLocation, answers.outputfileName),
        JSON.stringify(res)
      );
      return chalk.cyan(`Output written to ${answers.outputfileName}`);
    });
  } else {
    // return new Promise((res, rej) => res("Music Walk aborted!"));
    return chalk.red("Music Walk aborted!");
  }
}

// main().then((res) => console.log("WTF", res));
async function choosePath(res) {
  console.log("res", res);
  if (res.bookOrMusic === "music") {
    return musicProcess();
  } else {
    return bookProcess();
  }
}
inquirer
  .prompt(bookOrMusicQuestion)
  .then((res) => {
    return choosePath(res);
  })
  .then((res) => console.log("Complete -> ", res));
// async function mainOld() {
//   const { queryGoogle, dirArray, folderMetadataArray } = await walkAndTagDirs(
//     dirToTest,
//     "yes"
//   );

//   console.log("Done Processing", folderMetadataArray.length);

//   // const result = await prisma.books.findRaw({
//   //   filter: { _id: { $eq: { $oid: "63c8c4183e2f12c0e4b0cce0" } } },
//   //   options: { projection: { _id: true, showRecordId: true } },
//   // });
//   // //const newRes: Test[] = result;
//   // return result[0];

//   // const createdBook = await prisma.books.create({
//   //   data: {
//   //     primaryCategory: "primaryCategory",
//   //     secondaryCategory: "secondaryCategory",
//   //     title: "title",
//   //     author: "author",
//   //     description: "description",
//   //     imageURL: "imageURL",
//   //     bookLengthMinutes: 100, // find conversion is seed function
//   //     bookLengthText: "1 hr 40min", // find conversion is seed function
//   //     dropboxLocation: "dropboxLocation",
//   //     genres: "genres",
//   //     narratedBy: "narratedBy",
//   //     pageCount: 100,
//   //     publishedYear: 1970,
//   //     releaseDate: new Date(),
//   //     source: "test",
//   //   },
//   // });
//   // return createdBook;
// }

//! -------------------------------------
// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
//! -------------------------------------
// const dir = "D:/Dropbox/Mark/myAudioBooks";
// const dir = "D:/Dropbox/Mark/myAudioBooks/NonFiction";
// walkAndTagDirs(dir, "yes");

//!
// writeAggrMetaData(dir, "c:/localProgramming", "myfiletest.json");

//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );
// walkDir returns a promise, we must THEN it.
// walkAndTagDirs(dir, "yes").then((res) => {
// fs.writeFileSync(
//   path.join(dir, "directoryArray.json"),
//   JSON.stringify(res.dirArray)
// );
// fs.writeFileSync(
//   path.join(dir, "AllAudioBooks.json"),
//   JSON.stringify(res.folderMetadataArray)
// );
//});
