import Anthropic from '@anthropic-ai/sdk';
import { logError } from '@/lib/logging';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Type definitions
export interface UserProfile {
  id: string;
  name: string;
  companyOffering: string;
  valueProposition: string;
  targetPainPoints: string[];
  keyDifferentiators: string[];
  successStories: string[];
  tone: 'formal' | 'casual' | 'technical';
  ctaPreference: string;
}

export interface CompanyContext {
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  status?: string;
  leadScore?: number;
  sourceQuery?: string;
  size?: string;
  location?: string;
}

export interface PersonContext {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
}

export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  emailCount: number;
  emails: EmailTemplate[];
}

export interface EmailTemplate {
  stepNumber: number;
  delayDays: number;
  purpose: string;
  guidelines: string[];
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  reasoning?: string;
}

export interface GenerateSequenceParams {
  userProfile: UserProfile;
  template: SequenceTemplate;
  companyContext: CompanyContext;
  personContext?: PersonContext;
  customInstructions?: string;
}

/**
 * Assembles context for AI prompt from all data sources
 */
function assembleContext(params: GenerateSequenceParams): string {
  const { userProfile, template, companyContext, personContext, customInstructions } = params;

  let context = `# EMAIL SEQUENCE GENERATION CONTEXT

## Template Information
Template: ${template.name}
Description: ${template.description}
Number of Emails: ${template.emailCount}

## User's Business Profile
Company/Product: ${userProfile.companyOffering}
Value Proposition: ${userProfile.valueProposition}
Pain Points Addressed: ${userProfile.targetPainPoints.join(', ')}
Key Differentiators: ${userProfile.keyDifferentiators.join(', ')}
Success Stories: ${userProfile.successStories.join(' | ')}
Preferred Tone: ${userProfile.tone}
Call-to-Action Preference: ${userProfile.ctaPreference}

## Target Company Information
Company Name: ${companyContext.name}`;

  if (companyContext.industry) context += `\nIndustry: ${companyContext.industry}`;
  if (companyContext.website) context += `\nWebsite: ${companyContext.website}`;
  if (companyContext.description) context += `\nDescription: ${companyContext.description}`;
  if (companyContext.status) context += `\nLifecycle Stage: ${companyContext.status}`;
  if (companyContext.leadScore) context += `\nLead Score: ${companyContext.leadScore}`;
  if (companyContext.sourceQuery) context += `\nHow They Were Found: ${companyContext.sourceQuery}`;
  if (companyContext.size) context += `\nCompany Size: ${companyContext.size}`;
  if (companyContext.location) context += `\nLocation: ${companyContext.location}`;

  if (personContext) {
    context += `\n\n## Contact Person Information`;
    if (personContext.firstName) context += `\nFirst Name: ${personContext.firstName}`;
    if (personContext.lastName) context += `\nLast Name: ${personContext.lastName}`;
    if (personContext.title) context += `\nJob Title: ${personContext.title}`;
  }

  if (customInstructions) {
    context += `\n\n## Additional Instructions\n${customInstructions}`;
  }

  return context;
}

/**
 * Builds the system prompt for email generation
 */
function buildSystemPrompt(template: SequenceTemplate): string {
  return `You are an expert B2B email copywriter specializing in cold outreach sequences. Your goal is to generate highly personalized, effective email sequences that:

1. Feel genuinely personalized (not templated)
2. Lead with value and relevance to the recipient
3. Are concise and scannable (busy executives have limited time)
4. Build trust through specificity and expertise
5. Have clear, low-friction calls-to-action
6. Follow best practices for each email in the sequence

Template Structure:
${template.emails.map(email => `
Email ${email.stepNumber} (Day ${email.delayDays === 0 ? 'Immediate' : email.delayDays}):
Purpose: ${email.purpose}
Guidelines: ${email.guidelines.join('; ')}
`).join('\n')}

IMPORTANT RULES:
- Never use placeholder text like [Company Name] or {{variable}} - use actual data provided
- Keep subject lines under 60 characters
- Email body should be 150-250 words maximum
- Use specific details about the company, not generic statements
- Maintain the requested tone throughout
- Each email should have a single, clear call-to-action
- Emails should feel like they're from a human, not a marketing automation tool
- Reference the company's industry, challenges, or context naturally
- Don't oversell - focus on starting a conversation

Your output MUST be valid JSON only, with no additional text before or after.`;
}

/**
 * Builds the user prompt for a specific email in the sequence
 */
function buildEmailPrompt(
  emailTemplate: EmailTemplate,
  context: string,
  emailNumber: number,
  totalEmails: number
): string {
  return `${context}

## Your Task
Generate Email ${emailNumber} of ${totalEmails} for this sequence.

Email Details:
- Step Number: ${emailTemplate.stepNumber}
- Timing: ${emailTemplate.delayDays === 0 ? 'Immediate upon enrollment' : `${emailTemplate.delayDays} days after previous email`}
- Purpose: ${emailTemplate.purpose}
- Guidelines: ${emailTemplate.guidelines.join('; ')}

Generate a highly personalized email that:
1. Uses the company and person information provided (never use placeholders)
2. Matches the user's business profile and tone preference
3. Follows the template purpose and guidelines
4. Feels authentic and human-written
5. Is specific to this company's industry and context

Return your response as a JSON object with this exact structure:
{
  "subject": "The email subject line (under 60 chars)",
  "body": "The complete email body text (150-250 words, use \\n for line breaks)",
  "reasoning": "Brief explanation of your personalization strategy (2-3 sentences)"
}`;
}

/**
 * Generates a complete email sequence using Claude
 */
export async function generateEmailSequence(
  params: GenerateSequenceParams
): Promise<GeneratedEmail[]> {
  try {
    const { template } = params;
    const context = assembleContext(params);
    const systemPrompt = buildSystemPrompt(template);

    const generatedEmails: GeneratedEmail[] = [];

    // Generate each email in the sequence
    for (let i = 0; i < template.emails.length; i++) {
      const emailTemplate = template.emails[i];
      const userPrompt = buildEmailPrompt(
        emailTemplate,
        context,
        i + 1,
        template.emails.length
      );

      console.log(`Generating email ${i + 1} of ${template.emails.length}...`);

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract the text content from Claude's response
      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      // Parse the JSON response
      let emailData: GeneratedEmail;
      try {
        // Remove markdown code blocks if present
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
        }

        emailData = JSON.parse(jsonText);
      } catch (parseError) {
        logError('Failed to parse Claude response as JSON:', parseError);
        logError('Response text:', textContent.text);
        throw new Error('Failed to parse AI response');
      }

      // Convert newlines to HTML paragraphs for proper Blocknote formatting
      if (emailData.body) {
        emailData.body = convertNewlinesToHTML(emailData.body);
      }

      generatedEmails.push(emailData);
    }

    return generatedEmails;
  } catch (error) {
    logError('Error generating email sequence:', error);
    throw error;
  }
}

/**
 * Converts plain text with newlines to proper HTML paragraphs
 * This ensures Blocknote displays the text with proper paragraph breaks
 */
function convertNewlinesToHTML(text: string): string {
  // Split by double newlines (paragraph breaks) or single newlines
  const paragraphs = text
    .split(/\n\n+/)  // Split by double newlines first
    .map(para => para.trim())
    .filter(para => para.length > 0);

  // If we got paragraphs from double newlines, use those
  if (paragraphs.length > 1) {
    return paragraphs.map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('\n');
  }

  // Otherwise, treat single newlines as paragraph breaks
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map(line => `<p>${line}</p>`).join('\n');
}

/**
 * Generates a single personalized email for a specific step
 */
export async function generateSingleEmail(
  params: GenerateSequenceParams,
  stepNumber: number
): Promise<GeneratedEmail> {
  try {
    const { template } = params;
    const emailTemplate = template.emails.find(e => e.stepNumber === stepNumber);

    if (!emailTemplate) {
      throw new Error(`Email template not found for step ${stepNumber}`);
    }

    const context = assembleContext(params);
    const systemPrompt = buildSystemPrompt(template);
    const userPrompt = buildEmailPrompt(
      emailTemplate,
      context,
      stepNumber,
      template.emails.length
    );

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    logError('Error generating single email:', error);
    throw error;
  }
}

/**
 * Test function to verify AI service is working
 */
export async function testAIService(): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Reply with just "OK" if you can read this.',
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent?.type === 'text' && textContent.text.includes('OK');
  } catch (error) {
    logError('AI service test failed:', error);
    return false;
  }
}
