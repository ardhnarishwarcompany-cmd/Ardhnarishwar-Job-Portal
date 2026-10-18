// Redirects the bare "jspdf" specifier to the Node shim so test code and
// src/utils/resumeUtils.js share a single jsPDF module instance.
export function resolve(specifier, context, nextResolve) {
  if (specifier === "jspdf") {
    return {
      url: new URL("./jspdf-node-shim.mjs", import.meta.url).href,
      format: "module",
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
