const axios = require("axios");

function sanitizeTitle(title) {
  const regex = /[&,-,/,\\]/gi;
  return title.replace(regex, "");
}

export type AudibleData = {
  asin?: string;
  imageURL?: string; // data.products.product_images.500
  description?: string; // data.products.publisher_summary
  bookLengthMin: number; //data.products.runtime_length_min
  formatType: string; // data.products.format_type (unabridged, etc)
  title?: string; // data.products.title
  publishedDate?: string; // data.products.issue_date
};
export async function getAudibleData(authorIn, titleIn): Promise<AudibleData> {
  let baseURL = "https://api.audible.com/1.0/catalog/products";
  let query = `${baseURL}?title=${sanitizeTitle(
    titleIn
  )}&author=${authorIn}&response_groups=product_extended_attrs,media`;
  let id = `${authorIn.replace(/\s/g, "")}-${titleIn.replace(/\s/g, "")}`;
  const queryDateString = new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  // console.log(query);
  return axios
    .get(query)
    .then((resp) => {
      if (resp.data.totalItems === 0) {
        return {
          query,
          queryDateString,
        };
      }
      const audibleData = resp.data.products[0];
      let asin = audibleData.asin;
      let imageURL = audibleData.product_images?.["500"];
      let description = audibleData.publisher_summary;
      let bookLengthMin = audibleData.runtime_length_min;
      let formatType = audibleData.format_type;
      let title = `${audibleData.title}${
        audibleData?.subtitle ? ":" + audibleData?.subtitle : ""
      }`;
      let publishedDate = audibleData.issue_date;

      return {
        asin,
        imageURL,
        description: description.replace(/<[^>]*>?/gm, ""),
        bookLengthMin,
        formatType,
        title,
        publishedDate,
        query,
        queryDateString,
      };
    })
    .catch((e) => {
      //console.log("ERROR", e.response.status);
      return { id, authorIn, titleIn, query, error: e };
    });
}

module.exports = {
  getAudibleData,
};
