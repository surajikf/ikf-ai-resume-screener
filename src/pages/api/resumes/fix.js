import { query } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Fix script to re-upload corrupted files from BLOB to Storage
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId } = req.body;
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    if (!useSupabase) {
      return res.status(400).json({
        success: false,
        error: 'Supabase is not enabled',
      });
    }

    if (!evaluationId) {
      return res.status(400).json({
        success: false,
        error: 'evaluationId is required',
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

    const evalId = parseInt(evaluationId, 10);
    
    // Get resume record
    const dbResult = await query(
      'SELECT id, evaluation_id, file_name, file_type, file_size, file_path FROM resumes WHERE evaluation_id = ?',
      [evalId]
    );

    if (!dbResult.success || !dbResult.data || dbResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    const resume = dbResult.data[0];

    // Get BLOB data
    const blobResult = await query(
      'SELECT file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
      [evalId]
    );

    if (!blobResult.success || !blobResult.data || !blobResult.data[0]?.file_content) {
      return res.status(404).json({
        success: false,
        error: 'BLOB data not found',
      });
    }

    const fileContent = blobResult.data[0].file_content;
    let buffer;

    // Convert to Buffer - handle JSON-serialized Buffer objects
    try {
      if (Buffer.isBuffer(fileContent)) {
        buffer = fileContent;
        console.log('[resumes/fix] File content is already a Buffer');
      } else if (typeof fileContent === 'string') {
        // Check if it's a JSON-serialized Buffer object (most common corruption)
        let parsed;
        try {
          parsed = JSON.parse(fileContent);
          if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
            buffer = Buffer.from(parsed.data);
            console.log('[resumes/fix] ✅ Extracted Buffer from JSON-serialized format, length:', buffer.length);
            
            // Validate the extracted buffer
            if (buffer.length === 0) {
              throw new Error('Extracted buffer is empty');
            }
            
            // Quick PDF header check
            if (buffer.length >= 4) {
              const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
              if (pdfHeader === '%PDF') {
                console.log('[resumes/fix] ✅ Extracted buffer has valid PDF header');
              } else {
                console.warn('[resumes/fix] ⚠️ Extracted buffer PDF header:', pdfHeader);
              }
            }
          } else {
            // Not a Buffer object, try other formats
            parsed = null;
          }
        } catch (parseErr) {
          // Not JSON, continue with other formats
          parsed = null;
        }

        if (!buffer) {
          // Try hex or base64
          const cleaned = fileContent.replace(/^\\x/, '').trim();
          if (/^[0-9a-fA-F]+$/i.test(cleaned)) {
            buffer = Buffer.from(cleaned, 'hex');
            console.log('[resumes/fix] Converted hex string to Buffer');
          } else {
            // Try base64
            try {
              buffer = Buffer.from(fileContent, 'base64');
              console.log('[resumes/fix] Converted base64 string to Buffer');
            } catch (base64Err) {
              console.error('[resumes/fix] Failed to convert string to Buffer:', base64Err.message);
              throw new Error('Unable to convert file content to Buffer - data format is unrecognized');
            }
          }
        }
      } else if (Array.isArray(fileContent)) {
        buffer = Buffer.from(fileContent);
        console.log('[resumes/fix] Converted array to Buffer');
      } else if (fileContent && typeof fileContent === 'object') {
        // Handle object that might be a Buffer-like object
        if (fileContent.type === 'Buffer' && Array.isArray(fileContent.data)) {
          buffer = Buffer.from(fileContent.data);
          console.log('[resumes/fix] Extracted Buffer from object format');
        } else {
          return res.status(500).json({
            success: false,
            error: 'Unable to convert file content to Buffer',
            contentType: typeof fileContent,
            isArray: Array.isArray(fileContent),
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          error: 'Unable to convert file content to Buffer',
          contentType: typeof fileContent,
        });
      }

      if (!buffer || buffer.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Buffer is empty after conversion',
        });
      }

      console.log('[resumes/fix] Buffer created:', {
        length: buffer.length,
        firstBytesHex: buffer.slice(0, 10).toString('hex'),
        firstBytes: Array.from(buffer.slice(0, 10)),
      });

      // Validate PDF header (only after buffer is extracted)
      if (resume.file_type?.includes('pdf') || resume.file_name?.toLowerCase().endsWith('.pdf')) {
        if (buffer.length < 4) {
          return res.status(500).json({
            success: false,
            error: 'File is too small to be a valid PDF',
            bufferLength: buffer.length,
          });
        }

        const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
        const firstBytesHex = buffer.slice(0, 10).toString('hex');
        
        if (pdfHeader !== '%PDF') {
          console.error('[resumes/fix] ❌ PDF header validation failed:', {
            expected: '%PDF',
            actual: pdfHeader,
            firstBytesHex,
            bufferLength: buffer.length,
            firstBytes: Array.from(buffer.slice(0, 10)),
          });
          
          // If it looks like JSON, the BLOB is corrupted and we can't fix it
          if (pdfHeader.startsWith('{"') || pdfHeader.startsWith('{')) {
            return res.status(500).json({
              success: false,
              error: 'BLOB data is corrupted - it contains JSON instead of PDF binary. The file needs to be re-evaluated.',
              pdfHeader,
              firstBytesHex,
              hint: 'Please re-evaluate this candidate to save a fresh, correct copy of the resume.',
            });
          }
          
          return res.status(500).json({
            success: false,
            error: 'BLOB data is corrupted (not a valid PDF)',
            pdfHeader,
            firstBytesHex,
            hint: 'Please re-evaluate this candidate to save a fresh copy.',
          });
        }
        
        console.log('[resumes/fix] ✅ PDF header validated after extraction');
      }

      // Upload to Supabase Storage
      const sanitizedFileName = resume.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${evalId}/${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, buffer, {
          contentType: resume.file_type || 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload to Supabase Storage',
          details: uploadError.message,
        });
      }

      // Update database record with file_path
      try {
        await query(
          'UPDATE resumes SET file_path = ? WHERE evaluation_id = ?',
          [storagePath, evalId]
        );
      } catch (updateErr) {
        // If file_path column doesn't exist, that's okay - file is still in Storage
        console.warn('[resumes/fix] Could not update file_path:', updateErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'File successfully re-uploaded to Supabase Storage',
        data: {
          evaluationId: evalId,
          fileName: resume.file_name,
          storagePath,
          fileSize: buffer.length,
        },
      });
    } catch (err) {
      console.error('[resumes/fix] Error:', err);
      return res.status(500).json({
        success: false,
        error: 'Fix failed',
        details: err.message,
      });
    }
  } catch (error) {
    console.error('[resumes/fix] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Fix failed',
      details: error.message,
    });
  }
}

