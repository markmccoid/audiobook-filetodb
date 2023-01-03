import fs, { writeFileSync } from "fs";
import path from "path";
import type { CleanAudioBookData } from "./audiobook-createCleanFile";

export type bookMetadata = {
  authors: string[];
  primaryCategories: string[];
  secondaryCategories: string[];
  categories: string[];
  categoryMap: Record<string, string[]>;
};

export function aggregateMetadata(
  inputPath: string,
  inputFile: string
): bookMetadata {
  const bookData: CleanAudioBookData[] = JSON.parse(
    fs.readFileSync(path.join(inputPath, inputFile), {
      encoding: "utf-8",
    })
  );

  const authors = new Set();
  const primaryCategories = new Set();
  const secondaryCategories = new Set();
  const categories = new Set();
  const categoryMap = {};

  for (let book of bookData) {
    book.author.split(",").forEach((el) => authors.add(el.trim()));
    book?.authors?.forEach((author) => authors.add(author.trim()));
    primaryCategories.add(book.pathPrimaryCat);
    secondaryCategories.add(book.pathSecondaryCat);
    book.categories.forEach((cat) => categories.add(cat));
    // Build Category Map
    if (!book.pathPrimaryCat) continue;
    let existingCat = categoryMap?.[book.pathPrimaryCat] || [];
    let catSet = new Set();
    existingCat.push(book.pathSecondaryCat);
    existingCat = existingCat.filter((el) => el);
    existingCat.forEach((el) => catSet.add(el));
    categoryMap[book.pathPrimaryCat] = Array.from(catSet);
  }
  return {
    authors: Array.from(authors).filter((el) => el) as string[],
    primaryCategories: Array.from(primaryCategories).filter(
      (el) => el
    ) as string[],
    secondaryCategories: Array.from(secondaryCategories).filter(
      (el) => el
    ) as string[],
    categories: Array.from(categories).filter((el) => el) as string[],
    categoryMap,
  };
}
