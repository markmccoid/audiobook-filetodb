# audiobook-filewalker

Recurse through directory of Audiobooks, parsing out metadata for book in folder.

There are two main entry points:

- **walkAndTagDirs** - takes the passed directory as its starting point and recurses directories. When a folder is found that holds Audiobook files, it will create a `${author}-${title}-metatdata.json` file that stores info about book.
  This is an async function, which returns an aggregated version of all of the metadata files created "folderMetadataArray".
- **walkAndAggrMetadata** - takes the passed directory and simply recurses through each Audiobook directory and grabbing the metadata file (if it exists) and returns that aggregated JSON file.

**Example Code**

```javascript
import fs from "fs";
import path from "path";
import { walkAndAggrMetadata, walkAndTagDirs } from "./audiobook-walkdir";

// const dir = "C:/localStuff/demonoid/AudioBooks";
const dir = "C:/localStuff/demonoid/AudioBooks";
//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );

// walkDir returns a promise, we must THEN it.
walkAndTagDirs(dir, "yes", [], []).then((res) => {
  fs.writeFileSync(
    path.join(dir, "directoryArray.json"),
    JSON.stringify(res.dirArray)
  );
  fs.writeFileSync(
    path.join(dir, "AllAudioBooks.json"),
    JSON.stringify(res.folderMetadataArray)
  );
});
```
