import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityTimeline } from '@/components/events/ActivityTimeline';


export const dynamic = 'force-dynamic';
export default async function PersonDetailPage({
  params
}: {
  params: { id: string }
}) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      events: {
        orderBy: { createdAt: 'desc' },
        include: {
          company: true,
          deal: true
        }
      },
      primaryDeals: {
        include: {
          company: true
        }
      }
    }
  });

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {person.firstName} {person.lastName}
          </h1>
          {person.title && (
            <p className="text-gray-600 text-lg">{person.title}</p>
          )}
          <Link
            href={`/companies/${person.company.id}`}
            className="text-blue-600 hover:underline"
          >
            🏢 {person.company.name}
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/people">
            <Button variant="outline">← Back to People</Button>
          </Link>
          <Link href={`/events/new?personId=${person.id}`}>
            <Button>+ Log Activity</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              {person.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${person.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {person.email}
                  </a>
                </div>
              )}
              {person.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${person.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {person.phone}
                  </a>
                </div>
              )}
              {person.linkedin && (
                <div>
                  <p className="text-sm text-gray-500">LinkedIn</p>
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </Card>

          {person.primaryDeals.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Deals (Primary Contact)</h2>
              <div className="space-y-2">
                {person.primaryDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block p-3 border rounded hover:bg-gray-50"
                  >
                    <p className="font-medium text-sm">{deal.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <Badge variant="secondary" className="text-xs">{deal.stage}</Badge>
                      {deal.value && (
                        <span className="text-sm font-semibold text-green-600">
                          ${deal.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/events/new?personId=${person.id}&type=call`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📞 Log Call
                </Button>
              </Link>
              <Link href={`/events/new?personId=${person.id}&type=meeting`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  🤝 Log Meeting
                </Button>
              </Link>
              <Link href={`/events/new?personId=${person.id}&type=email`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📧 Log Email
                </Button>
              </Link>
              <Link href={`/deals/new?companyId=${person.company.id}&primaryContactId=${person.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  💼 Create Deal
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column - Activity Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
          {person.events.length > 0 ? (
            <ActivityTimeline events={person.events} />
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500 mb-4">No activities yet</p>
              <Link href={`/events/new?personId=${person.id}`}>
                <Button>+ Log First Activity</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
