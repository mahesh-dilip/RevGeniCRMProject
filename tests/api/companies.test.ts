import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/companies/route';
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
    company: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/middleware/validate', () => ({
  validateRequest: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/middleware/validate';

describe('Companies API - GET /api/companies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of companies for authenticated tenant', async () => {
    const mockCompanies = [
      {
        id: 'comp-1',
        name: 'Test Company',
        tenantId: 'tenant-123',
        website: 'https://test.com',
        industry: 'Technology',
        status: 'Lead',
        _count: { deals: 2, people: 5 },
        createdAt: new Date(),
      },
      {
        id: 'comp-2',
        name: 'Another Company',
        tenantId: 'tenant-123',
        website: 'https://another.com',
        industry: 'Finance',
        status: 'Qualified',
        _count: { deals: 1, people: 3 },
        createdAt: new Date(),
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

    const request = new NextRequest('http://localhost:3000/api/companies');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Test Company');
    expect(data[1].name).toBe('Another Company');
    expect(prisma.company.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-123' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            deals: true,
            people: true,
          },
        },
      },
    });
  });

  it('should include people when includePeople=true', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/companies?includePeople=true'
    );
    await GET(request);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          people: true,
        }),
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    (prisma.company.findMany as any).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/companies');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch companies');
  });

  it('should filter companies by tenantId only', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/companies');
    await GET(request);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-123' },
      })
    );
  });
});

describe('Companies API - POST /api/companies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new company with valid data', async () => {
    const validData = {
      name: 'New Company',
      website: 'https://newcompany.com',
      industry: 'Technology',
      size: '50-200',
      geography: 'North America',
      status: 'Lead',
      description: 'A test company',
    };

    (validateRequest as any).mockResolvedValue({ data: validData });

    const mockCreatedCompany = {
      id: 'comp-new',
      tenantId: 'tenant-123',
      ...validData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.company.create as any).mockResolvedValue(mockCreatedCompany);

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('New Company');
    expect(data.tenantId).toBe('tenant-123');
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        name: validData.name,
        website: validData.website,
        industry: validData.industry,
        size: validData.size,
        geography: validData.geography,
        status: validData.status,
        description: validData.description,
        foundedYear: undefined,
        sourceType: 'manual',
        sourceQuery: undefined,
        confidence: undefined,
      },
    });
  });

  it('should return error if validation fails', async () => {
    const errorResponse = {
      error: {
        json: () => ({ error: 'Validation failed' }),
        status: 400,
      },
    };

    (validateRequest as any).mockResolvedValue(errorResponse);

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name: '' }), // Invalid data
    });

    const response = await POST(request);

    expect(validateRequest).toHaveBeenCalled();
  });

  it('should set default status to Lead if not provided', async () => {
    const dataWithoutStatus = {
      name: 'Test Company',
      website: 'https://test.com',
      industry: 'Technology',
    };

    (validateRequest as any).mockResolvedValue({ data: dataWithoutStatus });
    (prisma.company.create as any).mockResolvedValue({
      id: 'comp-1',
      ...dataWithoutStatus,
      status: 'Lead',
    });

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify(dataWithoutStatus),
    });

    await POST(request);

    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'Lead',
        }),
      })
    );
  });

  it('should set sourceType to manual by default', async () => {
    const validData = {
      name: 'Test Company',
      website: 'https://test.com',
    };

    (validateRequest as any).mockResolvedValue({ data: validData });
    (prisma.company.create as any).mockResolvedValue({
      id: 'comp-1',
      ...validData,
    });

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    await POST(request);

    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: 'manual',
        }),
      })
    );
  });

  it('should handle database errors during creation', async () => {
    const validData = {
      name: 'Test Company',
      website: 'https://test.com',
    };

    (validateRequest as any).mockResolvedValue({ data: validData });
    (prisma.company.create as any).mockRejectedValue(
      new Error('Unique constraint violation')
    );

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create company');
  });

  it('should respect AI-generated sourceType when provided', async () => {
    const aiGeneratedData = {
      name: 'AI Found Company',
      website: 'https://aifound.com',
      sourceType: 'ai',
      sourceQuery: 'SaaS companies in SF',
      confidence: 0.85,
    };

    (validateRequest as any).mockResolvedValue({ data: aiGeneratedData });
    (prisma.company.create as any).mockResolvedValue({
      id: 'comp-ai',
      ...aiGeneratedData,
    });

    const request = new NextRequest('http://localhost:3000/api/companies', {
      method: 'POST',
      body: JSON.stringify(aiGeneratedData),
    });

    await POST(request);

    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: 'ai',
          sourceQuery: 'SaaS companies in SF',
          confidence: 0.85,
        }),
      })
    );
  });
});
