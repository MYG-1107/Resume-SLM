import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';

// Configure Groq provider using OpenAI compatibility layer
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Set maximum duration for Vercel Serverless Functions (Hobby tier limit)
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription } = await req.json();

    // Input validation
    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Missing resumeText or jobDescription.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream generation token-by-token back to the client
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `
--- CANDIDATE RESUME ---
${resumeText}

--- TARGET JOB DESCRIPTION ---
${jobDescription}
          `.trim(),
        },
      ],
      temperature: 0.6,
    });

    // Returns Server-Sent Events (SSE) data stream
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Generation Route Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}