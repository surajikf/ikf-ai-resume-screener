import formidable from "formidable";
import { extractTextFromUpload } from "@/lib/textExtraction";

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs20.x",
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { files } = await parseForm(req);
    const jdFile = Array.isArray(files?.jdFile) ? files.jdFile[0] : files?.jdFile;

    if (!jdFile) {
      res.status(400).json({ error: "No job description file uploaded." });
      return;
    }

    const text = await extractTextFromUpload(jdFile);
    res.status(200).json({ text });
  } catch (error) {
    console.error("JD parse error:", error);
    res.status(500).json({
      error: error.message || "Failed to parse job description file.",
    });
  }
}

