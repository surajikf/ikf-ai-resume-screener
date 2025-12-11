import { query } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Diagnostic and fix script for resume storage issues
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId, action } = req.query;
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    if (!useSupabase) {
      return res.status(400).json({
        success: false,
        error: 'Supabase is not enabled',
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(400).json({
        success: false,
        error: 'Supabase credentials not configured',
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const results = {
      evaluationId: evaluationId || 'all',
      action: action || 'diagnose',
      timestamp: new Date().toISOString(),
      checks: [],
      fixes: [],
      errors: [],
    };

    // 1. Check database records
    if (evaluationId) {
      const evalId = parseInt(evaluationId, 10);
      const dbResult = await query(
        'SELECT id, evaluation_id, file_name, file_type, file_size, file_path FROM resumes WHERE evaluation_id = ?',
        [evalId]
      );

      if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
        const resume = dbResult.data[0];
        results.checks.push({
          type: 'database_record',
          status: 'found',
          data: {
            id: resume.id,
            evaluationId: resume.evaluation_id,
            fileName: resume.file_name,
            fileType: resume.file_type,
            fileSize: resume.file_size,
            filePath: resume.file_path,
          },
        });

        // 2. Check Supabase Storage
        if (resume.file_path) {
          try {
            // Check if file exists in Storage
            const { data: fileList, error: listError } = await supabase.storage
              .from('resumes')
              .list(resume.file_path.split('/')[0]); // List files in the evaluation folder

            const fileExists = fileList?.some(file => 
              file.name === resume.file_path.split('/').pop()
            );

            results.checks.push({
              type: 'storage_file',
              status: fileExists ? 'found' : 'missing',
              filePath: resume.file_path,
              folderContents: fileList?.map(f => f.name) || [],
            });

            // Try to download and validate
            if (fileExists) {
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('resumes')
                .download(resume.file_path);

              if (!downloadError && fileData) {
                const arrayBuffer = await fileData.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // Validate PDF header
                if (resume.file_type?.includes('pdf') || resume.file_name?.toLowerCase().endsWith('.pdf')) {
                  const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
                  const isValid = pdfHeader === '%PDF';
                  
                  results.checks.push({
                    type: 'storage_file_validation',
                    status: isValid ? 'valid' : 'corrupted',
                    pdfHeader,
                    fileSize: buffer.length,
                    firstBytesHex: buffer.slice(0, 10).toString('hex'),
                  });

                  // If corrupted and action is 'fix', try to fix it
                  if (!isValid && action === 'fix') {
                    // Check if BLOB is valid
                    const blobResult = await query(
                      'SELECT file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
                      [evalId]
                    );

                    if (blobResult.success && blobResult.data && blobResult.data[0]?.file_content) {
                      let blobBuffer;
                      const fileContent = blobResult.data[0].file_content;
                      
                      if (Buffer.isBuffer(fileContent)) {
                        blobBuffer = fileContent;
                      } else if (typeof fileContent === 'string') {
                        try {
                          const parsed = JSON.parse(fileContent);
                          if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
                            blobBuffer = Buffer.from(parsed.data);
                          }
                        } catch {
                          // Try other formats
                        }
                      }

                      if (blobBuffer) {
                        const blobPdfHeader = String.fromCharCode(...blobBuffer.slice(0, 4));
                        if (blobPdfHeader === '%PDF') {
                          // BLOB is valid, re-upload to Storage
                          const sanitizedFileName = resume.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
                          const storagePath = `${evalId}/${sanitizedFileName}`;
                          
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('resumes')
                            .upload(storagePath, blobBuffer, {
                              contentType: resume.file_type || 'application/pdf',
                              upsert: true,
                            });

                          if (!uploadError) {
                            // Update database record
                            await query(
                              'UPDATE resumes SET file_path = ? WHERE evaluation_id = ?',
                              [storagePath, evalId]
                            );

                            results.fixes.push({
                              type: 're_upload_to_storage',
                              status: 'success',
                              storagePath,
                            });
                          } else {
                            results.errors.push({
                              type: 're_upload_failed',
                              error: uploadError.message,
                            });
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                results.checks.push({
                  type: 'storage_download',
                  status: 'failed',
                  error: downloadError?.message,
                });
              }
            }
          } catch (storageErr) {
            results.errors.push({
              type: 'storage_check_error',
              error: storageErr.message,
            });
          }
        } else {
          results.checks.push({
            type: 'storage_file',
            status: 'no_file_path',
            message: 'Database record has no file_path - file may not be in Storage',
          });
        }

        // 3. Check BLOB data
        const blobResult = await query(
          'SELECT file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evalId]
        );

        if (blobResult.success && blobResult.data && blobResult.data[0]?.file_content) {
          const fileContent = blobResult.data[0].file_content;
          let buffer;
          
          try {
            if (Buffer.isBuffer(fileContent)) {
              buffer = fileContent;
            } else if (typeof fileContent === 'string') {
              try {
                const parsed = JSON.parse(fileContent);
                if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
                  buffer = Buffer.from(parsed.data);
                }
              } catch {
                buffer = Buffer.from(fileContent, 'base64');
              }
            }

            if (buffer && buffer.length > 0) {
              const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
              const isValid = pdfHeader === '%PDF';
              
              results.checks.push({
                type: 'blob_validation',
                status: isValid ? 'valid' : 'corrupted',
                pdfHeader,
                fileSize: buffer.length,
                firstBytesHex: buffer.slice(0, 10).toString('hex'),
              });
            }
          } catch (blobErr) {
            results.checks.push({
              type: 'blob_validation',
              status: 'error',
              error: blobErr.message,
            });
          }
        } else {
          results.checks.push({
            type: 'blob_validation',
            status: 'no_blob',
            message: 'No BLOB data found in database',
          });
        }
      } else {
        results.checks.push({
          type: 'database_record',
          status: 'not_found',
          evaluationId: evalId,
        });
      }
    } else {
      // Check all resumes
      const allResumes = await query(
        'SELECT evaluation_id, file_name, file_path FROM resumes ORDER BY id DESC LIMIT 20'
      );

      if (allResumes.success && allResumes.data) {
        results.checks.push({
          type: 'all_resumes_summary',
          count: allResumes.data.length,
          resumes: allResumes.data.map(r => ({
            evaluationId: r.evaluation_id,
            fileName: r.file_name,
            hasFilePath: !!r.file_path,
          })),
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[resumes/diagnose] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Diagnostic failed',
      details: error.message,
    });
  }
}

