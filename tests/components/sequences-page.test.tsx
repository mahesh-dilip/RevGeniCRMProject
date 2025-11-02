import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SequencesPage from '@/app/sequences/page';

// Mock fetch
global.fetch = vi.fn();

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('SequencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SequencesPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display sequences when data is loaded', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Cold Outreach',
        description: 'Initial contact sequence',
        active: true,
        steps: [{ id: '1' }, { id: '2' }, { id: '3' }],
        _count: { enrollments: 5 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
      {
        id: 'seq-2',
        name: 'Follow-up',
        description: 'Demo follow-up',
        active: false,
        steps: [{ id: '1' }, { id: '2' }],
        _count: { enrollments: 3 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: true,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cold Outreach')).toBeInTheDocument();
    });

    expect(screen.getByText('Follow-up')).toBeInTheDocument();
    expect(screen.getByText('2 sequences • 8 total enrollments')).toBeInTheDocument();
  });

  it('should display stats cards correctly', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Test Sequence 1',
        active: true,
        steps: [{ id: '1' }],
        _count: { enrollments: 10 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
      {
        id: 'seq-2',
        name: 'Test Sequence 2',
        active: true,
        steps: [{ id: '1' }],
        _count: { enrollments: 15 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
      {
        id: 'seq-3',
        name: 'Test Sequence 3',
        active: false,
        steps: [{ id: '1' }],
        _count: { enrollments: 5 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Total sequences
      expect(screen.getByText('3')).toBeInTheDocument();
      // Active sequences (2)
      expect(screen.getByText('2')).toBeInTheDocument();
      // Total enrollments (30)
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('should show active badge for active sequences', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Active Sequence',
        active: true,
        steps: [],
        _count: { enrollments: 0 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
    });
  });

  it('should show inactive badge for inactive sequences', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Inactive Sequence',
        active: false,
        steps: [],
        _count: { enrollments: 0 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('should display empty state when no sequences exist', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No email sequences yet.')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Create automated email sequences to nurture leads and follow up with prospects.'
        )
      ).toBeInTheDocument();
    });
  });

  it('should show step count for each sequence', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Multi-step Sequence',
        active: true,
        steps: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
        _count: { enrollments: 0 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('should show automation settings indicators', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Auto Pause Sequence',
        active: true,
        steps: [],
        _count: { enrollments: 0 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: true,
        pauseOnDealStages: ['proposal'],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('⏸️ Pause on deal')).toBeInTheDocument();
      expect(screen.getByText('⏸️ Stage pauses')).toBeInTheDocument();
    });
  });

  it('should show "No automation" when no automation settings', async () => {
    const mockSequences = [
      {
        id: 'seq-1',
        name: 'Manual Sequence',
        active: true,
        steps: [],
        _count: { enrollments: 0 },
        createdAt: new Date().toISOString(),
        pauseOnDealCreation: false,
        pauseOnDealStages: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSequences,
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No automation')).toBeInTheDocument();
    });
  });

  it('should have Create with AI and Create Manually buttons', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<SequencesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('🤖 Create with AI')).toBeInTheDocument();
      expect(screen.getByText('+ Create Manually')).toBeInTheDocument();
    });
  });
});
