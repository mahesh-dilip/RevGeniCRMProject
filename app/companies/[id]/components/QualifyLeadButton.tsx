'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QualifyLeadModal } from './QualifyLeadModal';

interface QualifyLeadButtonProps {
  companyId: string;
  companyName: string;
  status: string;
}

export function QualifyLeadButton({ companyId, companyName, status }: QualifyLeadButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Only show for Lead status
  if (status !== 'Lead') {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => setShowModal(true)}
      >
        ✓ Qualify Lead
      </Button>
      {showModal && (
        <QualifyLeadModal
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

