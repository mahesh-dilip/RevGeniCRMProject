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

          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <p className="text-xs text-gray-500 mb-3">
              Log activities related to this person
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/events/new?personId=${person.id}&type=call`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </Button>
              </Link>
              <Link href={`/events/new?personId=${person.id}&type=meeting`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Meeting
                </Button>
              </Link>
              <Link href={`/events/new?personId=${person.id}&type=email`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Button>
              </Link>
              <Link href={`/deals/new?companyId=${person.company.id}&primaryContactId=${person.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Deal
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
