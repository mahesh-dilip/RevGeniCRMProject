'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useCompanyWebsetWorkflow,
  useCompanyWebsetStatus,
  useCompanyWebsetResults,
} from '@/lib/hooks/use-websets';

type Step = 'search' | 'processing' | 'results';

export default function AILeadFinderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('search');
  const [websetId, setWebsetId] = useState<string | null>(null);

  const [criteria, setCriteria] = useState({
    industry: '',
    geography: '',
    size: '',
    additionalContext: '',
    maxResults: 10,
  });

  // React Query hooks
  const { create, isCreating, createdWebset, createError } =
    useCompanyWebsetWorkflow();

  const {
    data: statusData,
    isLoading: isCheckingStatus,
    error: statusError,
  } = useCompanyWebsetStatus(websetId, {
    enabled: step === 'processing',
  });

  const {
    data: resultsData,
    isLoading: isLoadingResults,
    error: resultsError,
  } = useCompanyWebsetResults(
    websetId,
    statusData?.status === 'completed' // Fetch when completed, regardless of step
  );

  // Handle webset creation
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    create(criteria, {
      onSuccess: (response) => {
        setWebsetId(response.webset.id);
        setStep('processing');
        toast.success('Company discovery webset created! Searching for leads...');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create webset');
      },
    });
  };

  // Auto-advance to results step when webset is completed AND results data is available
  useEffect(() => {
    if (statusData?.status === 'failed') {
      toast.error('Webset processing failed. Please try again.');
      setStep('search');
    } else if (
      statusData?.status === 'completed' &&
      step === 'processing' &&
      resultsData &&
      !isLoadingResults
    ) {
      setStep('results');
      toast.success('Company discovery completed!');
    }
  }, [statusData?.status, step, resultsData, isLoadingResults]);

  // Show error messages
  useEffect(() => {
    if (createError) {
      toast.error(createError.message || 'Failed to create webset');
    }
    if (statusError) {
      toast.error('Failed to check webset status');
    }
    if (resultsError) {
      toast.error('Failed to fetch results');
    }
  }, [createError, statusError, resultsError]);

  const handleBackToSearch = () => {
    setStep('search');
    setWebsetId(null);
  };

  const handleViewCompanies = () => {
    router.push('/companies');
  };

  // Processing step - show status and polling
  if (step === 'processing') {
    const status = statusData?.status || 'pending';
    const statusLabel = {
      pending: 'Initializing...',
      processing: 'Searching the web for companies...',
      completed: 'Discovery complete!',
      failed: 'Search failed',
    }[status] || 'Processing...';

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🤖 AI Lead Finder</h1>
          <p className="text-gray-600 mt-1">Discovering companies matching your criteria</p>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">{statusLabel}</h2>
              <p className="text-gray-600">
                This may take a few minutes. We're searching the web for companies that match your
                ideal customer profile.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={status === 'processing' ? 'secondary' : 'default'}>
                  {status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Industry:</span>
                <span className="font-medium">{criteria.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Geography:</span>
                <span className="font-medium">{criteria.geography}</span>
              </div>
              {criteria.size && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{criteria.size}</span>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={handleBackToSearch}>
              Cancel & Start Over
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-sm mb-2">💡 What's happening:</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Our AI is searching the web for companies matching your criteria</li>
            <li>Enriching company data with details like employee count, website, etc.</li>
            <li>Checking for duplicates against your existing CRM data</li>
            <li>Results will be automatically imported when ready</li>
          </ul>
        </Card>
      </div>
    );
  }

  // Results step - show discovered companies
  if (step === 'results') {
    // Show loading state if results aren't ready yet
    if (isLoadingResults || !resultsData) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">⏳ Loading Results...</h1>
              <p className="text-gray-600">Fetching and importing companies...</p>
            </div>
          </div>
          <Card className="p-8 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Processing discovered companies...</p>
          </Card>
        </div>
      );
    }

    const companies = resultsData.companies || [];
    const skipped = resultsData.skippedDuplicates || 0;
    const total = resultsData.totalResults || 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">✅ Discovery Complete!</h1>
            <p className="text-gray-600">
              Found {companies.length} companies and added them to your CRM
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToSearch}>
            ← New Search
          </Button>
        </div>

        {skipped > 0 && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm">
              ⚠️ Skipped {skipped} duplicate {skipped === 1 ? 'company' : 'companies'} that
              already exist in your CRM
            </p>
          </Card>
        )}

        {companies.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              No new companies were found. All discovered companies were already in your CRM.
            </p>
            <Button onClick={handleBackToSearch}>Try Different Criteria</Button>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={handleViewCompanies}>
                View All Companies →
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {companies.map((company: any, index: number) => (
                <Card key={company.id || index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      {company.description && (
                        <p className="text-sm text-gray-600 mt-1">{company.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {company.industry && <span>🏭 {company.industry}</span>}
                        {company.geography && <span>📍 {company.geography}</span>}
                        {company.size && <span>👥 {company.size}</span>}
                        {company.foundedYear && <span>📅 Founded {company.foundedYear}</span>}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            🔗 {company.website}
                          </a>
                        )}
                      </div>
                    </div>

                    <Badge variant="success" className="ml-4">
                      {Math.round((company.confidence || 0.85) * 100)}% match
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleViewCompanies} size="lg">
                View All Companies in CRM →
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Search step - initial form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🤖 AI Lead Finder</h1>
        <p className="text-gray-600 mt-1">
          Use AI to discover companies matching your ideal customer profile
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              placeholder="e.g., SaaS, Fintech, Healthcare, E-commerce"
              value={criteria.industry}
              onChange={(e) => setCriteria({ ...criteria, industry: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">The industry or sector you want to target</p>
          </div>

          <div>
            <Label htmlFor="geography">Geography *</Label>
            <Input
              id="geography"
              placeholder="e.g., London, UK or San Francisco, USA"
              value={criteria.geography}
              onChange={(e) => setCriteria({ ...criteria, geography: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              City, region, or country where companies are located
            </p>
          </div>

          <div>
            <Label htmlFor="size">Company Size</Label>
            <Input
              id="size"
              placeholder="e.g., 50-200 employees or 10-50 employees"
              value={criteria.size}
              onChange={(e) => setCriteria({ ...criteria, size: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of employees or company size range (optional)
            </p>
          </div>

          <div>
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="e.g., B2B focused, venture-backed, recently funded, using Salesforce..."
              value={criteria.additionalContext}
              onChange={(e) => setCriteria({ ...criteria, additionalContext: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Any additional criteria to refine your search (tech stack, funding status, etc.)
            </p>
          </div>

          <div>
            <Label htmlFor="maxResults">Maximum Results</Label>
            <Input
              id="maxResults"
              type="number"
              min="1"
              max="100"
              value={criteria.maxResults}
              onChange={(e) =>
                setCriteria({ ...criteria, maxResults: parseInt(e.target.value) })
              }
            />
            <p className="text-xs text-gray-500 mt-1">How many leads to generate (1-100)</p>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full" size="lg">
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Creating webset...
              </>
            ) : (
              <>🔍 Find Leads with AI</>
            )}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm mb-2">💡 How it works:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>AI searches the web for companies matching your criteria</li>
          <li>Company data is automatically enriched with details</li>
          <li>Results are imported directly into your CRM</li>
          <li>Duplicate companies are automatically detected and skipped</li>
        </ol>
      </Card>

      <Card className="p-4 bg-green-50 border-green-200">
        <h3 className="font-semibold text-sm mb-2">✨ New: Powered by Exa Websets</h3>
        <p className="text-sm text-gray-700">
          This feature now uses Exa's advanced web discovery technology for more accurate and
          comprehensive company data, including enriched details like employee count, founding year,
          and more.
        </p>
      </Card>
    </div>
  );
}
