import { query } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Check if using Supabase
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
let supabase = null;

if (useSupabase) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId } = req.query;

    if (!evaluationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: evaluationId',
      });
    }

    const evalId = parseInt(evaluationId, 10);
    if (isNaN(evalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evaluationId format',
      });
    }

    console.log('[resumes/get] Fetching resume for evaluationId:', evalId);

    // Get resume metadata
    let result;
    try {
      result = await query(
        'SELECT file_name, file_type, file_size, file_path FROM resumes WHERE evaluation_id = ? LIMIT 1',
        [evalId]
      );
    } catch (columnError) {
      if (columnError.message?.includes('file_path') || columnError.message?.includes('Unknown column')) {
        result = await query(
          'SELECT file_name, file_type, file_size FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evalId]
        );
      } else {
        throw columnError;
      }
    }

    if (!result.success || !result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found for this evaluation.',
        hint: 'Please re-evaluate the candidate to save the resume file.',
      });
    }

    const resume = result.data[0];

    // Best Practice: Use Supabase Storage signed URL (preferred method)
    if (resume.file_path && useSupabase && supabase) {
      try {
        console.log('[resumes/get] Attempting Supabase Storage:', {
          file_path: resume.file_path,
          useSupabase,
          hasSupabaseClient: !!supabase,
        });
        
        // Use service role key for better permissions
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let storageClient = supabase;
        if (serviceRoleKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
          storageClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
          });
          console.log('[resumes/get] Using service role key for Storage access');
        }
        
        // Best Practice: Stream file directly through API (avoids CORS issues on Vercel)
        // Download from Storage and stream to client - this works reliably everywhere
        const { data: fileData, error: downloadError } = await storageClient.storage
          .from('resumes')
          .download(resume.file_path);
        
        if (!downloadError && fileData) {
          // Convert Blob to Buffer
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Validate PDF header
          if (resume.file_type?.includes('pdf') || resume.file_name?.toLowerCase().endsWith('.pdf')) {
            if (buffer.length >= 4) {
              const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
              if (pdfHeader !== '%PDF') {
                console.error('[resumes/get] ❌ PDF header validation failed from Storage');
                // Fall through to BLOB
              } else {
                console.log('[resumes/get] ✅ PDF header validated from Storage');
              }
            }
          }
          
          // Stream file directly as binary (no base64, no CORS issues, works on Vercel)
          const mimeType = resume.file_type || 'application/pdf';
          
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.file_name)}"`);
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
          res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for Vercel
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          
          console.log('[resumes/get] ✅ Streaming file from Supabase Storage');
          return res.status(200).send(buffer);
        } else {
          console.error('[resumes/get] ❌ Storage download failed:', {
            error: downloadError?.message,
            code: downloadError?.statusCode,
            file_path: resume.file_path,
          });
          console.warn('[resumes/get] Falling back to BLOB stream');
        }
      } catch (storageErr) {
        console.error('[resumes/get] ❌ Supabase Storage exception:', {
          error: storageErr.message,
          stack: storageErr.stack,
        });
        console.warn('[resumes/get] Falling back to BLOB stream');
      }
    } else {
      console.log('[resumes/get] Supabase Storage not available:', {
        hasFilePath: !!resume.file_path,
        useSupabase,
        hasSupabaseClient: !!supabase,
      });
    }

    // Fallback: Stream file directly from database (no base64 conversion)
    // This is more efficient than base64 encoding
    try {
      const blobResult = await query(
        'SELECT file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
        [evalId]
      );

      if (!blobResult.success || !blobResult.data || blobResult.data.length === 0 || !blobResult.data[0].file_content) {
        return res.status(404).json({
          success: false,
          error: 'Resume file content not found.',
          hint: 'The resume may not have been saved properly. Please re-evaluate the candidate.',
        });
      }

      const fileContent = blobResult.data[0].file_content;
      
      // Convert to Buffer if needed
      let buffer;
      try {
        if (Buffer.isBuffer(fileContent)) {
          buffer = fileContent;
        } else if (typeof fileContent === 'string') {
          // Handle JSON-serialized Buffer
          try {
            const parsed = JSON.parse(fileContent);
            if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
              buffer = Buffer.from(parsed.data);
              console.log('[resumes/get] Extracted Buffer from JSON-serialized format');
            } else {
              // Try hex or base64
              const cleaned = fileContent.replace(/^\\x/, '').trim();
              if (/^[0-9a-fA-F]+$/i.test(cleaned)) {
                buffer = Buffer.from(cleaned, 'hex');
                console.log('[resumes/get] Converted hex string to Buffer');
              } else {
                buffer = Buffer.from(fileContent, 'base64');
                console.log('[resumes/get] Converted base64 string to Buffer');
              }
            }
          } catch (parseErr) {
            // Try as hex or base64 directly
            const cleaned = fileContent.replace(/^\\x/, '').trim();
            if (/^[0-9a-fA-F]+$/i.test(cleaned)) {
              buffer = Buffer.from(cleaned, 'hex');
              console.log('[resumes/get] Converted hex string to Buffer (fallback)');
            } else {
              buffer = Buffer.from(fileContent, 'base64');
              console.log('[resumes/get] Converted base64 string to Buffer (fallback)');
            }
          }
        } else if (Array.isArray(fileContent)) {
          buffer = Buffer.from(fileContent);
          console.log('[resumes/get] Converted array to Buffer');
        } else {
          console.error('[resumes/get] Unknown file_content type:', typeof fileContent);
          return res.status(500).json({
            success: false,
            error: 'Unable to process file content format',
            details: `Expected Buffer, string, or array, got ${typeof fileContent}`,
          });
        }

        if (!buffer || buffer.length === 0) {
          return res.status(500).json({
            success: false,
            error: 'File content is empty',
            hint: 'The resume may not have been saved properly. Please re-evaluate the candidate.',
          });
        }

        console.log('[resumes/get] Buffer created:', {
          length: buffer.length,
          firstBytesHex: buffer.slice(0, 10).toString('hex'),
        });

        // Validate PDF header
        if (resume.file_type?.includes('pdf') || resume.file_name?.toLowerCase().endsWith('.pdf')) {
          if (buffer.length < 4) {
            return res.status(500).json({
              success: false,
              error: 'File is too small to be a valid PDF',
              hint: 'The resume may not have been saved properly. Please re-evaluate the candidate.',
            });
          }
          
          const pdfHeader = String.fromCharCode(...buffer.slice(0, 4));
          const firstBytesHex = buffer.slice(0, 10).toString('hex');
          
          if (pdfHeader !== '%PDF') {
            console.error('[resumes/get] PDF header validation failed:', {
              expected: '%PDF',
              actual: pdfHeader,
              firstBytesHex,
              bufferLength: buffer.length,
            });
            
            // If we have file_path, Storage should have been used - this is a fallback
            if (resume.file_path) {
              return res.status(500).json({
                success: false,
                error: 'BLOB data is corrupted and Supabase Storage retrieval failed.',
                hint: 'Please re-evaluate the candidate to save a fresh copy. The file in Storage may also need to be checked.',
              });
            } else {
              return res.status(500).json({
                success: false,
                error: 'File appears to be corrupted.',
                hint: 'Please re-evaluate the candidate to save a fresh copy.',
              });
            }
          }
          
          console.log('[resumes/get] ✅ PDF header validated');
        }
      } catch (bufferErr) {
        console.error('[resumes/get] Error converting file_content to Buffer:', bufferErr);
        return res.status(500).json({
          success: false,
          error: 'Failed to process file content',
          details: bufferErr.message,
          hint: 'The resume may not have been saved properly. Please re-evaluate the candidate.',
        });
      }

      // Best Practice: Stream file directly as binary (no base64, works on Vercel)
      const mimeType = resume.file_type || 'application/pdf';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.file_name)}"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for Vercel
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      
      console.log('[resumes/get] ✅ Streaming file from database');
      return res.status(200).send(buffer);
      
    } catch (blobErr) {
      console.error('[resumes/get] Error streaming file:', blobErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve resume file',
        details: blobErr.message,
      });
    }
  } catch (error) {
    console.error('[resumes/get] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resume',
      details: error.message,
    });
  }
}
