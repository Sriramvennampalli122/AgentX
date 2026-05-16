'use server';
/**
 * @fileOverview A function that summarizes long text into key bullet points using Groq.
 */

export interface SummarizeInput {
  text: string;
  focus: string;
}

export type SummarizeOutput = string;

export async function summarize(input: SummarizeInput): Promise<SummarizeOutput> {
  if (input.text.length < 400) {
    return `TEXT (short, no summary needed):\n${input.text}`;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'user', 
          content: `Summarize in 4 bullet points focusing on ${input.focus}:\n\n${input.text}` 
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Summary failed.';
}
