import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EnrollmentsSection } from './components/EnrollmentsSection';
import { DeleteSequenceButton } from './components/DeleteSequenceButton';
import { EmailStepsSection } from './components/EmailStepsSection';


export const dynamic = 'force-dynamic';
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
  const completedEnrollments = sequence.enrollments.filter(e => e.status === 'completed');

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Sequences', href: '/sequences' },
        { label: sequence.name }
      ]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{sequence.name}</h1>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={sequence.active ? 'default' : 'secondary'}>
              {sequence.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {sequence.description && (
            <p className="text-gray-600">{sequence.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Link href="/sequences">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          <Link href={`/sequences/${sequence.id}/edit`}>
            <Button variant="outline" size="sm">✏️ Edit</Button>
          </Link>
          <Link href={`/sequences/${sequence.id}/enroll`}>
            <Button size="sm">+ Enroll</Button>
          </Link>
          <DeleteSequenceButton sequenceId={sequence.id} sequenceName={sequence.name} />
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
      <EmailStepsSection steps={sequence.steps} />

      {/* Enrollments */}
      <EnrollmentsSection initialEnrollments={sequence.enrollments} />

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
