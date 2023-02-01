# audiobook-filewalker

## Audiobook folders

> This is a Typescript project, so to use the node entry points, you will need to use the build directory. If you make changes to the ts code and need to build use:

```
$ npm run build
```

## New Fork

This is a new fork of the the audiobook-filewalker repo. This repo will be focused on expanding the ability of the code to not only walk the file system for audiobooks and gerenate a JSON map of the files, but will now also sync it to a MongoDB in Mondo's Atlas servers.

Stack used:

- TypeScript
- MongoDB Atlas
- Prisma

## BELOW OLD AND ONLY FOR REFERENCE

There are two main audiobook functions detailed below, but in essense, one will recurse through your audiobook directories and put a metadata json file with information about the audiobook.

The second function will aggregate all of those metadata json files into a single json file.

You can access these functions from the command line using:

```bash
$ node walkentry {type} {aggr only} {aggr output location} {aggr output filename} {starting directory} {call google api}
# Example write metadata in dirs and aggregate
$ node walkentry audiobook no C:/localStuff/demonoid/AudioBooks/Test aggronly.json C:/localStuff/demonoid/AudioBooks/Test yes
# Example ONLY Aggregate
$ walkentry audiobook yes C:/localStuff/demonoid/AudioBooks/Test aggronly.json C:/localStuff/demonoid/AudioBooks/Test
```

Recurse through directory of Audiobooks, parsing out metadata for book in folder.

There are two main entry points:

- **walkAndTagDirs** - takes the passed directory as its starting point and recurses directories. When a folder is found that holds Audiobook files, it will create a `${author}-${title}-metatdata.json` file that stores info about book in that folder. This way each audiobook has metadata in its directory.
  This is an async function, which returns an aggregated version of all of the metadata files created "folderMetadataArray".

  ```typescript
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
  type QueryGoogle = "no" | "yes" | "force";
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
  export type BookInfo = {
    summary?: string;
    length?: string;
    title?: string;
    author?: string;
    narratedBy?: string;
    releaseDate?: string;
    otherCategories?: string[];
  };
  export type GoogleData = {
    id?: string;
    title?: string;
    subTitle?: string;
    authors?: string[];
    description?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: string;
    categories?: string[];
    imageURL?: string;
    bookDetailsURL?: string;
    isbn?: { type: string; identifier: string }[];
    googleISBNS?: Record<string, string>;
    query?: string;
    queryDateString?: string;
  };
  ```

- **walkAndAggrMetadata** - takes the passed directory and simply recurses through each Audiobook directory and grabbing the metadata file (if it exists) and returns that aggregated JSON file.

**Example Code**

```javascript
import fs from "fs";
import path from "path";
import { walkAndAggrMetadata, walkAndTagDirs } from "./audiobook-walkdir";

const dir = "C:/localStuff/demonoid/AudioBooks";
//const res = walkAndAggrMetadata(dir);
// fs.writeFileSync(
//   path.join(dir, "testingFileMetadata.json"),
//   JSON.stringify(res.folderMetadataArray)
// );

// walkAndTagDirs returns a promise, we must THEN it.
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

## Music folders

Will create a json file with Artists and their albums that were found as subfolders in the starting dir

The **Starting Depth** will be either zero or -1.

If zero the expected structure would be:

-StartingDir
-> Artist Dir
---> Album Dir
---> Album Dir
-> Artist Dir
---> Album Dir
...

If Starting Depth equals -1, then it means that you have one level of classification:
-StartingDir
-> Category Dir (Epic Music)
-> Artist Dir
---> Album Dir
---> Album Dir
-> Artist Dir
---> Album Dir
-> Category Dir (Classical)
-> Artist Dir
---> Album Dir
...

Example node code:

```bash
$ node walkentry {type} {starting directory} {output location} {output filename} {starting depth (optional)}
# Example
$ node walkentry music D:/Dropbox/mark/mymusic D:/Dropbox/Mark/myObsidian/Music/_templaterScripts music-data.json -1
```
