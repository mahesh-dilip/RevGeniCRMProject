'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  usePeopleWebsetWorkflow,
  usePeopleWebsetStatus,
  usePeopleWebsetPreview,
  usePeopleWebsetImport,
} from '@/lib/hooks/use-websets';

type Step = 'search' | 'processing' | 'review' | 'importing' | 'results';

export default function AIPeopleFinderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('search');
  const [websetId, setWebsetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [criteria, setCriteria] = useState({
    companyNames: [''],
    jobTitles: [''],
    seniority: [''],
    location: '',
    industries: [''],
    maxResults: 10,
  });

  // Pre-fill company name from URL parameter
  useEffect(() => {
    const companyParam = searchParams.get('company');
    if (companyParam) {
      setCriteria(prev => ({
        ...prev,
        companyNames: [companyParam]
      }));
      toast.info(`Pre-filled company: ${companyParam}`);
    }
  }, [searchParams]);

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
    data: previewData,
    isLoading: isLoadingPreview,
    error: previewError,
  } = usePeopleWebsetPreview(
    websetId,
    statusData?.status === 'completed' && step === 'processing'
  );

  const {
    mutate: importSelected,
    isPending: isImporting,
    data: importResults,
    error: importError,
  } = usePeopleWebsetImport();

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

  // Auto-advance to review step when preview data is available
  useEffect(() => {
    if (statusData?.status === 'failed') {
      toast.error('Webset processing failed. Please try again.');
      setStep('search');
    } else if (
      statusData?.status === 'completed' &&
      step === 'processing' &&
      previewData &&
      !isLoadingPreview
    ) {
      setStep('review');
      // Auto-select all people by default
      if (previewData.people) {
        setSelectedIds(previewData.people.map((p: any) => p.exaId));
      }
    }
  }, [statusData?.status, step, previewData, isLoadingPreview]);

  // Handle import completion
  useEffect(() => {
    if (importResults && step === 'importing') {
      setStep('results');
      toast.success(`Successfully imported ${importResults.count} contacts!`);
    }
  }, [importResults, step]);

  // Show error messages
  useEffect(() => {
    if (createError) {
      toast.error(createError.message || 'Failed to create webset');
    }
    if (statusError) {
      toast.error('Failed to check webset status');
    }
    if (previewError) {
      toast.error('Failed to fetch preview');
    }
    if (importError) {
      toast.error(importError.message || 'Failed to import contacts');
      setStep('review'); // Go back to review on error
    }
  }, [createError, statusError, previewError, importError]);

  const handleBackToSearch = () => {
    setStep('search');
    setWebsetId(null);
    setSelectedIds([]);
  };

  const handleViewPeople = () => {
    router.push('/people');
  };

  const handleTogglePerson = (exaId: string) => {
    setSelectedIds((prev) =>
      prev.includes(exaId)
        ? prev.filter((id) => id !== exaId)
        : [...prev, exaId]
    );
  };

  const handleSelectAll = () => {
    if (previewData?.people) {
      setSelectedIds(previewData.people.map((p: any) => p.exaId));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleImportSelected = () => {
    if (!websetId || selectedIds.length === 0) {
      toast.error('Please select at least one contact to import');
      return;
    }

    setStep('importing');
    importSelected({ websetId, selectedIds });
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
            <li>You'll be able to review and select which contacts to import</li>
          </ul>
        </Card>
      </div>
    );
  }

  // Review step - show people with checkboxes for selection
  if (step === 'review') {
    if (isLoadingPreview || !previewData) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">⏳ Loading Results...</h1>
              <p className="text-gray-600">Fetching discovered contacts...</p>
            </div>
          </div>
          <Card className="p-8 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Processing discovered contacts...</p>
          </Card>
        </div>
      );
    }

    const people = previewData.people || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">📋 Review Results</h1>
            <p className="text-gray-600">
              Found {people.length} contacts. Select which ones to import to your CRM.
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToSearch}>
            ← New Search
          </Button>
        </div>

        {people.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              No contacts were found matching your criteria.
            </p>
            <Button onClick={handleBackToSearch}>Try Different Criteria</Button>
          </Card>
        ) : (
          <>
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {selectedIds.length} of {people.length} contacts selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {people.map((person: any) => (
                <Card
                  key={person.exaId}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedIds.includes(person.exaId)
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => handleTogglePerson(person.exaId)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(person.exaId)}
                      onCheckedChange={() => handleTogglePerson(person.exaId)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{person.name}</h3>
                      {person.jobTitle && (
                        <p className="text-sm text-gray-600 mt-1">{person.jobTitle}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {person.companyName && <span>🏢 {person.companyName}</span>}
                        {person.location && <span>📍 {person.location}</span>}
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ✉️ {person.email}
                          </a>
                        )}
                        {person.linkedinUrl && (
                          <a
                            href={person.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            💼 LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
              <p className="text-sm font-medium">
                {selectedIds.length} {selectedIds.length === 1 ? 'contact' : 'contacts'} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToSearch}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImportSelected}
                  disabled={selectedIds.length === 0}
                  size="lg"
                >
                  Import {selectedIds.length > 0 && `(${selectedIds.length})`} to CRM →
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Importing step - show progress
  if (step === 'importing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📥 Importing Contacts</h1>
          <p className="text-gray-600 mt-1">Adding selected contacts to your CRM</p>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Importing {selectedIds.length} contacts...</h2>
              <p className="text-gray-600">
                Checking for duplicates and adding contacts to your CRM
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Results step - show import results
  if (step === 'results') {
    if (!importResults) {
      return (
        <div className="space-y-6">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Loading results...</p>
          </Card>
        </div>
      );
    }

    const imported = importResults.count || 0;
    const skipped = importResults.skippedDuplicates || 0;
    const skippedNoLinkedIn = importResults.skippedNoLinkedIn || 0;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">✅ Import Complete!</h1>
            <p className="text-gray-600">
              Successfully imported {imported} {imported === 1 ? 'contact' : 'contacts'} to your CRM
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToSearch}>
            ← New Search
          </Button>
        </div>

        {(skipped > 0 || skippedNoLinkedIn > 0) && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm">
              {skipped > 0 && (
                <span>
                  ⚠️ Skipped {skipped} duplicate {skipped === 1 ? 'contact' : 'contacts'} that
                  already exist in your CRM
                </span>
              )}
              {skipped > 0 && skippedNoLinkedIn > 0 && <br />}
              {skippedNoLinkedIn > 0 && (
                <span>
                  ⚠️ Skipped {skippedNoLinkedIn} {skippedNoLinkedIn === 1 ? 'contact' : 'contacts'}{' '}
                  without LinkedIn URLs
                </span>
              )}
            </p>
          </Card>
        )}

        <Card className="p-6 text-center">
          <div className="mb-4">
            <div className="text-6xl mb-2">✅</div>
            <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
            <p className="text-gray-600">
              {imported} new {imported === 1 ? 'contact has' : 'contacts have'} been added to your CRM
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleViewPeople} size="lg">
              View Contacts in CRM →
            </Button>
            <Button variant="outline" onClick={handleBackToSearch} size="lg">
              Find More Contacts
            </Button>
          </div>
        </Card>
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
          <li>Review and select which contacts to import</li>
          <li>Selected contacts are added to your CRM with duplicate detection</li>
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
