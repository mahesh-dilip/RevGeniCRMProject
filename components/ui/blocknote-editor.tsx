'use client';

import { useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface BlocknoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function BlocknoteEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200
}: BlocknoteEditorProps) {
  const editor = useCreateBlockNote();

  const isInitialMount = useRef(true);
  const lastHtmlRef = useRef(value);

  // Initialize editor with content from HTML
  useEffect(() => {
    const initializeEditor = async () => {
      if (value && value !== lastHtmlRef.current) {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(value);
          editor.replaceBlocks(editor.document, blocks);
          lastHtmlRef.current = value;
        } catch (error) {
          console.error('Error initializing editor with HTML:', error);
        }
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      initializeEditor();
    }
  }, [value, editor]);

  // Convert blocks to HTML on change
  useEffect(() => {
    const unsubscribe = editor.onChange(async () => {
      try {
        const html = await editor.blocksToHTMLLossy(editor.document);
        if (html !== lastHtmlRef.current) {
          lastHtmlRef.current = html;
          onChange(html);
        }
      } catch (error) {
        console.error('Error converting blocks to HTML:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor, onChange]);

  return (
    <div
      className="border rounded-md overflow-hidden bg-white"
      style={{ minHeight: `${minHeight}px` }}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
        data-theming-background="bg-white"
      >
        {placeholder && (
          <div className="bn-editor" data-placeholder={placeholder} />
        )}
      </BlockNoteView>
    </div>
  );
}
