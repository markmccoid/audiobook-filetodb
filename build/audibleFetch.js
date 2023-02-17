"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudibleData = void 0;
const axios = require("axios");
function sanitizeTitle(title) {
    const regex = /[&,-,/,\\]/gi;
    return title.replace(regex, "");
}
async function getAudibleData(authorIn, titleIn) {
    let baseURL = "https://api.audible.com/1.0/catalog/products";
    let query = `${baseURL}?title=${sanitizeTitle(titleIn)}&author=${authorIn}&response_groups=product_extended_attrs,media`;
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
        var _a;
        if (resp.data.totalItems === 0) {
            return {
                query,
                queryDateString,
            };
        }
        const audibleData = resp.data.products[0];
        let asin = audibleData.asin;
        let imageURL = (_a = audibleData.product_images) === null || _a === void 0 ? void 0 : _a["500"];
        let description = audibleData.publisher_summary;
        let bookLengthMin = audibleData.runtime_length_min;
        let formatType = audibleData.format_type;
        let title = `${audibleData.title}${(audibleData === null || audibleData === void 0 ? void 0 : audibleData.subtitle) ? ":" + (audibleData === null || audibleData === void 0 ? void 0 : audibleData.subtitle) : ""}`;
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
exports.getAudibleData = getAudibleData;
module.exports = {
    getAudibleData,
};
