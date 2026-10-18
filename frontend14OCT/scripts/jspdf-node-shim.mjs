// Node shim so `import jsPDF from "jspdf"` resolves to the Node build of
// jsPDF (the package "main") with a proper default export. Used only by the
// test harness; the browser keeps using the package "module" build via Vite.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mod = require("jspdf");
const jsPDF = mod.jsPDF || mod;

export { jsPDF };
export default jsPDF;
