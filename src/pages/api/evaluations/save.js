import { query, getConnection } from '@/lib/db';

// Helper to check if using Supabase
const useSupabaseForStorage = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
import { createClient } from '@supabase/supabase-js';

// Check if using Supabase
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
let supabase = null;

if (useSupabase) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Use service role key for server-side operations (has admin access for storage)
  // Fallback to anon key if service role not available
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[evaluations/save] Supabase client initialized for Storage');
  } else {
    console.warn('[evaluations/save] Supabase credentials missing:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      candidateName,
      candidateEmail,
      candidateWhatsApp,
      candidateLocation,
      linkedInUrl,
      roleApplied,
      companyLocation,
      experienceCtcNoticeLocation,
      workExperience,
      verdict,
      matchScore,
      scoreBreakdown,
      keyStrengths,
      gaps,
      educationGaps,
      experienceGaps,
      betterSuitedFocus,
      emailDraft,
      whatsappDraft,
      jobDescriptionId,
      jobDescriptionTitle, // JD title for reference
      jobDescriptionLink, // JD link for reference
      jobDescriptionContent, // Full JD content
      scanTimestamp, // When the scan was performed
      resumeFile, // Resume file data to save along with evaluation
    } = req.body;

    // Log the verdict to ensure all verdicts are being processed
    console.log('[evaluations/save] Processing evaluation with verdict:', verdict, {
      candidateName,
      verdict,
      hasEmail: !!candidateEmail,
      hasWhatsApp: !!candidateWhatsApp,
      note: 'ALL verdicts (Recommended, Partially Suitable, Not Suitable) should be saved',
    });

    // Guard: avoid creating empty placeholder candidates when parsing fails
    const cleanedName = (candidateName || '').trim();
    const isPlaceholderName = !cleanedName || cleanedName.toLowerCase() === 'candidate';
    const hasContactInfo = !!(candidateEmail || candidateWhatsApp || linkedInUrl);
    const hasWorkHistory = Array.isArray(workExperience) && workExperience.length > 0;
    const hasLocation = !!(candidateLocation && candidateLocation.trim());

    if (isPlaceholderName && !hasContactInfo && !hasWorkHistory && !hasLocation) {
      console.warn('[evaluations/save] Rejecting placeholder candidate with no contact/info');
      return res.status(400).json({
        success: false,
        error: 'Resume parsing failed: no usable candidate info found. Please upload a clearer resume or add contact details.',
      });
    }

    // Start transaction by getting connection
    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Helper to execute queries on the transaction connection
      const executeQuery = async (sql, params = []) => {
        const [results] = await connection.execute(sql, params);
        return results;
      };

      // 1. Smart candidate matching using the find-or-create API logic
      // Use the candidates/find-or-create endpoint logic inline for better performance
      let candidateId = null;
      
      // Extract derived fields for candidate profile
      const workExp = workExperience || [];
      const latestExp = workExp.length > 0 ? workExp[0] : null;
      const currentDesignation = latestExp?.role || null;
      const currentCompany = latestExp?.companyName || null;
      
      // Calculate total experience and number of companies
      let totalExpYears = null;
      let numberOfCompanies = null;
      if (workExp.length > 0) {
        const totalExpItem = workExp.find(exp => exp.companyName === 'Total Experience');
        if (totalExpItem && totalExpItem.duration) {
          // Parse duration like "3 years 6 months" to years
          const yearsMatch = totalExpItem.duration.match(/(\d+)\s*years?/i);
          const monthsMatch = totalExpItem.duration.match(/(\d+)\s*months?/i);
          const years = yearsMatch ? parseFloat(yearsMatch[1]) : 0;
          const months = monthsMatch ? parseFloat(monthsMatch[1]) : 0;
          totalExpYears = years + (months / 12);
        }
        numberOfCompanies = workExp.filter(exp => exp.companyName !== 'Total Experience').length;
      }

      // Strategy 1: Match by email (most reliable)
      if (candidateEmail) {
        const [emailResults] = await connection.execute(
          'SELECT id FROM candidates WHERE candidate_email = ? LIMIT 1',
          [candidateEmail]
        );
        if (emailResults.length > 0) {
          candidateId = emailResults[0].id;
          console.log('[evaluations/save] ✅ Matched existing candidate by EMAIL:', {
            candidateId,
            email: candidateEmail,
            candidateName,
          });
        }
      }

      // Strategy 2: Match by WhatsApp (very reliable)
      if (!candidateId && candidateWhatsApp) {
        const [whatsappResults] = await connection.execute(
          'SELECT id FROM candidates WHERE candidate_whatsapp = ? LIMIT 1',
          [candidateWhatsApp]
        );
        if (whatsappResults.length > 0) {
          candidateId = whatsappResults[0].id;
          console.log('[evaluations/save] ✅ Matched existing candidate by WHATSAPP:', {
            candidateId,
            whatsapp: candidateWhatsApp,
            candidateName,
          });
        }
      }

      // Strategy 3: Match by LinkedIn URL (reliable)
      if (!candidateId && linkedInUrl) {
        const [linkedinResults] = await connection.execute(
          'SELECT id FROM candidates WHERE linkedin_url = ? LIMIT 1',
          [linkedInUrl]
        );
        if (linkedinResults.length > 0) {
          candidateId = linkedinResults[0].id;
          console.log('[evaluations/save] ✅ Matched existing candidate by LINKEDIN:', {
            candidateId,
            linkedin: linkedInUrl,
            candidateName,
          });
        }
      }

      // Strategy 4: Name matching - DISABLED for safety
      // Name matching is too risky and can incorrectly match different people with the same name
      // We only match by reliable identifiers: email, WhatsApp, or LinkedIn
      // If none of these match, we create a new candidate record
      if (!candidateId) {
        console.log('[evaluations/save] ℹ️ No match found by email/WhatsApp/LinkedIn - will create new candidate:', {
          candidateName,
          hasEmail: !!candidateEmail,
          hasWhatsApp: !!candidateWhatsApp,
          hasLinkedIn: !!linkedInUrl,
          note: 'Name matching is disabled to prevent incorrect matches',
        });
      }
      
      if (!candidateId) {
        console.log('[evaluations/save] 🆕 No match found - will CREATE NEW candidate:', {
          candidateName,
          candidateEmail: candidateEmail || 'N/A',
          candidateWhatsApp: candidateWhatsApp || 'N/A',
          linkedInUrl: linkedInUrl || 'N/A',
        });
      }

      // Update existing candidate or create new one
      if (candidateId) {
        // Update existing candidate with latest information
        await connection.execute(
          `UPDATE candidates SET
            candidate_name = ?,
            candidate_email = COALESCE(?, candidate_email),
            candidate_whatsapp = COALESCE(?, candidate_whatsapp),
            candidate_location = COALESCE(?, candidate_location),
            linkedin_url = COALESCE(?, linkedin_url),
            current_designation = COALESCE(?, current_designation),
            current_company = COALESCE(?, current_company),
            total_experience_years = COALESCE(?, total_experience_years),
            number_of_companies = COALESCE(?, number_of_companies),
            updated_at = NOW()
           WHERE id = ?`,
          [
            candidateName,
            candidateEmail || null,
            candidateWhatsApp || null,
            candidateLocation || null,
            linkedInUrl || null,
            currentDesignation || null,
            currentCompany || null,
            totalExpYears || null,
            numberOfCompanies || null,
            candidateId,
          ]
        );
      } else {
        // Create new candidate with complete profile
        const [candidateInsert] = await connection.execute(
          `INSERT INTO candidates (
            candidate_name, candidate_email, candidate_whatsapp, candidate_location,
            linkedin_url, current_designation, current_company,
            total_experience_years, number_of_companies
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            candidateName,
            candidateEmail || null,
            candidateWhatsApp || null,
            candidateLocation || null,
            linkedInUrl || null,
            currentDesignation || null,
            currentCompany || null,
            totalExpYears || null,
            numberOfCompanies || null,
          ]
        );
        candidateId = candidateInsert.insertId;
        console.log('[evaluations/save] 🆕 Created NEW candidate:', {
          candidateId,
          candidateName,
          candidateEmail: candidateEmail || 'N/A',
        });
      }

      // 2. Insert evaluation with all metadata
      // Note: JD title, link, and content are stored in job_descriptions table
      // and can be retrieved via JOIN. We link via job_description_id.
      // If scanTimestamp is provided, use it; otherwise let database use DEFAULT NOW()
      const evaluationInsert = await executeQuery(
        scanTimestamp
          ? `INSERT INTO evaluations (
              candidate_id, job_description_id, role_applied, company_location,
              experience_ctc_notice_location, work_experience, verdict, match_score,
              score_breakdown, key_strengths, gaps, education_gaps, experience_gaps,
              better_suited_focus, email_draft, whatsapp_draft, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          : `INSERT INTO evaluations (
              candidate_id, job_description_id, role_applied, company_location,
              experience_ctc_notice_location, work_experience, verdict, match_score,
              score_breakdown, key_strengths, gaps, education_gaps, experience_gaps,
              better_suited_focus, email_draft, whatsapp_draft
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        scanTimestamp
          ? [
              candidateId,
              jobDescriptionId || null,
              roleApplied,
              companyLocation || null,
              experienceCtcNoticeLocation || null,
              JSON.stringify(workExperience || []),
              verdict,
              matchScore,
              JSON.stringify(scoreBreakdown || {}),
              JSON.stringify(keyStrengths || []),
              JSON.stringify(gaps || []),
              JSON.stringify(educationGaps || []),
              JSON.stringify(experienceGaps || []),
              betterSuitedFocus || null,
              JSON.stringify(emailDraft || {}),
              JSON.stringify(whatsappDraft || {}),
              new Date(scanTimestamp), // Use provided timestamp
            ]
          : [
              candidateId,
              jobDescriptionId || null,
              roleApplied,
              companyLocation || null,
              experienceCtcNoticeLocation || null,
              JSON.stringify(workExperience || []),
              verdict,
              matchScore,
              JSON.stringify(scoreBreakdown || {}),
              JSON.stringify(keyStrengths || []),
              JSON.stringify(gaps || []),
              JSON.stringify(educationGaps || []),
              JSON.stringify(experienceGaps || []),
              betterSuitedFocus || null,
              JSON.stringify(emailDraft || {}),
              JSON.stringify(whatsappDraft || {}),
            ]
      );

      const evaluationId = evaluationInsert.insertId;

      // Log all saved data for verification
      console.log('[evaluations/save] ========== EVALUATION SAVED ==========');
      console.log('[evaluations/save] ✅ Evaluation saved successfully:', {
        evaluationId,
        candidateId,
        candidateName,
        jobDescriptionId: jobDescriptionId || 'NOT LINKED',
        jobDescriptionTitle: jobDescriptionTitle || 'N/A',
        roleApplied,
        verdict, // IMPORTANT: This should be saved regardless of verdict value
        matchScore,
        scanTimestamp: scanTimestamp || new Date().toISOString(),
        hasResumeFile: !!resumeFile,
        savedFields: {
          candidate: {
            name: candidateName,
            email: candidateEmail || 'N/A',
            whatsapp: candidateWhatsApp || 'N/A',
            location: candidateLocation || 'N/A',
            linkedin: linkedInUrl || 'N/A',
          },
          evaluation: {
            role: roleApplied,
            verdict,
            matchScore,
            workExperienceCount: workExperience?.length || 0,
            keyStrengthsCount: keyStrengths?.length || 0,
            gapsCount: gaps?.length || 0,
            educationGapsCount: educationGaps?.length || 0,
            experienceGapsCount: experienceGaps?.length || 0,
          },
          jobDescription: {
            id: jobDescriptionId || 'NOT LINKED',
            title: jobDescriptionTitle || 'N/A',
            link: jobDescriptionLink || 'N/A',
            contentLength: jobDescriptionContent?.length || 0,
          },
        },
      });

      // 3. Save resume file if provided
      // Use Supabase Storage if available, otherwise fall back to BLOB storage
      let resumeSaved = false;
      let resumeError = null;
      let resumeStoragePath = null;
      let resumeDbRecordInfo = null; // Store info to create DB record after transaction
      
      console.log('[evaluations/save] Resume file check:', {
        hasResumeFile: !!resumeFile,
        evaluationId,
        useSupabase,
        hasSupabaseClient: !!supabase,
        resumeFileKeys: resumeFile ? Object.keys(resumeFile) : [],
        hasFileContent: resumeFile?.fileContent ? resumeFile.fileContent.length : 0,
      });
      
      if (resumeFile && evaluationId) {
        try {
          const { fileName, fileType, fileSize, fileContent } = resumeFile;
          
          // Validate required fields
          if (!fileName || !fileContent) {
            console.error('[evaluations/save] Resume file missing required fields:', {
              hasFileName: !!fileName,
              hasFileContent: !!fileContent,
              fileName: fileName,
              fileContentType: typeof fileContent,
              fileContentLength: fileContent?.length,
            });
            resumeError = 'Resume file missing required fields (fileName or fileContent)';
          } else {
            // Clean and validate base64
            let base64Data = String(fileContent).trim();
            
            // Check if it's already a JSON stringified base64 (double-encoded)
            if (base64Data.startsWith('"') && base64Data.endsWith('"')) {
              try {
                base64Data = JSON.parse(base64Data);
                console.log('[evaluations/save] Detected JSON-encoded base64, parsed it');
              } catch (e) {
                // Not JSON, continue
              }
            }
            
            if (base64Data.includes(',')) {
              base64Data = base64Data.split(',')[1].trim();
            }
            base64Data = base64Data.replace(/\s/g, '');
            
            // Validate base64 format
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
              console.error('[evaluations/save] Invalid base64 format:', {
                length: base64Data.length,
                firstChars: base64Data.substring(0, 50),
                lastChars: base64Data.substring(Math.max(0, base64Data.length - 50)),
              });
              throw new Error('Invalid base64 format in resume file content');
            }
            
            // Convert base64 to buffer
            const fileBuffer = Buffer.from(base64Data, 'base64');
            
            // Log buffer info for debugging
            console.log('[evaluations/save] Base64 decoded to buffer:', {
              bufferLength: fileBuffer.length,
              firstBytesHex: fileBuffer.slice(0, 10).toString('hex'),
              firstBytes: Array.from(fileBuffer.slice(0, 10)),
            });
            
            if (fileBuffer.length === 0) {
              throw new Error('Decoded resume file buffer is empty');
            }
            
            // Validate PDF header if it's a PDF
            if (fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')) {
              const pdfHeader = String.fromCharCode(...fileBuffer.slice(0, 4));
              const firstBytesHex = fileBuffer.slice(0, 10).toString('hex');
              
              if (pdfHeader !== '%PDF') {
                console.error('[evaluations/save] ❌ PDF header validation FAILED:', {
                  expected: '%PDF',
                  actual: pdfHeader,
                  firstBytesHex,
                  firstBytes: Array.from(fileBuffer.slice(0, 10)),
                  bufferLength: fileBuffer.length,
                  base64Length: base64Data.length,
                  base64FirstChars: base64Data.substring(0, 50),
                });
                throw new Error(`Invalid PDF file: header is "${pdfHeader}" instead of "%PDF". The file may be corrupted or in wrong format.`);
              } else {
                console.log('[evaluations/save] ✅ PDF header validated:', pdfHeader);
              }
            }
            
            // Try Supabase Storage first (preferred method)
            if (useSupabase && supabase) {
              try {
                // Validate fileBuffer is actually a Buffer before uploading
                if (!Buffer.isBuffer(fileBuffer)) {
                  throw new Error('fileBuffer is not a Buffer instance');
                }
                
                const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const storagePath = `${evaluationId}/${sanitizedFileName}`;
                
                // Log buffer info before upload for debugging
                console.log('[evaluations/save] Uploading to Supabase Storage:', {
                  storagePath,
                  bufferLength: fileBuffer.length,
                  bufferType: fileBuffer.constructor.name,
                  firstBytesHex: fileBuffer.slice(0, 10).toString('hex'),
                  pdfHeader: fileType?.includes('pdf') ? String.fromCharCode(...fileBuffer.slice(0, 4)) : 'N/A',
                });
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('resumes')
                  .upload(storagePath, fileBuffer, {
                    contentType: fileType || 'application/pdf',
                    upsert: true,
                  });
                
                if (uploadError) {
                  console.error('[evaluations/save] Supabase Storage upload error:', {
                    error: uploadError.message,
                    code: uploadError.statusCode,
                    storagePath,
                    bucket: 'resumes',
                  });
                  throw new Error(`Supabase Storage upload failed: ${uploadError.message}. Check bucket permissions and environment variables.`);
                }
                
                resumeStoragePath = storagePath;
                resumeSaved = true;
                console.log('[evaluations/save] ✅ Resume saved to Supabase Storage:', {
                  evaluationId,
                  fileName,
                  storagePath,
                  size: fileBuffer.length,
                });
                
                // Store info to create DB record after transaction commits
                // (query() for Supabase doesn't work inside MySQL transactions)
                resumeDbRecordInfo = {
                  evaluationId,
                  fileName,
                  fileType,
                  fileSize,
                  storagePath: resumeStoragePath,
                  fileBuffer, // Keep buffer in case we need BLOB fallback
                };
              } catch (storageErr) {
                console.warn('[evaluations/save] Supabase Storage save failed, falling back to BLOB:', storageErr.message);
                // Fall through to BLOB storage
              }
            }
            
            // Fallback to BLOB storage (MySQL or if Supabase Storage failed)
            if (!resumeSaved) {
              // Check if resume already exists
              const [existing] = await connection.execute(
                'SELECT id FROM resumes WHERE evaluation_id = ?',
                [evaluationId]
              );
              
              // Check if file_path column exists
              let hasFilePathColumn = false;
              try {
                const [columns] = await connection.execute(
                  `SELECT COLUMN_NAME 
                   FROM INFORMATION_SCHEMA.COLUMNS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'resumes' 
                   AND COLUMN_NAME = 'file_path'`
                );
                hasFilePathColumn = columns && columns.length > 0;
              } catch (checkError) {
                // If we can't check, assume column doesn't exist
                hasFilePathColumn = false;
              }
              
              if (existing && existing.length > 0) {
                // Update existing resume
                if (hasFilePathColumn) {
                  await connection.execute(
                    `UPDATE resumes 
                     SET file_name = ?, file_type = ?, file_size = ?, file_content = ?, file_path = ?
                     WHERE evaluation_id = ?`,
                    [fileName, fileType || null, fileSize || null, fileBuffer, resumeStoragePath, evaluationId]
                  );
                } else {
                  await connection.execute(
                    `UPDATE resumes 
                     SET file_name = ?, file_type = ?, file_size = ?, file_content = ?
                     WHERE evaluation_id = ?`,
                    [fileName, fileType || null, fileSize || null, fileBuffer, evaluationId]
                  );
                }
                console.log('[evaluations/save] Resume updated in database (BLOB):', { evaluationId, fileName, size: fileBuffer.length });
              } else {
                // Insert new resume
                if (hasFilePathColumn) {
                  await connection.execute(
                    `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_content, file_path)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [evaluationId, fileName, fileType || null, fileSize || null, fileBuffer, resumeStoragePath]
                  );
                } else {
                  await connection.execute(
                    `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_content)
                     VALUES (?, ?, ?, ?, ?)`,
                    [evaluationId, fileName, fileType || null, fileSize || null, fileBuffer]
                  );
                }
                console.log('[evaluations/save] Resume inserted in database (BLOB):', { evaluationId, fileName, size: fileBuffer.length });
              }
              
              resumeSaved = true;
              console.log('[evaluations/save] ✅ Resume saved successfully to database (BLOB)');
            }
          }
        } catch (resumeErr) {
          resumeError = resumeErr.message || 'Unknown error';
          console.error('[evaluations/save] ❌ Error saving resume:', {
            error: resumeErr.message,
            stack: resumeErr.stack,
            evaluationId,
            hasResumeFile: !!resumeFile,
          });
          // Don't fail the whole transaction if resume save fails
          // Evaluation is more important than resume file
        }
      } else {
        if (!resumeFile) {
          console.warn('[evaluations/save] ⚠️ No resume file provided in request body');
        }
        if (!evaluationId) {
          console.warn('[evaluations/save] ⚠️ Cannot save resume: evaluationId is missing');
        }
      }

      await connection.commit();
      connection.release();
      
      // After transaction commits, create database record for Supabase Storage resume
      // (This must be done outside the transaction since query() for Supabase doesn't participate in MySQL transactions)
      if (resumeDbRecordInfo && resumeDbRecordInfo.storagePath) {
        try {
          console.log('[evaluations/save] Creating database record for Storage resume:', resumeDbRecordInfo);
          
          // Check if record already exists
          const existingResult = await query(
            'SELECT id FROM resumes WHERE evaluation_id = ? LIMIT 1',
            [resumeDbRecordInfo.evaluationId]
          );
          
          const existing = existingResult.success && existingResult.data && existingResult.data.length > 0;
          
          if (existing) {
            // Update existing resume record with file_path
            try {
              const updateResult = await query(
                `UPDATE resumes 
                 SET file_name = ?, file_type = ?, file_size = ?, file_path = ?
                 WHERE evaluation_id = ?`,
                [
                  resumeDbRecordInfo.fileName,
                  resumeDbRecordInfo.fileType || null,
                  resumeDbRecordInfo.fileSize || null,
                  resumeDbRecordInfo.storagePath,
                  resumeDbRecordInfo.evaluationId,
                ]
              );
              if (updateResult.success) {
                console.log('[evaluations/save] ✅ Database record updated with Storage path');
              } else {
                throw new Error(updateResult.error || 'Update failed');
              }
            } catch (updateErr) {
              // If file_path column doesn't exist, update without it
              if (updateErr.message?.includes('file_path') || updateErr.message?.includes('column')) {
                const fallbackResult = await query(
                  `UPDATE resumes 
                   SET file_name = ?, file_type = ?, file_size = ?
                   WHERE evaluation_id = ?`,
                  [
                    resumeDbRecordInfo.fileName,
                    resumeDbRecordInfo.fileType || null,
                    resumeDbRecordInfo.fileSize || null,
                    resumeDbRecordInfo.evaluationId,
                  ]
                );
                if (fallbackResult.success) {
                  console.log('[evaluations/save] ✅ Database record updated (no file_path column)');
                } else {
                  throw new Error(fallbackResult.error || 'Fallback update failed');
                }
              } else {
                throw updateErr;
              }
            }
          } else {
            // Insert new resume record with file_path (no BLOB, just metadata)
            try {
              const insertResult = await query(
                `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_path)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  resumeDbRecordInfo.evaluationId,
                  resumeDbRecordInfo.fileName,
                  resumeDbRecordInfo.fileType || null,
                  resumeDbRecordInfo.fileSize || null,
                  resumeDbRecordInfo.storagePath,
                ]
              );
              
              if (insertResult.success) {
                console.log('[evaluations/save] ✅ Database record created with Storage path:', {
                  evaluationId: resumeDbRecordInfo.evaluationId,
                  insertedId: insertResult.data?.[0]?.id,
                });
              } else {
                throw new Error(insertResult.error || 'Insert failed');
              }
            } catch (insertErr) {
              console.error('[evaluations/save] Insert error:', insertErr.message);
              // If file_path column doesn't exist, insert without it (will store BLOB)
              if (insertErr.message?.includes('file_path') || insertErr.message?.includes('column')) {
                console.log('[evaluations/save] Retrying INSERT without file_path column');
                // For Supabase, convert Buffer to hex format to avoid JSON serialization
                let fileContentForDb = resumeDbRecordInfo.fileBuffer;
                if (useSupabase && Buffer.isBuffer(fileContentForDb)) {
                  // Convert to hex string with \x prefix for PostgreSQL BYTEA
                  fileContentForDb = '\\x' + fileContentForDb.toString('hex');
                  console.log('[evaluations/save] Converted Buffer to hex for Supabase INSERT');
                }
                
                const fallbackResult = await query(
                  `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_content)
                   VALUES (?, ?, ?, ?, ?)`,
                  [
                    resumeDbRecordInfo.evaluationId,
                    resumeDbRecordInfo.fileName,
                    resumeDbRecordInfo.fileType || null,
                    resumeDbRecordInfo.fileSize || null,
                    fileContentForDb,
                  ]
                );
                if (fallbackResult.success) {
                  console.log('[evaluations/save] ✅ Database record created with BLOB (no file_path column)');
                } else {
                  throw new Error(fallbackResult.error || 'Fallback insert failed');
                }
              } else {
                throw insertErr;
              }
            }
          }
        } catch (dbErr) {
          console.error('[evaluations/save] ❌ Error saving database record after transaction:', {
            error: dbErr.message,
            stack: dbErr.stack,
            resumeDbRecordInfo,
          });
          // Don't fail the whole request - Storage save succeeded
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Evaluation saved successfully',
        data: {
          evaluationId,
          candidateId,
          resumeSaved, // Indicate if resume was saved
          resumeStoragePath, // Path in Supabase Storage (if used)
          resumeError: resumeError || null, // Include error if resume save failed
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save evaluation',
      details: error.message,
    });
  }
}

