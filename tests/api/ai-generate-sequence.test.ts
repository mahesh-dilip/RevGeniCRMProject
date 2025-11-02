import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/generate-sequence/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/context', () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    userId: 'user-123',
    tenantId: 'tenant-123',
    clerkId: 'clerk-123',
    role: 'USER',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    outreachProfile: {
      findFirst: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
    },
    person: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/constants/sequence-templates', () => ({
  getTemplateById: vi.fn(),
}));

vi.mock('@/lib/ai/sequence-generator', () => ({
  generateEmailSequence: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getTemplateById } from '@/lib/constants/sequence-templates';
import { generateEmailSequence } from '@/lib/ai/sequence-generator';

describe('AI Generate Sequence API - POST /api/ai/generate-sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate email sequence with valid inputs', async () => {
    const mockTemplate = {
      id: 'cold-outreach-3',
      name: 'Cold Outreach',
      description: 'Initial contact sequence',
      emailCount: 3,
      emails: [
        {
          stepNumber: 1,
          delayDays: 0,
          purpose: 'Initial contact',
          guidelines: ['Lead with value'],
        },
        {
          stepNumber: 2,
          delayDays: 3,
          purpose: 'Follow-up',
          guidelines: ['Reference previous email'],
        },
        {
          stepNumber: 3,
          delayDays: 7,
          purpose: 'Final touchpoint',
          guidelines: ['Create urgency'],
        },
      ],
    };

    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      name: 'Sales Profile',
      companyOffering: 'CRM Software',
      valueProposition: 'Streamline sales',
      targetPainPoints: ['Manual data entry', 'Lost leads'],
      keyDifferentiators: ['AI-powered', 'Easy integration'],
      successStories: ['Increased conversion by 40%'],
      tone: 'professional',
      ctaPreference: 'Book a demo',
    };

    const mockCompany = {
      id: 'company-1',
      tenantId: 'tenant-123',
      name: 'Acme Corp',
      industry: 'Technology',
      website: 'https://acme.com',
      description: 'A leading tech company',
      status: 'Lead',
      leadScore: 75,
      size: '50-200',
      geography: 'North America',
    };

    const mockPerson = {
      id: 'person-1',
      tenantId: 'tenant-123',
      companyId: 'company-1',
      firstName: 'John',
      lastName: 'Doe',
      title: 'VP of Sales',
      email: 'john@acme.com',
    };

    const mockGeneratedEmails = [
      {
        subject: 'Streamline your sales process at Acme Corp',
        body: 'Hi John,\n\nI noticed Acme Corp...',
        reasoning: 'Personalized based on company industry',
      },
      {
        subject: 'Following up on CRM efficiency',
        body: 'Hi John,\n\nI wanted to follow up...',
        reasoning: 'Referenced initial contact',
      },
      {
        subject: 'Last chance to transform your sales',
        body: 'Hi John,\n\nThis is my final...',
        reasoning: 'Created urgency',
      },
    ];

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(mockCompany);
    (prisma.person.findFirst as any).mockResolvedValue(mockPerson);
    (generateEmailSequence as any).mockResolvedValue(mockGeneratedEmails);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'company-1',
      personId: 'person-1',
      customInstructions: 'Focus on AI capabilities',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.emails).toHaveLength(3);
    expect(data.emails[0].subject).toContain('Acme Corp');
    expect(data.metadata.template.name).toBe('Cold Outreach');
    expect(data.metadata.company.name).toBe('Acme Corp');
    expect(data.metadata.person.name).toBe('John Doe');

    expect(generateEmailSequence).toHaveBeenCalledWith(
      expect.objectContaining({
        userProfile: expect.objectContaining({
          companyOffering: 'CRM Software',
          tone: 'professional',
        }),
        template: mockTemplate,
        companyContext: expect.objectContaining({
          name: 'Acme Corp',
          industry: 'Technology',
        }),
        personContext: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          title: 'VP of Sales',
        }),
        customInstructions: 'Focus on AI capabilities',
      })
    );
  });

  it('should return 400 if required fields are missing', async () => {
    const invalidBody = {
      templateId: 'cold-outreach-3',
      // Missing profileId and companyId
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should return 404 if template not found', async () => {
    (getTemplateById as any).mockReturnValue(null);

    const requestBody = {
      templateId: 'nonexistent-template',
      profileId: 'profile-1',
      companyId: 'company-1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Template not found');
  });

  it('should return 404 if profile not found', async () => {
    const mockTemplate = {
      id: 'cold-outreach-3',
      name: 'Cold Outreach',
      emails: [],
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(null);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'nonexistent-profile',
      companyId: 'company-1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Outreach profile not found');
  });

  it('should return 404 if company not found', async () => {
    const mockTemplate = { id: 'cold-outreach-3', emails: [] };
    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      name: 'Profile',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      targetPainPoints: [],
      keyDifferentiators: [],
      successStories: [],
      tone: 'professional',
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(null);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'nonexistent-company',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Company not found');
  });

  it('should work without personId and fetch first person', async () => {
    const mockTemplate = { id: 'cold-outreach-3', emails: [] };
    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      targetPainPoints: [],
      keyDifferentiators: [],
      successStories: [],
      tone: 'professional',
    };
    const mockCompany = {
      id: 'company-1',
      tenantId: 'tenant-123',
      name: 'Company',
      status: 'Lead',
    };
    const mockPerson = {
      id: 'person-1',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(mockCompany);
    (prisma.person.findFirst as any).mockResolvedValue(mockPerson);
    (generateEmailSequence as any).mockResolvedValue([]);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'company-1',
      // No personId provided
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.person.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        tenantId: 'tenant-123',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  });

  it('should work without any person', async () => {
    const mockTemplate = { id: 'cold-outreach-3', emails: [] };
    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      targetPainPoints: [],
      keyDifferentiators: [],
      successStories: [],
      tone: 'professional',
    };
    const mockCompany = {
      id: 'company-1',
      tenantId: 'tenant-123',
      name: 'Company',
      status: 'Lead',
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(mockCompany);
    (prisma.person.findFirst as any).mockResolvedValue(null);
    (generateEmailSequence as any).mockResolvedValue([]);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'company-1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.person).toBeNull();
    expect(generateEmailSequence).toHaveBeenCalledWith(
      expect.objectContaining({
        personContext: undefined,
      })
    );
  });

  it('should handle AI generation errors gracefully', async () => {
    const mockTemplate = { id: 'cold-outreach-3', emails: [] };
    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      targetPainPoints: [],
      keyDifferentiators: [],
      successStories: [],
      tone: 'professional',
    };
    const mockCompany = {
      id: 'company-1',
      tenantId: 'tenant-123',
      name: 'Company',
      status: 'Lead',
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(mockCompany);
    (prisma.person.findFirst as any).mockResolvedValue(null);
    (generateEmailSequence as any).mockRejectedValue(
      new Error('Anthropic API rate limit exceeded')
    );

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'company-1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate email sequence');
    expect(data.details).toContain('Anthropic API rate limit exceeded');
  });

  it('should properly format array fields from Prisma Json types', async () => {
    const mockTemplate = { id: 'cold-outreach-3', emails: [] };
    const mockProfile = {
      id: 'profile-1',
      tenantId: 'tenant-123',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      // Simulating Prisma Json types
      targetPainPoints: ['Pain 1', 'Pain 2'],
      keyDifferentiators: ['Diff 1'],
      successStories: ['Story 1', 'Story 2', 'Story 3'],
      tone: 'casual',
    };
    const mockCompany = {
      id: 'company-1',
      tenantId: 'tenant-123',
      name: 'Company',
      status: 'Lead',
    };

    (getTemplateById as any).mockReturnValue(mockTemplate);
    (prisma.outreachProfile.findFirst as any).mockResolvedValue(mockProfile);
    (prisma.company.findFirst as any).mockResolvedValue(mockCompany);
    (prisma.person.findFirst as any).mockResolvedValue(null);
    (generateEmailSequence as any).mockResolvedValue([]);

    const requestBody = {
      templateId: 'cold-outreach-3',
      profileId: 'profile-1',
      companyId: 'company-1',
    };

    const request = new NextRequest(
      'http://localhost:3000/api/ai/generate-sequence',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    await POST(request);

    expect(generateEmailSequence).toHaveBeenCalledWith(
      expect.objectContaining({
        userProfile: expect.objectContaining({
          targetPainPoints: ['Pain 1', 'Pain 2'],
          keyDifferentiators: ['Diff 1'],
          successStories: ['Story 1', 'Story 2', 'Story 3'],
          tone: 'casual',
        }),
      })
    );
  });
});
