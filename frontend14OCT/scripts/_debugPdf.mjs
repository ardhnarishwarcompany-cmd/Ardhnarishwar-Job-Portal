import { register } from "node:module";
import fs from "node:fs";
register("./jspdf-resolve-hooks.mjs", import.meta.url);
const { generateResumePdf } = await import("../src/utils/resumeUtils.js");

const cv = {
  name: "Test Person",
  title: "Engineer",
  summary:
    "Hello world summary that is reasonably long and wraps around the page several times to check pagination behaviour. ".repeat(4),
  skills: "a, b, c",
  experience: [{ id: "1", role: "Dev", company: "X", duration: "2020", description: "did things\nmore things" }],
  education: [{ id: "1", degree: "BS", school: "U", year: "2019" }],
  projects: [],
  links: [],
  achievements: "",
  certifications: "",
  languages: "",
};

for (const tpl of ["modern", "classic", "professional"]) {
  const doc = generateResumePdf(cv, tpl);
  const buf = Buffer.from(doc.output("arraybuffer"));
  const path = `C:/Users/princ/AppData/Local/Temp/opencode/cvtest/out-${tpl}.pdf`;
  fs.writeFileSync(path, buf);
  console.log(tpl, "pages", doc.getNumberOfPages(), "bytes", buf.length, "header", JSON.stringify(buf.slice(0, 8).toString("latin1")), "tail", JSON.stringify(buf.slice(-30).toString("latin1")));
}
