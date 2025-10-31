import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logError } from '@/lib/logging';

// ============================================
// TYPES
// ============================================

export interface CompanyWebsetParams {
  industry: string;
  geography: string;
  size?: string;
  additionalContext?: string;
  maxResults?: number;
}

export interface PeopleWebsetParams {
  companyNames?: string[];
  jobTitles?: string[];
  seniority?: string[];
  location?: string;
  industries?: string[];
  maxResults?: number;
}

export interface WebsetResponse {
  success: boolean;
  webset: {
    id: string;
    exaId: string;
    type: string;
    status: string;
    query: string;
    createdAt: string;
  };
}

export interface WebsetStatus {
  id: string;
  exaId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultCount: number;
  completedAt?: string;
  createdAt: string;
}

export interface WebsetResults {
  success: boolean;
  count: number;
  companies?: any[];
  people?: any[];
  skippedDuplicates?: number;
  skippedNoLinkedIn?: number;
  totalResults?: number;
  alreadyImported?: boolean;
}

// ============================================
// COMPANY WEBSETS
// ============================================

/**
 * Hook to create a company discovery webset
 * Uses React Query mutation for optimistic updates and error handling
 */
export function useCreateCompanyWebset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CompanyWebsetParams) => {
      const response = await fetch('/api/websets/companies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create company webset');
      }

      return response.json() as Promise<WebsetResponse>;
    },
    onSuccess: () => {
      // Invalidate any webset list queries
      queryClient.invalidateQueries({ queryKey: ['websets'] });
    },
    onError: (error) => {
      logError('Failed to create company webset', error);
    },
  });
}

/**
 * Hook to check company webset status
 * Includes automatic polling while webset is processing
 */
export function useCompanyWebsetStatus(
  websetId: string | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  return useQuery({
    queryKey: ['websets', 'companies', websetId, 'status'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/companies/${websetId}/status`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset status');
      }

      return response.json() as Promise<WebsetStatus>;
    },
    enabled: !!websetId && (options?.enabled !== false),
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const status = query?.state?.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      // Poll every 5 seconds while processing
      return options?.refetchInterval !== undefined ? options.refetchInterval : 5000;
    },
    retry: 3,
  });
}

/**
 * Hook to fetch company webset results
 * Only call this after webset status is 'completed'
 */
export function useCompanyWebsetResults(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['websets', 'companies', websetId, 'results'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/companies/${websetId}/results`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset results');
      }

      return response.json() as Promise<WebsetResults>;
    },
    enabled: !!websetId && enabled,
    retry: 1,
    staleTime: Infinity, // Results don't change once fetched
  });
}

/**
 * Hook to fetch company webset preview (without importing)
 * Use this to show results for user review before importing
 */
export function useCompanyWebsetPreview(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['websets', 'companies', websetId, 'preview'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/companies/${websetId}/preview`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset preview');
      }

      return response.json() as Promise<WebsetResults>;
    },
    enabled: !!websetId && enabled,
    retry: 1,
    staleTime: Infinity, // Preview results don't change once fetched
  });
}

/**
 * Hook to import selected companies from webset
 * Call this after user has reviewed and selected companies
 */
export function useCompanyWebsetImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ websetId, selectedIds }: { websetId: string; selectedIds: string[] }) => {
      const response = await fetch(`/api/websets/companies/${websetId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import selected companies');
      }

      return response.json() as Promise<WebsetResults>;
    },
    onSuccess: () => {
      // Invalidate companies list to show newly imported companies
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['websets'] });
    },
    onError: (error) => {
      logError('Failed to import selected companies', error);
    },
  });
}

// ============================================
// PEOPLE WEBSETS
// ============================================

/**
 * Hook to create a people/contact discovery webset
 * Uses React Query mutation for optimistic updates and error handling
 */
export function useCreatePeopleWebset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: PeopleWebsetParams) => {
      const response = await fetch('/api/websets/people/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create people webset');
      }

      return response.json() as Promise<WebsetResponse>;
    },
    onSuccess: () => {
      // Invalidate any webset list queries
      queryClient.invalidateQueries({ queryKey: ['websets'] });
    },
    onError: (error) => {
      logError('Failed to create people webset', error);
    },
  });
}

/**
 * Hook to check people webset status
 * Includes automatic polling while webset is processing
 */
export function usePeopleWebsetStatus(
  websetId: string | null,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  }
) {
  return useQuery({
    queryKey: ['websets', 'people', websetId, 'status'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/people/${websetId}/status`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset status');
      }

      return response.json() as Promise<WebsetStatus>;
    },
    enabled: !!websetId && (options?.enabled !== false),
    refetchInterval: (query) => {
      // Stop polling when completed or failed
      const status = query?.state?.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      // Poll every 5 seconds while processing
      return options?.refetchInterval !== undefined ? options.refetchInterval : 5000;
    },
    retry: 3,
  });
}

/**
 * Hook to fetch people webset results
 * Only call this after webset status is 'completed'
 */
export function usePeopleWebsetResults(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['websets', 'people', websetId, 'results'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/people/${websetId}/results`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset results');
      }

      return response.json() as Promise<WebsetResults>;
    },
    enabled: !!websetId && enabled,
    retry: 1,
    staleTime: Infinity, // Results don't change once fetched
  });
}

/**
 * Hook to fetch people webset preview (without importing)
 * Use this to show results for user review before importing
 */
export function usePeopleWebsetPreview(websetId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['websets', 'people', websetId, 'preview'],
    queryFn: async () => {
      if (!websetId) throw new Error('Webset ID is required');

      const response = await fetch(`/api/websets/people/${websetId}/preview`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch webset preview');
      }

      return response.json() as Promise<WebsetResults>;
    },
    enabled: !!websetId && enabled,
    retry: 1,
    staleTime: Infinity, // Preview results don't change once fetched
  });
}

/**
 * Hook to import selected people from webset
 * Call this after user has reviewed and selected people
 */
export function usePeopleWebsetImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ websetId, selectedIds }: { websetId: string; selectedIds: string[] }) => {
      const response = await fetch(`/api/websets/people/${websetId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import selected people');
      }

      return response.json() as Promise<WebsetResults>;
    },
    onSuccess: () => {
      // Invalidate contacts list to show newly imported people
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['websets'] });
    },
    onError: (error) => {
      logError('Failed to import selected people', error);
    },
  });
}

// ============================================
// CONVENIENCE HOOKS
// ============================================

/**
 * Combined hook for managing the complete company webset workflow
 * Handles creation, status polling, and results fetching
 */
export function useCompanyWebsetWorkflow() {
  const createMutation = useCreateCompanyWebset();

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createdWebset: createMutation.data,
    createError: createMutation.error,
    reset: createMutation.reset,
  };
}

/**
 * Combined hook for managing the complete people webset workflow
 * Handles creation, status polling, and results fetching
 */
export function usePeopleWebsetWorkflow() {
  const createMutation = useCreatePeopleWebset();

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createdWebset: createMutation.data,
    createError: createMutation.error,
    reset: createMutation.reset,
  };
}
