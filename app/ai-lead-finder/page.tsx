'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function AILeadFinderPage() {
  const router = useRouter();
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [loading, setLoading] = useState(false);
  const [foundLeads, setFoundLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  const [criteria, setCriteria] = useState({
    industry: '',
    geography: '',
    size: '',
    additionalContext: '',
    maxResults: 10
  });

  // Step 1: Search for leads
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/find-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...criteria,
          autoCreate: false // Don't auto-create!
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find leads');
      }

      if (data.companies.length === 0) {
        toast.warning('No leads found matching your criteria. Try adjusting your search.');
        return;
      }

      setFoundLeads(data.companies);
      setSelectedLeads(new Set(data.companies.map((_: any, i: number) => i))); // Select all by default
      setStep('review');
      toast.success(`Found ${data.companies.length} potential leads!`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to find leads');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Add selected leads to CRM
  const handleAddSelected = async () => {
    const leadsToAdd = foundLeads.filter((_, i) => selectedLeads.has(i));

    if (leadsToAdd.length === 0) {
      toast.error('Please select at least one lead to add');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/companies/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: leadsToAdd })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add leads');
      }

      toast.success(`✅ Added ${data.created} companies to your CRM!`);
      if (data.skipped > 0) {
        toast.info(`⚠️ Skipped ${data.skipped} duplicates`);
      }

      router.push('/companies');
    } catch (error) {
      console.error('Add error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add leads');
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    setSelectedLeads(new Set(foundLeads.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedLeads(new Set());
  };

  if (step === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Review AI-Generated Leads</h1>
            <p className="text-gray-600">Select which companies to add to your CRM</p>
          </div>
          <Button variant="outline" onClick={() => setStep('search')}>
            ← Back to Search
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedLeads.size} of {foundLeads.length} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
            <Button onClick={handleAddSelected} disabled={loading || selectedLeads.size === 0}>
              {loading ? 'Adding...' : `Add ${selectedLeads.size} to CRM`}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {foundLeads.map((lead, index) => (
            <Card
              key={index}
              className={`p-4 cursor-pointer transition-all ${
                selectedLeads.has(index) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => toggleLead(index)}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedLeads.has(index)}
                  onCheckedChange={() => toggleLead(index)}
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{lead.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{lead.description}</p>
                    </div>
                    {lead.confidence && (
                      <Badge variant={lead.confidence > 0.8 ? 'success' : 'secondary'}>
                        {Math.round(lead.confidence * 100)}% match
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    {lead.industry && <span>🏭 {lead.industry}</span>}
                    {lead.geography && <span>📍 {lead.geography}</span>}
                    {lead.size && <span>👥 {lead.size}</span>}
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 {lead.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Step 1: Search Form
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
            <p className="text-xs text-gray-500 mt-1">City, region, or country where companies are located</p>
          </div>

          <div>
            <Label htmlFor="size">Company Size *</Label>
            <Input
              id="size"
              placeholder="e.g., 50-200 employees or 10-50 employees"
              value={criteria.size}
              onChange={(e) => setCriteria({ ...criteria, size: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Number of employees or company size range</p>
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
              max="50"
              value={criteria.maxResults}
              onChange={(e) => setCriteria({ ...criteria, maxResults: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">How many leads to generate (1-50)</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Searching for leads...
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
          <li>You review and select which leads to add</li>
          <li>Selected companies are added to your CRM</li>
          <li>Duplicate companies are automatically detected and skipped</li>
        </ol>
      </Card>
    </div>
  );
}
