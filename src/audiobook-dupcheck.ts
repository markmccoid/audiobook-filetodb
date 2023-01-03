import fs, { writeFileSync } from "fs";
import path from "path";

function dupCheck(inputPath: string, inputFile: string) {
  const bookData = JSON.parse(
    fs.readFileSync(path.join(inputPath, inputFile), {
      encoding: "utf-8",
    })
  );
  const ids = bookData.map((el) => el.id).sort();

  let prevId = "";
  const dupIds = ids.reduce((dupList, currId) => {
    if (prevId === currId) {
      dupList = [...dupList, currId];
    }
    prevId = currId;
    return dupList;
  }, []);
  const finalList = bookData
    .filter((el) => dupIds.some((dup) => dup === el.id))
    .map((el) => ({ id: el.id, path: el.fullPath }));
  //console.log("dupIds", finalList);
  writeFileSync(
    path.join(inputPath, "dupFiles.json"),
    JSON.stringify(finalList)
  );
}

dupCheck("D:/Dropbox/Mark/myAudioBooks", "audiobooks.json");
