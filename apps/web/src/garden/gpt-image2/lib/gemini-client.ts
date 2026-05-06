/**
 * Gemini API Client
 * 負責處理 Prompt Studio 中的 AI 輔助功能（單一欄位最佳化、全域性重構、一鍵填表）
 */

const GEMINI_API_KEY = '';
const BACKUP_KEY_1 = '';
const BACKUP_KEY_2 = '';

const apiKeys = [GEMINI_API_KEY, BACKUP_KEY_1, BACKUP_KEY_2].filter(Boolean);
let currentKeyIndex = 0;

function getActiveKey() {
  return apiKeys[currentKeyIndex];
}

function rotateKey() {
  if (apiKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.warn(`[Gemini Client] 切換至備用 API Key (Index: ${currentKeyIndex})`);
    return true;
  }
  return false;
}

export interface AiRefineRequest {
  action: 'refine_field' | 'refine_global' | 'magic_fill';
  intent: string;
  context?: {
    template?: string;
    placeholders?: string[];
    currentArgs?: Record<string, string>;
    targetField?: string;
    currentFieldValue?: string;
  };
}

/**
 * 呼叫 Gemini 進行欄位或整體的最佳化
 */
export async function callGeminiCopilot(request: AiRefineRequest, attempt = 1): Promise<any> {
  const currentKey = getActiveKey();
  if (!currentKey) {
    return { success: false, error: '環境變數中未設定 VITE_GEMINI_API_KEY' };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`;
  
  let promptText = '';

  if (request.action === 'refine_field') {
    promptText = `You are an expert prompt engineer assistant. 
Your task is to refine and expand the value of a specific field in a template based on the user's intent.
Field Name: "${request.context?.targetField}"
Current Value: "${request.context?.currentFieldValue}"
User Intent: "${request.intent}"

Return ONLY the refined text for this field. Do not wrap in markdown or explain your reasoning.`;
  } else if (request.action === 'magic_fill') {
    const placeholders = request.context?.placeholders || [];
    promptText = `You are an expert prompt engineer assistant.
Your task is to auto-fill the following placeholders based on the user's overall intent.
Template Context:
${request.context?.template || ''}

Current Arguments:
${JSON.stringify(request.context?.currentArgs || {}, null, 2)}

User Intent: "${request.intent}"

Placeholders to fill: ${placeholders.join(', ')}

Return a valid JSON object where keys are the placeholders and values are the generated text. DO NOT include markdown formatting like \`\`\`json. Return only raw JSON.`;
  } else {
    return { success: false, error: 'Unknown action' };
  }

  try {
    console.log(`[Gemini Client] 傳送請求: ${request.action} (Attempt: ${attempt})`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 如果遇到 429 或是 API Key 問題，且還有備用金鑰，則切換並重試
      if ((response.status === 429 || response.status === 403 || response.status === 400) && attempt < apiKeys.length) {
        console.warn(`API Error ${response.status}: ${errorText}`);
        if (rotateKey()) {
          return callGeminiCopilot(request, attempt + 1);
        }
      }
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (request.action === 'refine_field') {
      return { success: true, result: generatedText.trim() };
    } else if (request.action === 'magic_fill') {
      let cleanedJson = generatedText.trim();
      if (cleanedJson.startsWith('\`\`\`json')) cleanedJson = cleanedJson.replace(/\`\`\`json/g, '');
      if (cleanedJson.startsWith('\`\`\`')) cleanedJson = cleanedJson.replace(/\`\`\`/g, '');
      cleanedJson = cleanedJson.trim();
      
      try {
        const parsed = JSON.parse(cleanedJson);
        return { success: true, result: parsed };
      } catch (e) {
        console.error('Failed to parse magic_fill JSON:', cleanedJson);
        return { success: false, error: 'AI did not return valid JSON' };
      }
    }
  } catch (error: any) {
    console.error('[Gemini Client] API 錯誤:', error);
    // 網路錯誤等例外狀況也可嘗試切換金鑰
    if (attempt < apiKeys.length && rotateKey()) {
      return callGeminiCopilot(request, attempt + 1);
    }
    return { success: false, error: error.message };
  }
}
