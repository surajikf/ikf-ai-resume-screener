import formidable from "formidable";
import { extractTextFromUpload } from "@/lib/textExtraction";
import { callAIProvider } from "@/lib/ai-providers";
import { query } from "@/lib/db";

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
   - candidateEmail (string: email address extracted from resume, or empty string if not found)
   - candidateWhatsApp (string: WhatsApp number extracted from resume as 10-digit number XXXXXXXXXX without country code, or empty string if not found)
   - linkedInUrl (string: LinkedIn profile URL if found in resume, or empty string if not found)
   - roleApplied
   - experienceCtcNoticeLocation (single string summarizing experience, CTC, notice period, and location)
   - workExperience (array of objects with detailed work history: Extract ALL companies where the candidate worked, with duration at each company. Each object should have: companyName (string), duration (string like "2 years 3 months" or "1 year 6 months" or "6 months"), role (string, optional - job title at this company). List companies in chronological order (most recent first). Calculate total experience from all companies and include it as the last item with companyName: "Total Experience" and duration as the sum of all durations.)
   - candidateLocation (string: current location of the candidate)
   - companyLocation (string: company/job location from JD, or "Not specified" if not mentioned)
   - keyStrengths (array of strings)
   - gaps (array of strings)
   - educationGaps (array of strings: specific education requirements from JD that are missing)
   - experienceGaps (array of strings: specific experience requirements from JD that are missing)
   - verdict ("Recommended" | "Partially Suitable" | "Not Suitable")
   - betterSuitedFocus (string describing the general area the candidate fits best when verdict is "Not Suitable"; empty otherwise)
   - matchScore (integer 0-100: overall match percentage based on JD requirements, gaps, and location)
   - scoreBreakdown (object with keys: jdMatch (0-100), educationMatch (0-100), experienceMatch (0-100), locationMatch (0-100), stabilityScore (0-100: calculated based on job tenure stability - longer tenures at companies indicate higher stability))
4. Generate one matching email draft (from the templates provided below) and include:
   - subject (MUST be professional, informative, and follow the subject guidelines - include company name, role, and purpose)
   - body
5. Generate one WhatsApp message draft (from the templates provided below) based on the same verdict. The WhatsApp message will be inserted into template variable {{messagebody}}. The template already has greeting, closing, and signature, so generate ONLY the main message content.
6. Email subjects MUST be logical, professional, and informative. They should clearly indicate:
   - Company name (IKF)
   - The specific role/position
   - The purpose/action (e.g., "Interview Invitation", "Application Update", "Next Steps")
   - Be concise but descriptive (50-70 characters is ideal)
6. Maintain a professional yet warm tone.
7. Sign all rejection and entry-level emails as "Jahanvi Patel".
8. For shortlisted (Recommended) candidates, sign as "Jahanvi Patel" and CC "Apoorva Gholap".

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

IMPORTANT: Extract the candidate's contact information from the resume text:

For Email: Look for patterns like:
- email@domain.com
- Email: email@domain.com
- Contact: email@domain.com
- email addresses in contact sections
If found, include it in candidateEmail. If not found, use empty string.

For WhatsApp: Look for phone numbers in various formats:
- +91XXXXXXXXXX (with country code - extract only the 10 digits)
- 91XXXXXXXXXX (country code without + - extract only the 10 digits)
- XXXXXXXXXX (10-digit Indian numbers - use as is)
- Phone: +91XXXXXXXXXX (extract only the 10 digits)
- Mobile: XXXXXXXXXX (use as is)
- WhatsApp: +91XXXXXXXXXX (extract only the 10 digits)
- Contact: +91XXXXXXXXXX (extract only the 10 digits)

IMPORTANT: Extract ONLY the 10-digit number without country code. Remove any country code prefix (+91, 91, etc.) and store just the 10-digit number (e.g., "9307768467", not "+919307768467" or "919307768467").

If found, include the 10-digit number in candidateWhatsApp. If not found, use empty string.

IMPORTANT: Extract LinkedIn profile URL from the resume text:
- Look for patterns like:
  - linkedin.com/in/username
  - www.linkedin.com/in/username
  - https://linkedin.com/in/username
  - https://www.linkedin.com/in/username
  - LinkedIn: linkedin.com/in/username
  - LinkedIn Profile: https://www.linkedin.com/in/username
- If found, include the full URL (with https://) in linkedInUrl
- If not found, use empty string

IMPORTANT: Extract detailed work experience from the resume:
- Parse the work history/employment section carefully
- Extract each company name where the candidate worked
- Calculate the duration at each company (years and months)
- Extract the job title/role at each company (if mentioned)
- List all companies in chronological order (most recent first)
- Calculate total experience by summing all durations
- Include total experience as the last item in workExperience array with companyName: "Total Experience"
- Format durations as: "X years Y months" or "X year Y months" or "Y months" (for less than a year)
- If exact dates are not available, estimate based on the resume content
- If no work experience is found, use an empty array []

Example workExperience format:
[
  {"companyName": "ABC Corp", "duration": "2 years 3 months", "role": "Senior Manager"},
  {"companyName": "XYZ Ltd", "duration": "1 year 6 months", "role": "Manager"},
  {"companyName": "Total Experience", "duration": "3 years 9 months"}
]

Respond strictly as JSON with the following shape:
{
  "evaluationSummary": {
    "candidateName": string,
    "candidateEmail": string,
    "candidateWhatsApp": string,
    "linkedInUrl": string,
    "roleApplied": string,
    "experienceCtcNoticeLocation": string,
    "workExperience": [
      {
        "companyName": string,
        "duration": string (e.g., "2 years 3 months", "1 year 6 months", "6 months"),
        "role": string (optional, job title at this company)
      }
    ],
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
      "locationMatch": number (0-100),
      "stabilityScore": number (0-100)
    }
  },
  "emailDraft": {
    "subject": string,
    "body": string
  },
  "whatsappDraft": {
    "message": string
  }
}

EMAIL SUBJECT GUIDELINES:
- Subjects must be professional, clear, and informative
- Include company name (IKF) and role name
- Be specific about the purpose (e.g., "Next Steps", "Interview Invitation", "Application Update")
- Keep subjects concise (50-70 characters ideal)
- Use proper capitalization and formatting
- Examples of good subjects:
  * "IKF - Interview Invitation: [Role Name] Position"
  * "IKF - Next Steps: [Role Name] at I Knowledge Factory"
  * "IKF - Application Update: [Role Name] Position"
  * "IKF - Application Review Required: [Role Name]"

Email Templates:

🟢 SHORTLISTING EMAIL
Subject: IKF - Interview Invitation: [Role Name] Position

Dear [Candidate Name],

Thank you for applying for the [Role Name] position at I Knowledge Factory Pvt. Ltd.

After reviewing your profile, we were impressed with your background and found it aligned with our current requirements. We'd like to move forward with the next round of discussions.

Apoorva Gholap, HR Executive (cc), will coordinate your interview.
Phone: +91 91751 19413 - please save this number and ensure you don't miss her call.

Kindly confirm your availability for the telephonic interview and screening session.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
Phone: +91 9665079317

🔴 REJECTION EMAIL
Subject: IKF - Application Update: [Role Name] Position

Dear [Candidate Name],

Thank you for your interest in the [Role Name] position at I Knowledge Factory Pvt. Ltd.

After reviewing your profile, we found that your experience aligns more with [mention general area, e.g., SEO / Operations / Support] rather than the key focus areas of this role.

We appreciate the time you took to apply and encourage you to stay connected for future openings that better suit your strengths.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
Phone: +91 9665079317

🟠 ENTRY-LEVEL / JD LINK EMAIL
Subject: IKF - Application Review Required: [Role Name] Position

Dear [Candidate Name],

Thank you for sharing your profile with us.

To help us evaluate your application properly, please review the job description on our Careers Page and apply through the official link below:
🔗 [Insert relevant JD link]

Once submitted, our HR team will review it and reach out if your profile matches our current openings.

Best regards,
Jahanvi Patel
I Knowledge Factory Pvt. Ltd.
Phone: +91 9665079317
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

  // Fetch AI provider settings from database (if available)
  // IMPORTANT: Database settings take priority - they persist across Vercel deployments
  // Anyone using the Vercel link will use the API keys saved in the database
  let aiProviderSettings = null;
  try {
    const aiSettingsKeys = ['aiProvider', 'geminiApiKey', 'groqApiKey', 'groqModel', 'huggingfaceApiKey', 'kieApiKey', 'openaiApiKey'];
    const settingsResults = await Promise.all(
      aiSettingsKeys.map(async key => {
        try {
          const results = await query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
          // Handle both MySQL (array) and Supabase (object with data) formats
          const row = Array.isArray(results) ? results[0] : (results?.data?.[0] || results?.[0]);
          const rawValue = row?.setting_value;
          if (!rawValue) return { key, value: null };
          
          // Parse JSON value (stored as JSON string in database)
          try {
            const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            return { key, value: parsed };
          } catch {
            // If not JSON, use as-is (shouldn't happen, but be safe)
            return { key, value: rawValue };
          }
        } catch (err) {
          console.log(`[evaluate] Could not fetch ${key} from database:`, err.message);
          return { key, value: null };
        }
      })
    );
    
    // Build settings object from database results
    const dbSettings = {};
    settingsResults.forEach(({ key, value }) => {
      // Include all values from database (even empty strings - user explicitly set them)
      if (value !== null && value !== undefined) {
        dbSettings[key] = value;
      }
    });
    
    if (Object.keys(dbSettings).length > 0) {
      aiProviderSettings = dbSettings;
      console.log('[evaluate] ✅ Using AI provider settings from DATABASE (will work on Vercel):', {
        provider: dbSettings.aiProvider || 'not set',
        hasProvider: !!dbSettings.aiProvider,
        hasGeminiKey: !!dbSettings.geminiApiKey,
        hasGroqKey: !!dbSettings.groqApiKey,
        hasHuggingfaceKey: !!dbSettings.huggingfaceApiKey,
        hasKieKey: !!dbSettings.kieApiKey,
        hasOpenaiKey: !!dbSettings.openaiApiKey,
        configuredProviders: Object.keys(dbSettings).filter(k => k.includes('ApiKey') && dbSettings[k]).map(k => k.replace('ApiKey', '')),
      });
    } else {
      console.log('[evaluate] ⚠️ No AI provider settings in database, using environment variables');
    }
  } catch (dbError) {
    console.log('[evaluate] ⚠️ Could not fetch AI provider settings from database, using env vars:', dbError.message);
  }

  // Determine provider and check if API key is available
  const provider = aiProviderSettings?.aiProvider || process.env.AI_PROVIDER || 'gemini';
  const providerLower = provider.toLowerCase();
  
  const hasProviderKey = 
    (providerLower === 'gemini' && (aiProviderSettings?.geminiApiKey || process.env.GEMINI_API_KEY)) ||
    (providerLower === 'groq' && (aiProviderSettings?.groqApiKey || process.env.GROQ_API_KEY)) ||
    (providerLower === 'huggingface' && (aiProviderSettings?.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY)) ||
    (providerLower === 'kie' && (aiProviderSettings?.kieApiKey || process.env.KIE_API_KEY)) ||
    (providerLower === 'openai' && (aiProviderSettings?.openaiApiKey || process.env.OPENAI_API_KEY));

  if (!hasProviderKey) {
    const providerName = providerLower === 'gemini' ? 'Gemini' : 
                        providerLower === 'groq' ? 'Groq' :
                        providerLower === 'huggingface' ? 'Hugging Face' :
                        providerLower === 'kie' ? 'KIE AI' : 'OpenAI';
    res.status(500).json({ 
      error: `Missing ${providerName} API key. Please configure it in Settings page or set ${provider.toUpperCase()}_API_KEY in your .env.local file.`,
      hint: providerLower === 'gemini' 
        ? 'Get free API key from: https://makersuite.google.com/app/apikey'
        : providerLower === 'groq'
        ? 'Get free API key from: https://console.groq.com/keys'
        : providerLower === 'huggingface'
        ? 'Get free API key from: https://huggingface.co/settings/tokens'
        : providerLower === 'kie'
        ? 'Get API key from: https://www.kie-ai.com/'
        : 'Get API key from: https://platform.openai.com/api-keys'
    });
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

    if (!resumeFile) {
      res.status(400).json({ error: "Resume file is required." });
      return;
    }

    const resumeText = await extractTextFromUpload(resumeFile);
    
    // Read resume file content for database storage
    let resumeFileContent = null;
    let resumeFileName = resumeFile.originalFilename || resumeFile.newFilename || 'resume.pdf';
    let resumeFileType = null;
    let resumeFileSize = null;
    
    try {
      const fs = require('fs');
      const path = require('path');
      resumeFileContent = await fs.promises.readFile(resumeFile.filepath);
      resumeFileSize = resumeFile.size || resumeFileContent.length;
      
      // Determine file type from extension
      const ext = path.extname(resumeFileName).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
      };
      resumeFileType = mimeTypes[ext] || 'application/pdf';
    } catch (fileError) {
      console.log('Could not read resume file for storage:', fileError);
      // Continue without saving file - evaluation can still proceed
    }

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

    // Use the AI provider abstraction layer with database settings
    const content = await callAIProvider(SYSTEM_PROMPT, userContent, aiProviderSettings);
    
    if (!content) {
      res.status(500).json({ error: "No response from AI provider." });
      return;
    }

    const result = parseJsonSafe(content);

    const metadata = {
      jobDescriptionTitle: jobDescription.split("\n")[0]?.trim() || "",
      jdLink,
      resumeFile: resumeFileContent ? {
        fileName: resumeFileName,
        fileType: resumeFileType,
        fileSize: resumeFileSize,
        fileContent: resumeFileContent.toString('base64'), // Convert to base64 for JSON transmission
      } : null,
    };

    // Note: Database save is handled in the frontend after evaluation completes
    // This keeps the evaluate endpoint focused on evaluation only

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

