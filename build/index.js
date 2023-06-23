"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const audiobook_walkdir_1 = require("./audiobook-walkdir");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk = require("chalk");
const inquiererQuestions_1 = require("./inquiererQuestions");
const music_walkdir_1 = require("./music-walkdir");
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
    console.log(chalk.green(" ====== "), chalk.bgGreen("Audiobook Walker"), chalk.green(" ================"), `\n You will have the choice to write the data found to MongoDB and will always get two files
    written to your output directory.  The full aggregated metadata file and the clean aggregated metadata file.
    The clean file will simply have "clean-" prepended to your output filename.
    The clean file is used in the Audiobook Tracker application.\n`, chalk.green(`=====================================`));
    const answers = (await inquirer_1.default.prompt(inquiererQuestions_1.bookQuestions));
    console.log(`Call Main with, ${JSON.stringify(answers)}`);
    //-------------------------------
    const { shouldContinue } = await inquirer_1.default.prompt([
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
    if (!shouldContinue)
        return;
    if (!answers.onlyAggregateFlag) {
        const results = await (0, audiobook_walkdir_1.walkAndTagDirs)(answers.startingDir, answers.queryGoogle, answers.mongoDBUpdateFlag);
    }
    const final = (0, audiobook_walkdir_1.writeAggrMetaData)(answers.startingDir, answers.outputDir, answers.outputFilename, true, // Create clean file
    answers.depthToCategory);
    console.log(chalk.green(`Data written to ${path_1.default.join(answers.outputDir, answers.outputFilename)} and clean-${answers.outputFilename}`));
    return chalk.green("Books Finished!");
    // return new Promise((res, rej) => res("Books Finished!"));
}
// //~ -----------------------------------------------------
// //~ MUSIC Process
// //~ -----------------------------------------------------
async function musicProcess() {
    // console.log(
    //   chalk.cyan(" ====== "),
    //   chalk.bgCyan("Music Walker"),
    //   chalk.cyan(" ================"),
    //   `\n  Calls the module: walkentry {type} {starting directory} {output location} {output filename} {starting depth (optional)}
    //   starting depth should be 0 if artist dir in the starting dir (startingDir/artist1, startingDir/artist2, etc)
    //   starting depth should be -1 if there is a "genre" folder before artists (startingDir/genre1/artist1, startingDir/genre1/artist2, etc)\n`,
    //   chalk.cyan(`=====================================`)
    // );
    const answers = await inquirer_1.default.prompt(inquiererQuestions_1.musicQuestions);
    //-------------------------------
    const { shouldContinue } = await inquirer_1.default.prompt([
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
        return await (0, music_walkdir_1.musicWalker)(answers.dir, answers.depth).then((res) => {
            fs_1.default.writeFileSync(path_1.default.join(answers.outputLocation, answers.outputfileName), JSON.stringify(res));
            return chalk.cyan(`Output written to ${answers.outputfileName}`);
        });
    }
    else {
        // return new Promise((res, rej) => res("Music Walk aborted!"));
        return chalk.red("Music Walk aborted!");
    }
}
// main().then((res) => console.log("WTF", res));
async function choosePath(res) {
    console.log("res", res);
    if (res.bookOrMusic === "music") {
        return musicProcess();
    }
    else {
        return bookProcess();
    }
}
inquirer_1.default
    .prompt(inquiererQuestions_1.bookOrMusicQuestion)
    .then((res) => {
    return choosePath(res);
})
    .then((res) => console.log("Complete -> ", res));
