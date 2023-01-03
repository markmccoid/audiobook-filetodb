import type { FolderMetadata } from "./audiobook-walkdir";

export type CleanAudioBookData = {
  id: string;
  fullPath: string;
  audioFileCount: number;
  title: string;
  description: string;
  author: string;
  authors?: string[];
  narratedBy?: string;
  publishedYear?: number;
  releaseDate?: string;
  publisher?: string;
  pageCount?: number;
  imageURL?: string;
  categories: string[];
  pathDirArray: string[];
  pathPrimaryCat: string;
  pathSecondaryCat: string;
};

//--------------------------------------------
//-- Helper functino to extract directory names
//-- from path
//-- c:/nonfiction/weath/booktitle
//-- returns ["nonfiction", "wealth"]
//--------------------------------------------
function extractDirectories(dir: string, depthToCategory) {
  let extractedDirs = [];
  // Loop and extract directory one at time till end
  while (true) {
    let index = dir.indexOf("/");
    // Exit while loop if there is no more "/" or
    // No more "/" and the index above.  So, the first check is really unnecessary, but whatever
    // "books/booktitle" this will exist as the books was extracted on the previous interation
    // The loop extracts forward - > c:/nonfiction/weath/booktitle
    //                                    1         2      exit
    if (index === -1 || dir.slice(index + 1).indexOf("/") === -1) {
      break;
    }
    let nextIndex = dir.slice(index + 1).indexOf("/") + index + 1;
    // Exit loop when can no longer find "/"
    extractedDirs.push(dir.slice(index + 1, nextIndex));

    dir = dir.slice(index + 1); //dir.slice(dir.indexOf("/")+1).slice(dir.indexOf("/"))
  }
  return {
    allDirs: extractedDirs,
    primaryDirCat: extractedDirs[depthToCategory - 1],
    secondaryDirCat: extractedDirs[depthToCategory],
  };
}

export function createCleanFile(
  baseData: FolderMetadata[],
  depthToCategory?: number
): CleanAudioBookData[] {
  return baseData.map((book) => {
    // decide on data for fields that come from multiple sources
    // if infoFileData available use it for the following:
    const author =
      book.infoFileData?.author ||
      book.folderNameData?.author ||
      book.googleAPIData?.authors[0];
    const title =
      book.infoFileData?.title ||
      book.folderNameData?.title ||
      `${book.googleAPIData?.title} ${book.googleAPIData?.subTitle}`;
    const description =
      book.infoFileData?.summary || book.googleAPIData?.description;
    const publishedYear =
      parseInt(book.folderNameData?.publishedYear) ||
      parseInt(book.googleAPIData?.publishedDate?.slice(0, 4));
    const releaseDate =
      book.infoFileData?.releaseDate || book.googleAPIData?.publishedDate;
    const imageURL = book.googleAPIData?.imageURL || book.folderImages[0];
    // Concate all categories together and filter out blanks (we remove dups when assigning to object)
    const categories = [
      book.folderNameData?.category,
      ...(book.googleAPIData?.categories || []),
      ...(book.infoFileData?.otherCategories || []),
    ].filter((el) => el);
    const directories = extractDirectories(book.fullPath, depthToCategory);
    return {
      id: book.id,
      fullPath: book.fullPath,
      audioFileCount: book.audioFileCount,
      title,
      description,
      author,
      authors: book.googleAPIData?.authors,
      narratedBy: book.infoFileData?.narratedBy,
      publishedYear,
      releaseDate,
      publisher: book.googleAPIData?.publisher,
      pageCount: parseInt(book.googleAPIData?.pageCount) || undefined,
      imageURL,
      categories: Array.from(new Set(categories)),
      pathDirArray: directories.allDirs,
      pathPrimaryCat: directories.primaryDirCat,
      pathSecondaryCat: directories.secondaryDirCat,
    };
  });
}
