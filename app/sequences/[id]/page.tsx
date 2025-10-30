import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default async function SequenceDetailPage({
  params
}: {
  params: { id: string }
}) {
  const sequence = await prisma.emailSequence.findUnique({
    where: { id: params.id },
    include: {
      steps: { orderBy: { stepOrder: 'asc' } },
      enrollments: {
        include: {
          company: true,
          scheduledEmails: {
            orderBy: { scheduledFor: 'asc' }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      }
    }
  });

  if (!sequence) {
    notFound();
  }

  const activeEnrollments = sequence.enrollments.filter(e => e.status === 'active');
  const pausedEnrollments = sequence.enrollments.filter(e => e.status === 'paused');
  const completedEnrollments = sequence.enrollments.filter(e => e.status === 'completed');

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Sequences', href: '/sequences' },
        { label: sequence.name }
      ]} />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{sequence.name}</h1>
            <Badge variant={sequence.active ? 'default' : 'secondary'}>
              {sequence.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {sequence.description && (
            <p className="text-gray-600">{sequence.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/sequences">
            <Button variant="outline">← Back to Sequences</Button>
          </Link>
          <Link href={`/sequences/${sequence.id}/edit`}>
            <Button variant="outline">✏️ Edit</Button>
          </Link>
          <Link href={`/sequences/${sequence.id}/enroll`}>
            <Button>+ Enroll Companies</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Steps</p>
          <p className="text-2xl font-bold">{sequence.steps.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Enrolled</p>
          <p className="text-2xl font-bold">{sequence.enrollments.length}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold">{activeEnrollments.length}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold">{completedEnrollments.length}</p>
        </Card>
      </div>

      {/* Sequence Steps */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Email Steps</h2>
        <div className="space-y-4">
          {sequence.steps.map((step, index) => (
            <div key={step.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                    {step.stepOrder}
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {step.delayDays === 0 ? 'Sent immediately' : `Sent ${step.delayDays} days after ${index === 0 ? 'enrollment' : 'previous email'}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-white p-4 rounded border">
                <p className="text-sm whitespace-pre-wrap text-gray-700">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Enrollments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Active Enrollments ({activeEnrollments.length})
          </h2>
          <div className="space-y-3">
            {activeEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <Link
                    href={`/companies/${enrollment.company.id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {enrollment.company.name}
                  </Link>
                  <Badge variant="default">Step {enrollment.currentStep}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Enrolled {formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}
                </p>
                {enrollment.scheduledEmails.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Next email: {formatDistanceToNow(new Date(enrollment.scheduledEmails[0].scheduledFor), { addSuffix: true })}
                  </p>
                )}
              </div>
            ))}
            {activeEnrollments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No active enrollments</p>
            )}
          </div>
        </Card>

        {/* Paused Enrollments */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Paused Enrollments ({pausedEnrollments.length})
          </h2>
          <div className="space-y-3">
            {pausedEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-3 bg-yellow-50">
                <div className="flex justify-between items-start mb-2">
                  <Link
                    href={`/companies/${enrollment.company.id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {enrollment.company.name}
                  </Link>
                  <Badge variant="secondary">Paused</Badge>
                </div>
                {enrollment.pauseReason && (
                  <p className="text-sm text-gray-600 mb-1">
                    Reason: {enrollment.pauseReason}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Enrolled {formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}
                </p>
              </div>
            ))}
            {pausedEnrollments.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No paused enrollments</p>
            )}
          </div>
        </Card>
      </div>

      {/* Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pause on deal creation:</span>
            <span className="font-medium">{sequence.pauseOnDealCreation ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{formatDistanceToNow(new Date(sequence.createdAt), { addSuffix: true })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last updated:</span>
            <span className="font-medium">{formatDistanceToNow(new Date(sequence.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
