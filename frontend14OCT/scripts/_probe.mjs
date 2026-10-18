import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const dir = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
console.log("dir:", dir);
const data = new Uint8Array(fs.readFileSync("C:/Users/princ/AppData/Local/Temp/opencode/cvtest/out-classic.pdf"));
const pdf = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: false, standardFontDataUrl: dir }).promise;
const page = await pdf.getPage(1);
const tc = await page.getTextContent();
console.log("items", tc.items.length, "sample", JSON.stringify(tc.items[0]?.str));
