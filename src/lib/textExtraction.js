import fs from "fs";
import path from "path";

const SUPPORTED_TYPES = [".pdf", ".docx", ".txt"];

export const getSupportedResumeTypes = () => [...SUPPORTED_TYPES];

const ensureDomMatrix = async () => {
  if (typeof globalThis.DOMMatrix === "undefined") {
    try {
      const canvasMod = await import("@napi-rs/canvas");
      if (canvasMod?.DOMMatrix) {
        globalThis.DOMMatrix = canvasMod.DOMMatrix;
      }
    } catch (error) {
      console.warn("Failed to polyfill DOMMatrix:", error);
    }
  }
};

const resolvePdfParser = async () => {
  await ensureDomMatrix();

  const mod = await import("pdf-parse");
  if (typeof mod === "function") return mod;
  if (typeof mod.default === "function") return mod.default;

  if (typeof mod.PDFParse === "function") {
    return async (buffer) => {
      const parser = new mod.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result?.text || "";
    };
  }

  return null;
};

let pdfParserCache = null;
const getPdfParser = async () => {
  if (!pdfParserCache) {
    pdfParserCache = await resolvePdfParser();
  }
  return pdfParserCache;
};

let cachedMammoth = null;
const getMammoth = async () => {
  if (!cachedMammoth) {
    const mod = await import("mammoth");
    cachedMammoth = mod?.extractRawText ? mod : mod?.default || mod;
  }
  return cachedMammoth;
};

export const extractTextFromUpload = async (file) => {
  if (!file) {
    throw new Error("No file provided.");
  }

  const filePath = file.filepath;
  const originalName = file.originalFilename || file.newFilename || "";
  const extension = path.extname(originalName || filePath).toLowerCase();

  if (!SUPPORTED_TYPES.includes(extension)) {
    throw new Error(
      `Unsupported file type: ${extension || "unknown"}. Please upload PDF, DOCX, or TXT files.`,
    );
  }

  if (extension === ".pdf") {
    const buffer = await fs.promises.readFile(filePath);
    const pdfParse = await getPdfParser();

    if (!pdfParse) {
      throw new Error("PDF parser is unavailable.");
    }

    const parsed = await pdfParse(buffer);
    if (typeof parsed === "string") {
      return parsed;
    }

    if (parsed?.text) {
      return parsed.text;
    }

    throw new Error("Unable to extract text from PDF.");
  }

  if (extension === ".docx") {
    const mammoth = await getMammoth();
    if (!mammoth?.extractRawText) {
      throw new Error("DOCX parser is unavailable.");
    }
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (extension === ".txt") {
    return fs.promises.readFile(filePath, "utf-8");
  }

  return "";
};

