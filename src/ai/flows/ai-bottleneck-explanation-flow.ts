'use server';
/**
 * @fileOverview Provides an AI-generated explanation of PC bottlenecks and actionable recommendations.
 *
 * - aiBottleneckExplanation - A function that generates an AI explanation for a given bottleneck scenario.
 * - AiBottleneckExplanationInput - The input type for the aiBottleneckExplanation function.
 * - AiBottleneckExplanationOutput - The return type for the aiBottleneckExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBottleneckExplanationInputSchema = z.object({
  cpuName: z.string().describe('The name of the selected CPU.'),
  gpuName: z.string().describe('The name of the selected GPU.'),
  resolution: z.string().describe('The selected display resolution (e.g., "1920x1080").'),
  ramGb: z.number().describe('The amount of RAM in GB (e.g., 32).'),
  bottleneckPercentage: z
    .number()
    .describe('The calculated bottleneck percentage (e.g., 25.5).'),
  bottleneckComponent: z
    .enum(['CPU', 'GPU'])
    .describe('The component identified as the primary bottleneck (CPU or GPU).'),
  usageScenario: z
    .string()
    .describe('The user\'s primary usage scenario (e.g., "gaming", "streaming", "productivity").'),
});
export type AiBottleneckExplanationInput = z.infer<
  typeof AiBottleneckExplanationInputSchema
>;

const AiBottleneckExplanationOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A detailed explanation of the bottleneck\'s implications.'),
  recommendations: z
    .array(z.string())
    .describe('Actionable recommendations to improve performance.'),
});
export type AiBottleneckExplanationOutput = z.infer<
  typeof AiBottleneckExplanationOutputSchema
>;

export async function aiBottleneckExplanation(
  input: AiBottleneckExplanationInput
): Promise<AiBottleneckExplanationOutput> {
  return aiBottleneckExplanationFlow(input);
}

const aiBottleneckExplanationPrompt = ai.definePrompt({
  name: 'aiBottleneckExplanationPrompt',
  input: {schema: AiBottleneckExplanationInputSchema},
  output: {schema: AiBottleneckExplanationOutputSchema},
  prompt: `You are an expert PC hardware analyst. Your task is to provide a clear, personalized explanation of a PC bottleneck and offer actionable recommendations based on the user's specific components and usage.

Here are the details of the user's system and the calculated bottleneck:
- CPU: {{{cpuName}}}
- GPU: {{{gpuName}}}
- Resolution: {{{resolution}}}
- RAM: {{{ramGb}}}GB
- Bottleneck Percentage: {{{bottleneckPercentage}}}%
- Primary Bottleneck Component: {{{bottleneckComponent}}}
- User's Primary Usage Scenario: {{{usageScenario}}}

Based on this information, provide:
1. A detailed explanation of what this bottleneck means for the user's specific usage scenario ({{{usageScenario}}}). Explain the impact of a {{{bottleneckComponent}}} bottleneck at {{{bottleneckPercentage}}}% with their current setup.
2. Actionable recommendations to improve performance, considering their budget if possible (though no budget is provided, suggest cost-effective options first).

Structure your response as a JSON object with two fields:
- 'explanation': A string containing the detailed explanation.
- 'recommendations': An array of strings, where each string is an actionable recommendation.
`,
});

const aiBottleneckExplanationFlow = ai.defineFlow(
  {
    name: 'aiBottleneckExplanationFlow',
    inputSchema: AiBottleneckExplanationInputSchema,
    outputSchema: AiBottleneckExplanationOutputSchema,
  },
  async input => {
    const {output} = await aiBottleneckExplanationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate bottleneck explanation.');
    }
    return output;
  }
);
