'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      Lead: 'default',
      Qualified: 'secondary',
      Customer: 'success',
      Lost: 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Companies</h1>
        <Link href="/ai-lead-finder">
          <Button>🤖 Find New Leads</Button>
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!loading && companies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">
              No companies yet. Start by finding AI leads!
            </p>
            <Link href="/ai-lead-finder">
              <Button>🤖 Find AI Leads</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <Badge variant={getStatusVariant(company.status)}>
                  {company.status}
                </Badge>
              </div>

              {company.sourceType === 'ai_agent' && (
                <Badge variant="outline" className="mb-2 text-xs">
                  🤖 AI Generated
                  {company.confidence &&
                    ` (${Math.round(company.confidence * 100)}%)`}
                </Badge>
              )}

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {company.description || 'No description'}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                {company.industry && <span>🏭 {company.industry}</span>}
                {company.geography && <span>📍 {company.geography}</span>}
                {company.size && <span>👥 {company.size}</span>}
              </div>

              {company._count && (
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>💼 {company._count.deals} deals</span>
                  <span>👤 {company._count.people} people</span>
                </div>
              )}

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline block mb-3"
                >
                  🔗 Visit website
                </a>
              )}

              <Button size="sm" className="w-full" variant="outline">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
