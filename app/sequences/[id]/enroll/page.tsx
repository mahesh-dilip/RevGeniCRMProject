'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

interface Company {
  id: string;
  name: string;
  status: string;
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    title: string | null;
  }>;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  steps: Array<{ id: string }>;
}

export default function EnrollCompaniesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [sequenceRes, companiesRes] = await Promise.all([
        fetch(`/api/sequences/${params.id}`),
        fetch('/api/companies?includePeople=true')
      ]);

      if (!sequenceRes.ok) {
        throw new Error('Sequence not found');
      }

      const sequenceData = await sequenceRes.json();
      const companiesData = await companiesRes.json();

      setSequence(sequenceData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      router.push('/sequences');
    } finally {
      setFetching(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
      // Remove contact selection when company is deselected
      const newContacts = new Map(selectedContacts);
      newContacts.delete(companyId);
      setSelectedContacts(newContacts);
    } else {
      newSelected.add(companyId);
      // Auto-select first contact if available
      const company = companies.find(c => c.id === companyId);
      if (company && company.people && company.people.length > 0) {
        const newContacts = new Map(selectedContacts);
        newContacts.set(companyId, company.people[0].id);
        setSelectedContacts(newContacts);
      }
    }
    setSelectedCompanies(newSelected);
  };

  const selectContact = (companyId: string, contactId: string) => {
    const newContacts = new Map(selectedContacts);
    newContacts.set(companyId, contactId);
    setSelectedContacts(newContacts);
  };

  const handleEnrollAll = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Please select at least one company');
      return;
    }

    setLoading(true);
    try {
      const enrollments = Array.from(selectedCompanies).map(companyId => ({
        companyId,
        contactId: selectedContacts.get(companyId) || null
      }));

      const response = await fetch(`/api/sequences/${params.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollments })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll companies');
      }

      toast.success(`Successfully enrolled ${selectedCompanies.size} ${selectedCompanies.size === 1 ? 'company' : 'companies'}!`);
      router.push(`/sequences/${params.id}`);
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll companies');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!sequence) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Breadcrumbs items={[
        { label: 'Sequences', href: '/sequences' },
        { label: sequence.name, href: `/sequences/${params.id}` },
        { label: 'Enroll Companies' }
      ]} />

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Enroll Companies in Sequence</h1>
          <p className="text-gray-600 mt-1">
            Select companies to enroll in <strong>{sequence.name}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleEnrollAll}
            disabled={loading || selectedCompanies.size === 0}
          >
            {loading ? 'Enrolling...' : `Enroll ${selectedCompanies.size} ${selectedCompanies.size === 1 ? 'Company' : 'Companies'}`}
          </Button>
          <Link href={`/sequences/${params.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📧</span>
          <div>
            <h3 className="font-semibold text-blue-900">About This Sequence</h3>
            {sequence.description && (
              <p className="text-sm text-blue-800 mt-1">{sequence.description}</p>
            )}
            <p className="text-sm text-blue-700 mt-2">
              This sequence has {sequence.steps.length} email {sequence.steps.length === 1 ? 'step' : 'steps'}
            </p>
          </div>
        </div>
      </Card>

      {companies.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No companies found</p>
          <Link href="/companies/new">
            <Button>Add First Company</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => {
            const isSelected = selectedCompanies.has(company.id);
            const selectedContactId = selectedContacts.get(company.id);

            return (
              <Card
                key={company.id}
                className={`transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={`company-${company.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleCompany(company.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Label
                            htmlFor={`company-${company.id}`}
                            className="text-lg font-semibold cursor-pointer"
                          >
                            {company.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{company.status}</Badge>
                            <span className="text-sm text-gray-600">
                              {company.people?.length || 0} {(company.people?.length || 0) === 1 ? 'contact' : 'contacts'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Selection */}
                      {isSelected && company.people && company.people.length > 0 && (
                        <div className="mt-4 p-3 bg-white border rounded-md">
                          <Label className="text-sm font-semibold mb-2 block">
                            Primary Contact for Personalization
                          </Label>
                          <p className="text-xs text-gray-500 mb-3">
                            Select the contact whose details will be used in email templates (firstName, lastName, etc.)
                          </p>
                          <div className="space-y-2">
                            {company.people.map((person) => (
                              <div key={person.id} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  id={`contact-${person.id}`}
                                  name={`contact-${company.id}`}
                                  checked={selectedContactId === person.id}
                                  onChange={() => selectContact(company.id, person.id)}
                                  className="cursor-pointer"
                                />
                                <Label
                                  htmlFor={`contact-${person.id}`}
                                  className="cursor-pointer text-sm flex-1"
                                >
                                  {person.firstName} {person.lastName}
                                  {person.title && (
                                    <span className="text-gray-500 ml-2">• {person.title}</span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSelected && (!company.people || company.people.length === 0) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            ⚠️ This company has no contacts. Template variables like {'{firstName}'} won't be personalized.
                          </p>
                          <Link href={`/people/new?companyId=${company.id}`}>
                            <Button size="sm" variant="outline" className="mt-2">
                              Add Contact
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {companies.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
          <div>
            <p className="text-sm text-gray-600">
              {selectedCompanies.size} of {companies.length} companies selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCompanies(new Set(companies.map(c => c.id)));
                // Auto-select first contact for each company
                const newContacts = new Map();
                companies.forEach(company => {
                  if (company.people && company.people.length > 0) {
                    newContacts.set(company.id, company.people[0].id);
                  }
                });
                setSelectedContacts(newContacts);
              }}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCompanies(new Set());
                setSelectedContacts(new Map());
              }}
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
