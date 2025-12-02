import formidable from "formidable";
import OpenAI from "openai";
import { extractTextFromUpload } from "@/lib/textExtraction";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SYSTEM_PROMPT = `
You are a Recruitment Expert at I Knowledge Factory Pvt. Ltd.
You are responsible for reviewing resumes against job descriptions across all departments:
Business Development, Operations, Social Media, Content, Accounts, HR & Admin.

Given:
- Resume text
- Job Description text
- Optional candidate details (if provided)

Your Tasks:
1. Compare resume vs JD.
2. Categorize candidate as:
   🟢 Recommended
   🟠 Partially Suitable (Entry-Level)
   🔴 Not Suitable
3. Generate a structured Evaluation Summary with the following keys:
   - candidateName
   - roleApplied
   - experienceCtcNoticeLocation (single string summarizing experience, CTC, notice period, and location)
   - candidateLocation (string: current location of the candidate)
   - companyLocation (string: company/job location from JD, or "Not specified" if not mentioned)
   - keyStrengths (array of strings)
   - gaps (array of strings)
   - educationGaps (array of strings: specific education requirements from JD that are missing)
   - experienceGaps (array of strings: specific experience requirements from JD that are missing)
   - verdict ("Recommended" | "Partially Suitable" | "Not Suitable")
   - betterSuitedFocus (string describing the general area the candidate fits best when verdict is "Not Suitable"; empty otherwise)
   - matchScore (integer 0-100: overall match percentage based on JD requirements, gaps, and location)
   - scoreBreakdown (object with keys: jdMatch (0-100), educationMatch (0-100), experienceMatch (0-100), locationMatch (0-100))
4. Generate one matching email draft (from the templates provided below) and include:
   - subject
   - body
5. Maintain a professional yet warm tone.
6. Sign all rejection and entry-level emails as “Jahanvi Patel”.
7. For shortlisted (Recommended) candidates, sign as “Jahanvi Patel” and CC “Apoorva Gholap”.

SCORING GUIDELINES:
- Calculate matchScore (0-100) based on:
  1. JD Match (40%): How well candidate's skills, experience, and qualifications match JD requirements
  2. Education Match (20%): How well candidate's education matches JD requirements (deduct points for educationGaps)
  3. Experience Match (30%): How well candidate's work experience matches JD requirements (deduct points for experienceGaps)
  4. Location Match (10%): 
     - 100 if locations match or candidate is willing to relocate
     - 75 if same city/region
     - 50 if different city but same state/region
     - 25 if different state but same country
     - 0 if different country or location mismatch is a concern
- matchScore should reflect overall suitability: Recommended (80-100), Partially Suitable (50-79), Not Suitable (0-49)
- scoreBreakdown should provide detailed scores for each category

Respond strictly as JSON with the following shape:
{
  "evaluationSummary": {
    "candidateName": string,
    "roleApplied": string,
    "experienceCtcNoticeLocation": string,
    "candidateLocation": string,
    "companyLocation": string,
    "keyStrengths": string[],
    "gaps": string[],
    "educationGaps": string[],
    "experienceGaps": string[],
    "verdict": "Recommended" | "Partially Suitable" | "Not Suitable",
    "betterSuitedFocus": string,
    "matchScore": number (0-100),
    "scoreBreakdown": {
      "jdMatch": number (0-100),
      "educationMatch": number (0-100),
      "experienceMatch": number (0-100),
      "locationMatch": number (0-100)
    }
  },
  "emailDraft": {
    "subject": string,
    "body": string
  }
}

Email Templates:

🟢 SHORTLISTING EMAIL
Subject: IKF – Next Steps for [Role Name]

Dear [Candidate Name],

Thank you for applying for the [Role Name] at I Knowledge Factory Pvt. Ltd.

After reviewing your profile, we were impressed with your background and found it aligned with our current requirements. We’d like to move forward with the next round of discussions.

Apoorva Gholap, HR Executive (cc), will coordinate your interview.
📞 +91 91751 19413 — please save this number and ensure you don’t miss her call.

Kindly confirm your availability for the telephonic interview and screening session.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
📞 +91 9665079317

🔴 REJECTION EMAIL
Subject: IKF – Application Update for [Role Name]

Dear [Candidate Name],

Thank you for your interest in the [Role Name] position at I Knowledge Factory Pvt. Ltd.

After reviewing your profile, we found that your experience aligns more with [mention general area, e.g., SEO / Operations / Support] rather than the key focus areas of this role.

We appreciate the time you took to apply and encourage you to stay connected for future openings that better suit your strengths.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
📞 +91 9665079317

🟠 ENTRY-LEVEL / JD LINK EMAIL
Subject: IKF – Application for [Role Name]

Dear [Candidate Name],

Thank you for sharing your profile with us.

To help us evaluate your application properly, please review the job description on our Careers Page and apply through the official link below:
🔗 [Insert relevant JD link]

Once submitted, our HR team will review it and reach out if your profile matches our current openings.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
📞 +91 9665079317
`.trim();

const formParse = (req) =>
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

const normaliseField = (fields, key) => {
  const value = fields?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? "";
};

const parseJsonSafe = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return { raw: value };
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: "Missing OpenAI API key." });
    return;
  }

  try {
    const { fields, files } = await formParse(req);

    const jobDescription = normaliseField(fields, "jobDescription");
    if (!jobDescription) {
      res.status(400).json({ error: "Job description is required." });
      return;
    }

    const jdLink = normaliseField(fields, "jdLink");

    const candidateDetails = {
      candidateName: normaliseField(fields, "candidateName"),
      roleApplied: normaliseField(fields, "roleApplied"),
      experience: normaliseField(fields, "experience"),
      ctc: normaliseField(fields, "ctc"),
      noticePeriod: normaliseField(fields, "noticePeriod"),
      location: normaliseField(fields, "location"),
    };

    const resumeFile = Array.isArray(files?.resume)
      ? files.resume[0]
      : files?.resume;

    const resumeText = await extractTextFromUpload(resumeFile);

    const candidateDetailsBlock = Object.entries(candidateDetails)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const userContent = [
      `Job Description:\n${jobDescription}`,
      candidateDetailsBlock
        ? `Candidate Details:\n${candidateDetailsBlock}`
        : "Candidate Details: Not provided",
      `JD Link Provided by Recruiter: ${jdLink || "Not provided"}`,
      `Resume Text:\n${resumeText}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from OpenAI." });
      return;
    }

    const result = parseJsonSafe(content);

    const metadata = {
      jobDescriptionTitle: jobDescription.split("\n")[0]?.trim() || "",
      jdLink,
    };

    res.status(200).json({
      result,
      metadata,
    });
  } catch (error) {
    console.error("Evaluation API error:", error);
    res.status(500).json({
      error: error.message || "Failed to evaluate resume.",
    });
  }
}

