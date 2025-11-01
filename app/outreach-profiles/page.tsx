'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logError } from '@/lib/logging';

export default function OutreachProfilesPage() {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['outreach-profiles'],
    queryFn: async () => {
      const response = await fetch('/api/outreach-profiles');
      if (!response.ok) throw new Error('Failed to fetch profiles');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/outreach-profiles/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-profiles'] });
      toast.success('Profile deleted successfully');
    },
    onError: (error) => {
      logError('Delete profile error:', error);
      toast.error('Failed to delete profile');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/outreach-profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) throw new Error('Failed to set default');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-profiles'] });
      toast.success('Default profile updated');
    },
    onError: (error) => {
      logError('Set default error:', error);
      toast.error('Failed to set default profile');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Outreach Profiles</h1>
          <p className="text-gray-600">
            Manage your business profiles for AI-powered sequence generation
          </p>
        </div>
        <Link href="/outreach-profiles/new">
          <Button>+ Create Profile</Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-sm mb-2">What are Outreach Profiles?</h3>
        <p className="text-sm text-gray-700">
          Outreach profiles store your business context (value proposition, pain points, success stories)
          so AI can generate personalized email sequences tailored to your offering and target audience.
        </p>
      </Card>

      {isLoading && (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      )}

      {!isLoading && profiles.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No outreach profiles yet.</p>
          <Link href="/outreach-profiles/new">
            <Button>Create Your First Profile</Button>
          </Link>
        </Card>
      )}

      {!isLoading && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((profile: any) => (
            <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{profile.name}</h3>
                    {profile.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-sm text-gray-600">{profile.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Offering
                  </p>
                  <p className="text-sm">{profile.companyOffering}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Value Proposition
                  </p>
                  <p className="text-sm">{profile.valueProposition}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Tone
                  </p>
                  <Badge variant="outline">{profile.tone}</Badge>
                </div>

                {Array.isArray(profile.targetPainPoints) && profile.targetPainPoints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Pain Points
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {profile.targetPainPoints.slice(0, 3).map((point: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {point}
                        </Badge>
                      ))}
                      {profile.targetPainPoints.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{profile.targetPainPoints.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Link href={`/outreach-profiles/${profile.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Edit
                  </Button>
                </Link>
                {!profile.isDefault && (
                  <Button
                    variant="outline"
                    onClick={() => setDefaultMutation.mutate(profile.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this profile?')) {
                      deleteMutation.mutate(profile.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
