'use client';

import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { toast } from 'sonner';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  className?: string;
}

export function InlineEdit({ value, onSave, className = '' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
      toast.success('Updated successfully');
    } catch (error) {
      toast.error('Failed to update');
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className={className}
          autoFocus
          disabled={saving}
        />
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '...' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${className}`}
      title="Click to edit"
    >
      {value}
    </span>
  );
}

