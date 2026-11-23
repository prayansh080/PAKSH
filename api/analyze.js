/**
 * Vercel serverless function: /api/analyze
 * Layer 2: Gemini AI analysis with structured JSON output.
 * Timeout: 6s (leaves buffer inside Vercel's 10s hobby limit).
 * Falls back silently to rules-only shape on failure/timeout.
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, imageBase64, rules } = req.body;

  if (!message && !imageBase64) {
    return res.status(400).json({ error: 'Message or image required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  // If no API key, return a rules-compatible placeholder (silent fallback)
  if (!apiKey) {
    return res.status(200).json({
      extractedText: message || '',
      category: 'other',
      confidence: 50,
      summary: 'AI unavailable; rules-based analysis used.',
      dna: [],
      evidence: [],
      actions: []
    });
  }

  const schema = {
    type: 'object',
    properties: {
      extractedText: { type: 'string' },
      category: {
        type: 'string',
        enum: [
          'fake_internship',
          'kyc_phishing',
          'courier_scam',
          'scholarship_scam',
          'upi_fraud',
          'job_scam',
          'other',
          'safe'
        ]
      },
      confidence: { type: 'number', minimum: 0, maximum: 100 },
      summary: { type: 'string' },
      dna: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stage: { type: 'string' },
            present: { type: 'boolean' },
            phrase: { type: 'string' },
            psychology: { type: 'string' },
            goal: { type: 'string' }
          },
          required: ['stage', 'present', 'phrase', 'psychology', 'goal']
        }
      },
      evidence: { type: 'array', items: { type: 'string' } },
      actions: { type: 'array', items: { type: 'string' } }
    },
    required: ['extractedText', 'category', 'confidence', 'summary', 'dna', 'evidence', 'actions']
  };

  const parts = [];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
  }

  const rulesText = rules
    ? `\n\nRules engine detected these signals:\n${JSON.stringify(rules, null, 2)}\n`
    : '';

  parts.push({
    text: `You are TRUSTLENS, an explainable scam verifier for Indian students.

Analyze the following message${imageBase64 ? ' (screenshot attached)' : ''}.${rulesText}

Rules:
- Return STRICT JSON only. No markdown, no explanation outside JSON.
- Do not invent evidence not present in the message.
- If the message is safe, set category to "safe" and dna present flags to false.
- Support English, Hindi, and Hinglish.
- Keep summary short and honest.

Message: "${message || ''}"

Respond with this exact JSON schema:
${JSON.stringify(schema, null, 2)}`
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            responseSchema: schema
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // If Gemini returns non-JSON, wrap it safely
      parsed = {
        extractedText: message || '',
        category: 'other',
        confidence: 40,
        summary: 'AI response could not be parsed.',
        dna: [],
        evidence: [],
        actions: []
      };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    clearTimeout(timeout);
    // Silent fallback: return rules-compatible shape
    return res.status(200).json({
      extractedText: message || '',
      category: 'other',
      confidence: 50,
      summary: 'AI analysis timed out or failed.',
      dna: [],
      evidence: [],
      actions: []
    });
  }
}