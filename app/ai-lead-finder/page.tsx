'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function AILeadFinderPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    industry: '',
    geography: '',
    size: '',
    additionalContext: '',
    maxResults: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('/api/ai/find-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.companies);
      } else {
        alert(data.error || 'Failed to find leads');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to find leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">🤖 AI Lead Finder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="e.g., SaaS, FinTech, E-commerce"
                  required
                />
              </div>

              <div>
                <Label htmlFor="geography">Geography *</Label>
                <Input
                  id="geography"
                  value={formData.geography}
                  onChange={(e) =>
                    setFormData({ ...formData, geography: e.target.value })
                  }
                  placeholder="e.g., London, UK"
                  required
                />
              </div>

              <div>
                <Label htmlFor="size">Company Size *</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="e.g., 50-200 employees"
                  required
                />
              </div>

              <div>
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  value={formData.additionalContext}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalContext: e.target.value,
                    })
                  }
                  placeholder="Any additional search criteria..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="maxResults">Max Results</Label>
                <Input
                  id="maxResults"
                  type="number"
                  value={formData.maxResults}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxResults: parseInt(e.target.value) || 10,
                    })
                  }
                  min={1}
                  max={20}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Searching...' : '🔍 Find Leads'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Results ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8">
                  <div className="text-gray-600">
                    AI is searching for leads...
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results yet. Enter criteria and click Find Leads.
                </div>
              )}

              <div className="space-y-4">
                {results.map((company, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-600">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">
                          {company.name}
                        </h3>
                        {company.confidence && (
                          <Badge
                            variant={
                              company.confidence > 0.8
                                ? 'success'
                                : company.confidence > 0.6
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {Math.round(company.confidence * 100)}% match
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {company.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {company.industry && (
                          <span>🏭 {company.industry}</span>
                        )}
                        {company.geography && (
                          <span>📍 {company.geography}</span>
                        )}
                        {company.size && <span>👥 {company.size}</span>}
                      </div>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                        >
                          🔗 {company.website}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
