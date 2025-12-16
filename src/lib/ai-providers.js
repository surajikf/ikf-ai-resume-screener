/**
 * AI Provider Abstraction Layer
 * Supports multiple free AI providers: Google Gemini, Groq, Hugging Face, KIE AI
 */

// Google Gemini
async function callGemini(systemPrompt, userContent, apiKey = null) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Get it from https://makersuite.google.com/app/apikey');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' // or 'gemini-1.5-pro' for better quality
  });

  // Combine system prompt and user content
  // Add explicit JSON format instruction to system prompt
  const enhancedSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You MUST respond with ONLY valid JSON. Do not include any markdown code blocks, explanations, or text outside the JSON object.`;
  const fullPrompt = `${enhancedSystemPrompt}\n\n${userContent}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json', // Force JSON response
    },
  });
  
  const response = await result.response;
  const text = response.text();

  // Clean up the response
  let jsonText = text.trim();
  
  // Remove markdown code blocks if present (fallback)
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return jsonText;
}

// Groq (very fast, free tier available)
// Supports models like: llama-3.1-70b-versatile, moonshotai/kimi-k2-instruct-0905, mixtral-8x7b-32768
async function callGroq(systemPrompt, userContent, apiKey = null, model = null) {
  const Groq = require('groq-sdk');
  
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not set. Get it from https://console.groq.com/keys');
  }

  const groq = new Groq({
    apiKey: key,
  });

  // Use Kimi K2 as default (enhanced coding capabilities, 256K context)
  // Or use model from settings/env, fallback to llama-3.1-70b-versatile
  const groqModel = model || process.env.GROQ_MODEL || 'moonshotai/kimi-k2-instruct-0905';
  
  console.log(`[Groq] Using model: ${groqModel}`);

  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    model: groqModel,
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || '';
}

// Hugging Face Inference API
async function callHuggingFace(systemPrompt, userContent, apiKey = null) {
  const key = apiKey || process.env.HUGGINGFACE_API_KEY;
  if (!key) {
    throw new Error('HUGGINGFACE_API_KEY is not set. Get it from https://huggingface.co/settings/tokens');
  }

  const fullPrompt = `${systemPrompt}\n\n${userContent}`;
  const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct';

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          return_full_text: false,
          max_new_tokens: 4000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  const result = await response.json();
  
  // Hugging Face returns array of objects with generated_text
  if (Array.isArray(result) && result[0]?.generated_text) {
    let jsonText = result[0].generated_text.trim();
    
    // Extract JSON from response
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return jsonText;
  }

  throw new Error('Unexpected response format from Hugging Face');
}

// KIE AI (OpenAI-compatible API)
async function callKieAI(systemPrompt, userContent, apiKey = null) {
  const key = apiKey || process.env.KIE_API_KEY;
  if (!key) {
    throw new Error('KIE_API_KEY is not set. Get it from https://www.kie-ai.com/');
  }

  const kieApiUrl = process.env.KIE_API_URL || 'https://api.kie.ai';
  const kieApiEndpoint = process.env.KIE_API_ENDPOINT || '/api/v1/gpt4o/generate'; // Try different endpoint format
  const model = process.env.KIE_MODEL || 'gpt-4o'; // Default model, adjust based on KIE AI's available models

  // Try multiple endpoint formats
  const endpointsToTry = [
    kieApiEndpoint, // User configured endpoint
    '/api/v1/gpt4o/generate', // Common KIE AI endpoint format
    '/api/v1/chat/completions', // OpenAI-compatible format
    '/v1/chat/completions', // Standard OpenAI format
    '/chat/completions', // Simplified format
  ];

  let lastError = null;
  
  for (const endpoint of endpointsToTry) {
    try {
      const fullUrl = `${kieApiUrl}${endpoint}`;
      console.log(`[KIE AI] Trying endpoint: ${fullUrl}`);
      
      // KIE AI might use a different request format - try OpenAI format first
      let requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      };

      // If endpoint contains 'generate', it might be a different format
      if (endpoint.includes('generate')) {
        // Try KIE AI specific format
        requestBody = {
          prompt: `${systemPrompt}\n\n${userContent}`,
          model: model,
          max_tokens: 4000,
        };
      }

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle different response formats
        let content = null;
        if (result.choices?.[0]?.message?.content) {
          // OpenAI-compatible format
          content = result.choices[0].message.content;
        } else if (result.text) {
          // Simple text response
          content = result.text;
        } else if (result.response) {
          // Nested response
          content = result.response;
        } else if (typeof result === 'string') {
          // Direct string response
          content = result;
        }

        if (content) {
          console.log(`[KIE AI] Success with endpoint: ${endpoint}`);
          return content;
        }
      } else {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;
        console.log(`[KIE AI] Endpoint ${endpoint} failed: ${lastError}`);
        
        // If 404, try next endpoint
        if (response.status === 404) {
          continue;
        }
        // For other errors, throw immediately
        throw new Error(`KIE AI API error (${response.status}): ${errorText}`);
      }
    } catch (error) {
      lastError = error.message;
      // If it's a 404, try next endpoint
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  // If all endpoints failed, throw error that will trigger auto-fallback to Gemini
  const errorMsg = `KIE AI API: All endpoints failed. Last error: ${lastError}. Auto-fallback to Gemini will be attempted if configured.`;
  console.error(`[KIE AI] ${errorMsg}`);
  throw new Error(errorMsg);
}

// OpenAI (original, paid)
async function callOpenAI(systemPrompt, userContent, apiKey = null) {
  const OpenAI = require('openai');
  
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const openai = new OpenAI({
    apiKey: key,
  });

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Main function to call AI provider
 * @param {string} systemPrompt - System prompt
 * @param {string} userContent - User content
 * @param {object} settings - Optional settings object with provider and API keys (from database)
 * @returns {Promise<string>} JSON string response
 */
export async function callAIProvider(systemPrompt, userContent, settings = null) {
  // Use settings from database if provided, otherwise fall back to environment variables
  const provider = settings?.aiProvider 
    ? settings.aiProvider.toLowerCase() 
    : (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  
  // Create a merged settings object that prioritizes database settings over env vars
  const mergedSettings = {
    geminiApiKey: settings?.geminiApiKey || process.env.GEMINI_API_KEY,
    groqApiKey: settings?.groqApiKey || process.env.GROQ_API_KEY,
    groqModel: settings?.groqModel || process.env.GROQ_MODEL, // Support custom Groq models
    huggingfaceApiKey: settings?.huggingfaceApiKey || process.env.HUGGINGFACE_API_KEY,
    kieApiKey: settings?.kieApiKey || process.env.KIE_API_KEY,
    openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY,
  };

  console.log(`[AI Provider] Using: ${provider}`);

  try {
    switch (provider) {
      case 'gemini':
        return await callGemini(systemPrompt, userContent, mergedSettings.geminiApiKey);
      
      case 'groq':
        return await callGroq(systemPrompt, userContent, mergedSettings.groqApiKey, mergedSettings.groqModel);
      
      case 'huggingface':
      case 'hf':
        return await callHuggingFace(systemPrompt, userContent, mergedSettings.huggingfaceApiKey);
      
      case 'kie':
      case 'kieai':
        return await callKieAI(systemPrompt, userContent, mergedSettings.kieApiKey);
      
      case 'openai':
        return await callOpenAI(systemPrompt, userContent, mergedSettings.openaiApiKey);
      
      default:
        throw new Error(`Unknown AI provider: ${provider}. Supported: gemini, groq, huggingface, kie, openai`);
    }
  } catch (error) {
    console.error(`[AI Provider] Error with ${provider}:`, error.message);
    
    // Auto-fallback chain: Try Gemini first, then Groq if Gemini fails
    const fallbackProviders = [];
    
    // Add Gemini as fallback if available and not the primary provider
    if (provider !== 'gemini' && mergedSettings.geminiApiKey) {
      fallbackProviders.push({ name: 'gemini', func: callGemini, key: mergedSettings.geminiApiKey });
    }
    
    // Add Groq as fallback if available and not the primary provider
    if (provider !== 'groq' && mergedSettings.groqApiKey) {
      fallbackProviders.push({ name: 'groq', func: callGroq, key: mergedSettings.groqApiKey, model: mergedSettings.groqModel });
    }
    
    // Try fallback providers in order
    if (fallbackProviders.length > 0) {
      for (const fallback of fallbackProviders) {
        try {
          console.log(`[AI Provider] ⚠️ ${provider} failed, trying fallback: ${fallback.name}...`);
          let fallbackResult;
          if (fallback.name === 'groq') {
            fallbackResult = await fallback.func(systemPrompt, userContent, fallback.key, fallback.model);
          } else {
            fallbackResult = await fallback.func(systemPrompt, userContent, fallback.key);
          }
          console.log(`[AI Provider] ✅ Fallback to ${fallback.name} successful`);
          return fallbackResult;
        } catch (fallbackError) {
          console.error(`[AI Provider] Fallback to ${fallback.name} also failed:`, fallbackError.message);
          // Continue to next fallback provider
          continue;
        }
      }
      
      // All fallbacks failed
      throw new Error(`Primary provider (${provider}) failed and all fallbacks (${fallbackProviders.map(f => f.name).join(', ')}) also failed. Please check your API keys in Settings.`);
    }
    
    // If KIE AI fails and no fallback available, provide helpful error
    if (provider === 'kie' || provider === 'kieai') {
      throw new Error(`KIE AI is not working. Error: ${error.message}. Please switch to Groq (fast, Kimi K2) or Gemini (free) in Settings.`);
    }
    
    throw error;
  }
}

