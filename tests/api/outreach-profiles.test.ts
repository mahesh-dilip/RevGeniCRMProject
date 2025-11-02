import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/outreach-profiles/route';
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
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Outreach Profiles API - GET /api/outreach-profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of outreach profiles for authenticated tenant', async () => {
    const mockProfiles = [
      {
        id: 'profile-1',
        tenantId: 'tenant-123',
        name: 'Default Sales Profile',
        companyOffering: 'CRM Software',
        valueProposition: 'Streamline your sales process',
        targetPainPoints: ['Manual data entry', 'Lost leads'],
        keyDifferentiators: ['AI-powered', 'Easy integration'],
        successStories: ['Increased conversion by 40%'],
        tone: 'professional',
        ctaPreference: 'Book a demo',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'profile-2',
        tenantId: 'tenant-123',
        name: 'Technical Outreach',
        companyOffering: 'API Platform',
        valueProposition: 'Build integrations faster',
        targetPainPoints: ['Complex API management'],
        keyDifferentiators: ['Developer-first'],
        successStories: ['Reduced integration time by 60%'],
        tone: 'technical',
        ctaPreference: 'Try our API',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.outreachProfile.findMany as any).mockResolvedValue(mockProfiles);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Default Sales Profile');
    expect(data[0].isDefault).toBe(true);
    expect(data[1].tone).toBe('technical');
    expect(prisma.outreachProfile.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123' },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('should order profiles with default first', async () => {
    (prisma.outreachProfile.findMany as any).mockResolvedValue([]);

    await GET();

    expect(prisma.outreachProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    (prisma.outreachProfile.findMany as any).mockRejectedValue(
      new Error('Database error')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch outreach profiles');
  });

  it('should only return profiles for authenticated tenant', async () => {
    (prisma.outreachProfile.findMany as any).mockResolvedValue([]);

    await GET();

    expect(prisma.outreachProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-123' },
      })
    );
  });
});

describe('Outreach Profiles API - POST /api/outreach-profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new outreach profile with valid data', async () => {
    const validData = {
      name: 'New Profile',
      description: 'A test profile',
      companyOffering: 'SaaS Platform',
      valueProposition: 'Increase productivity',
      targetPainPoints: ['Time waste', 'Manual processes'],
      keyDifferentiators: ['Automation', 'Analytics'],
      successStories: ['Saved 10 hours per week'],
      tone: 'casual',
      ctaPreference: 'Start free trial',
      isDefault: false,
    };

    const mockCreatedProfile = {
      id: 'profile-new',
      tenantId: 'tenant-123',
      ...validData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.outreachProfile.create as any).mockResolvedValue(mockCreatedProfile);
    (prisma.outreachProfile.updateMany as any).mockResolvedValue({ count: 0 });

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('New Profile');
    expect(data.tone).toBe('casual');
    expect(data.tenantId).toBe('tenant-123');
    expect(prisma.outreachProfile.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        name: validData.name,
        description: validData.description,
        companyOffering: validData.companyOffering,
        valueProposition: validData.valueProposition,
        targetPainPoints: validData.targetPainPoints,
        keyDifferentiators: validData.keyDifferentiators,
        successStories: validData.successStories,
        tone: validData.tone,
        ctaPreference: validData.ctaPreference,
        isDefault: false,
      },
    });
  });

  it('should return 400 if required fields are missing', async () => {
    const invalidData = {
      name: 'Test',
      // Missing: companyOffering, valueProposition, ctaPreference
    };

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should unset other defaults when isDefault is true', async () => {
    const newDefaultProfile = {
      name: 'New Default',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      isDefault: true,
    };

    (prisma.outreachProfile.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.outreachProfile.create as any).mockResolvedValue({
      id: 'profile-new-default',
      ...newDefaultProfile,
      tenantId: 'tenant-123',
    });

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(newDefaultProfile),
    });

    await POST(request);

    expect(prisma.outreachProfile.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-123',
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  });

  it('should not unset defaults when isDefault is false', async () => {
    const nonDefaultProfile = {
      name: 'Non-Default',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      isDefault: false,
    };

    (prisma.outreachProfile.create as any).mockResolvedValue({
      id: 'profile-non-default',
      ...nonDefaultProfile,
      tenantId: 'tenant-123',
    });

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(nonDefaultProfile),
    });

    await POST(request);

    expect(prisma.outreachProfile.updateMany).not.toHaveBeenCalled();
  });

  it('should use default values for optional fields', async () => {
    const minimalData = {
      name: 'Minimal Profile',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
    };

    (prisma.outreachProfile.create as any).mockResolvedValue({
      id: 'profile-minimal',
      ...minimalData,
      tenantId: 'tenant-123',
      tone: 'professional',
      targetPainPoints: [],
      keyDifferentiators: [],
      successStories: [],
      isDefault: false,
    });

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    });

    await POST(request);

    expect(prisma.outreachProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetPainPoints: [],
          keyDifferentiators: [],
          successStories: [],
          tone: 'professional',
          isDefault: false,
        }),
      })
    );
  });

  it('should handle database errors during creation', async () => {
    const validData = {
      name: 'Test Profile',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
    };

    (prisma.outreachProfile.create as any).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create outreach profile');
  });

  it('should preserve array fields when provided', async () => {
    const dataWithArrays = {
      name: 'Profile with Arrays',
      companyOffering: 'Product',
      valueProposition: 'Value',
      ctaPreference: 'CTA',
      targetPainPoints: ['Pain 1', 'Pain 2', 'Pain 3'],
      keyDifferentiators: ['Diff 1', 'Diff 2'],
      successStories: ['Story 1'],
    };

    (prisma.outreachProfile.create as any).mockResolvedValue({
      id: 'profile-arrays',
      ...dataWithArrays,
      tenantId: 'tenant-123',
    });

    const request = new NextRequest('http://localhost:3000/api/outreach-profiles', {
      method: 'POST',
      body: JSON.stringify(dataWithArrays),
    });

    await POST(request);

    expect(prisma.outreachProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetPainPoints: ['Pain 1', 'Pain 2', 'Pain 3'],
          keyDifferentiators: ['Diff 1', 'Diff 2'],
          successStories: ['Story 1'],
        }),
      })
    );
  });
});
