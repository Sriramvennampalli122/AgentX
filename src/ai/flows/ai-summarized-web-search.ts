'use server';
/**
 * @fileOverview A Genkit flow that summarizes long text into key bullet points.
 *
 * - summarize - A function that handles the text summarization process.
 * - SummarizeInput - The input type for the summarize function.
 * - SummarizeOutput - The return type for the summarize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInputSchema = z.object({
  text: z.string().describe('Text to summarize'),
  focus: z.string().describe('What aspect to focus on'),
});
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

const SummarizeOutputSchema = z.string().describe('The summarized text in bullet points, or the original text if too short.');
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;

export async function summarize(input: SummarizeInput): Promise<SummarizeOutput> {
  return summarizeFlow(input);
}

const summarizePrompt = ai.definePrompt({
  name: 'summarizePrompt',
  input: {schema: SummarizeInputSchema},
  output: {schema: SummarizeOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `Summarize in 4 bullet points focusing on {{{focus}}}:
{{{text}}}`, // Using Handlebars for input variables
});

const summarizeFlow = ai.defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async (input) => {
    if (input.text.length < 400) {
      return `TEXT (short, no summary needed):
${input.text}`;
    }
    const {output} = await summarizePrompt(input);
    return output!;
  }
);
