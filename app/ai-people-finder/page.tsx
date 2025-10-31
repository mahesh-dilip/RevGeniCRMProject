'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  usePeopleWebsetWorkflow,
  usePeopleWebsetStatus,
  usePeopleWebsetResults,
} from '@/lib/hooks/use-websets';

type Step = 'search' | 'processing' | 'results';

export default function AIPeopleFinderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('search');
  const [websetId, setWebsetId] = useState<string | null>(null);

  const [criteria, setCriteria] = useState({
    companyNames: [''],
    jobTitles: [''],
    seniority: [''],
    location: '',
    industries: [''],
    maxResults: 10,
  });

  // React Query hooks
  const { create, isCreating, createdWebset, createError } =
    usePeopleWebsetWorkflow();

  const {
    data: statusData,
    isLoading: isCheckingStatus,
    error: statusError,
  } = usePeopleWebsetStatus(websetId, {
    enabled: step === 'processing',
  });

  const {
    data: resultsData,
    isLoading: isLoadingResults,
    error: resultsError,
  } = usePeopleWebsetResults(
    websetId,
    step === 'results' && statusData?.status === 'completed'
  );

  // Helper functions for array inputs
  const handleArrayInput = (field: 'companyNames' | 'jobTitles' | 'seniority' | 'industries', index: number, value: string) => {
    const newArray = [...criteria[field]];
    newArray[index] = value;
    setCriteria({ ...criteria, [field]: newArray });
  };

  const addArrayItem = (field: 'companyNames' | 'jobTitles' | 'seniority' | 'industries') => {
    setCriteria({ ...criteria, [field]: [...criteria[field], ''] });
  };

  const removeArrayItem = (field: 'companyNames' | 'jobTitles' | 'seniority' | 'industries', index: number) => {
    const newArray = criteria[field].filter((_, i) => i !== index);
    setCriteria({ ...criteria, [field]: newArray.length > 0 ? newArray : [''] });
  };

  // Handle webset creation
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty strings and prepare data
    const params = {
      companyNames: criteria.companyNames.filter(c => c.trim()),
      jobTitles: criteria.jobTitles.filter(j => j.trim()),
      seniority: criteria.seniority.filter(s => s.trim()),
      location: criteria.location.trim() || undefined,
      industries: criteria.industries.filter(i => i.trim()),
      maxResults: criteria.maxResults,
    };

    // Validate at least one criteria is provided
    if (
      params.companyNames.length === 0 &&
      params.jobTitles.length === 0 &&
      params.industries.length === 0 &&
      !params.location
    ) {
      toast.error('Please provide at least one search criteria');
      return;
    }

    create(params, {
      onSuccess: (response) => {
        setWebsetId(response.webset.id);
        setStep('processing');
        toast.success('People discovery webset created! Searching for contacts...');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create webset');
      },
    });
  };

  // Auto-advance to results step when webset is completed
  useEffect(() => {
    if (statusData?.status === 'completed' && step === 'processing') {
      setStep('results');
      toast.success('People discovery completed!');
    } else if (statusData?.status === 'failed') {
      toast.error('Webset processing failed. Please try again.');
      setStep('search');
    }
  }, [statusData?.status, step]);

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

  const handleViewPeople = () => {
    router.push('/people');
  };

  // Processing step - show status and polling
  if (step === 'processing') {
    const status = statusData?.status || 'pending';
    const statusLabel = {
      pending: 'Initializing...',
      processing: 'Searching the web for contacts...',
      completed: 'Discovery complete!',
      failed: 'Search failed',
    }[status] || 'Processing...';

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">👥 AI People Finder</h1>
          <p className="text-gray-600 mt-1">Discovering contacts matching your criteria</p>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">{statusLabel}</h2>
              <p className="text-gray-600">
                This may take a few minutes. We're searching professional networks and company
                directories for contacts.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={status === 'processing' ? 'secondary' : 'default'}>
                  {status}
                </Badge>
              </div>
              {criteria.companyNames.filter(c => c).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Companies:</span>
                  <span className="font-medium">{criteria.companyNames.filter(c => c).join(', ')}</span>
                </div>
              )}
              {criteria.jobTitles.filter(j => j).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Titles:</span>
                  <span className="font-medium">{criteria.jobTitles.filter(j => j).join(', ')}</span>
                </div>
              )}
              {criteria.location && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{criteria.location}</span>
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
            <li>Our AI is searching professional networks for matching contacts</li>
            <li>Enriching contact data with email, phone, LinkedIn, etc.</li>
            <li>Checking for duplicates against your existing CRM contacts</li>
            <li>Results will be automatically imported when ready</li>
          </ul>
        </Card>
      </div>
    );
  }

  // Results step - show discovered people
  if (step === 'results') {
    const people = resultsData?.people || [];
    const skipped = resultsData?.skippedDuplicates || 0;
    const skippedNoEmail = resultsData?.skippedNoEmail || 0;
    const total = resultsData?.totalResults || 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">✅ Discovery Complete!</h1>
            <p className="text-gray-600">
              Found {people.length} contacts and added them to your CRM
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToSearch}>
            ← New Search
          </Button>
        </div>

        {(skipped > 0 || skippedNoEmail > 0) && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm">
              {skipped > 0 && (
                <span>
                  ⚠️ Skipped {skipped} duplicate {skipped === 1 ? 'contact' : 'contacts'} that
                  already exist in your CRM
                </span>
              )}
              {skipped > 0 && skippedNoEmail > 0 && <br />}
              {skippedNoEmail > 0 && (
                <span>
                  ⚠️ Skipped {skippedNoEmail} {skippedNoEmail === 1 ? 'contact' : 'contacts'}{' '}
                  without email addresses
                </span>
              )}
            </p>
          </Card>
        )}

        {people.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              No new contacts were found. All discovered contacts either already exist in your CRM or
              were missing required information (email).
            </p>
            <Button onClick={handleBackToSearch}>Try Different Criteria</Button>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={handleViewPeople}>View All Contacts →</Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {people.map((person: any, index: number) => (
                <Card key={person.id || index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {person.firstName} {person.lastName}
                      </h3>
                      {person.title && (
                        <p className="text-sm text-gray-600 mt-1">{person.title}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {person.company?.name && <span>🏢 {person.company.name}</span>}
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            ✉️ {person.email}
                          </a>
                        )}
                        {person.phone && <span>📞 {person.phone}</span>}
                        {person.linkedin && (
                          <a
                            href={person.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            💼 LinkedIn
                          </a>
                        )}
                      </div>
                    </div>

                    <Badge variant="success" className="ml-4">
                      New Contact
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleViewPeople} size="lg">
                View All Contacts in CRM →
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
        <h1 className="text-3xl font-bold">👥 AI People Finder</h1>
        <p className="text-gray-600 mt-1">
          Use AI to discover contacts matching your ideal customer profile
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Company Names */}
          <div>
            <Label>Company Names</Label>
            {criteria.companyNames.map((company, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="e.g., Google, Microsoft, Stripe"
                  value={company}
                  onChange={(e) => handleArrayInput('companyNames', index, e.target.value)}
                />
                {criteria.companyNames.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('companyNames', index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('companyNames')}
              className="mt-2"
            >
              + Add Company
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Search for people working at specific companies
            </p>
          </div>

          {/* Job Titles */}
          <div>
            <Label>Job Titles</Label>
            {criteria.jobTitles.map((title, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="e.g., VP Sales, Marketing Manager, CEO"
                  value={title}
                  onChange={(e) => handleArrayInput('jobTitles', index, e.target.value)}
                />
                {criteria.jobTitles.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('jobTitles', index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('jobTitles')}
              className="mt-2"
            >
              + Add Job Title
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Target specific roles or job titles
            </p>
          </div>

          {/* Seniority Levels */}
          <div>
            <Label>Seniority Levels</Label>
            {criteria.seniority.map((level, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="e.g., Executive, Senior, Mid-level, Entry"
                  value={level}
                  onChange={(e) => handleArrayInput('seniority', index, e.target.value)}
                />
                {criteria.seniority.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('seniority', index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('seniority')}
              className="mt-2"
            >
              + Add Seniority Level
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Filter by career level (optional)
            </p>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, New York, Remote"
              value={criteria.location}
              onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Geographic location of contacts (optional)
            </p>
          </div>

          {/* Industries */}
          <div>
            <Label>Industries</Label>
            {criteria.industries.map((industry, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  placeholder="e.g., SaaS, Fintech, Healthcare"
                  value={industry}
                  onChange={(e) => handleArrayInput('industries', index, e.target.value)}
                />
                {criteria.industries.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem('industries', index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('industries')}
              className="mt-2"
            >
              + Add Industry
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Target people in specific industries (optional)
            </p>
          </div>

          {/* Max Results */}
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
            <p className="text-xs text-gray-500 mt-1">How many contacts to find (1-100)</p>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full" size="lg">
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Creating webset...
              </>
            ) : (
              <>🔍 Find Contacts with AI</>
            )}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm mb-2">💡 How it works:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>AI searches professional networks for contacts matching your criteria</li>
          <li>Contact data is automatically enriched with email, phone, LinkedIn</li>
          <li>Results are imported directly into your CRM with company associations</li>
          <li>Duplicate contacts are automatically detected and skipped</li>
        </ol>
      </Card>

      <Card className="p-4 bg-green-50 border-green-200">
        <h3 className="font-semibold text-sm mb-2">✨ Powered by Exa Websets</h3>
        <p className="text-sm text-gray-700">
          This feature uses Exa's advanced web discovery technology to find professional contacts
          with verified contact information, including work emails, phone numbers, and social
          profiles.
        </p>
      </Card>
    </div>
  );
}
