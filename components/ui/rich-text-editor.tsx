'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// Dynamically import the editor component with no SSR
const BlocknoteEditor = dynamic(
  () => import('./blocknote-editor'),
  {
    ssr: false,
    loading: () => (
      <div
        className="border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center"
        style={{ minHeight: '200px' }}
      >
        <p className="text-gray-400 text-sm">Loading editor...</p>
      </div>
    ),
  }
);

/**
 * Rich text editor component using Blocknote
 * Stores content as HTML in the database (email-ready format)
 * Supports email formatting with bold, italic, links, lists, etc.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  return <BlocknoteEditor {...props} />;
}
