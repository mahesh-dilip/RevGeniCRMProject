'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const isUpdatingRef = useRef(false);
  const lastLoadedValueRef = useRef('');

  // Load content into editor whenever value changes (fixes existing sequence editing)
  useEffect(() => {
    const loadContent = async () => {
      // Skip if we're currently updating (prevents feedback loop)
      if (isUpdatingRef.current) return;

      // Skip if value hasn't changed
      if (value === lastLoadedValueRef.current) return;

      try {
        if (value && value.trim()) {
          let contentToLoad = value;

          // If content doesn't have HTML tags, convert newlines to HTML paragraphs
          if (!value.includes('<p>') && !value.includes('<br') && value.includes('\n')) {
            // Convert plain text with newlines to HTML
            const paragraphs = contentToLoad
              .split(/\n\n+/)  // Split by double newlines for paragraphs
              .map(para => para.trim())
              .filter(para => para.length > 0);

            if (paragraphs.length > 1) {
              // Use double-newline separated paragraphs
              contentToLoad = paragraphs.map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('\n');
            } else {
              // Treat single newlines as paragraph breaks
              const lines = contentToLoad
                .split(/\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);
              contentToLoad = lines.map(line => `<p>${line}</p>`).join('\n');
            }
          }

          // Parse HTML and load into editor
          const blocks = await editor.tryParseHTMLToBlocks(contentToLoad);
          editor.replaceBlocks(editor.document, blocks);
          lastLoadedValueRef.current = value;
        } else if (!value && lastLoadedValueRef.current) {
          // Clear editor if value is empty
          editor.replaceBlocks(editor.document, []);
          lastLoadedValueRef.current = '';
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading content into editor:', error);
        setIsInitialized(true);
      }
    };

    loadContent();
  }, [value, editor]);

  // Convert blocks to HTML on change
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = editor.onChange(async () => {
      try {
        isUpdatingRef.current = true;
        const html = await editor.blocksToHTMLLossy(editor.document);

        // Only call onChange if content actually changed
        if (html !== lastLoadedValueRef.current) {
          lastLoadedValueRef.current = html;
          onChange(html);
        }

        isUpdatingRef.current = false;
      } catch (error) {
        console.error('Error converting blocks to HTML:', error);
        isUpdatingRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [editor, onChange, isInitialized]);

  return (
    <div
      className="blocknote-wrapper border rounded-md overflow-hidden bg-white"
      style={{ minHeight: `${minHeight}px` }}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
      />
      <style jsx global>{`
        /* Fix cursor alignment and editor styles */
        .blocknote-wrapper .bn-container {
          min-height: ${minHeight}px;
        }

        .blocknote-wrapper .bn-editor {
          padding: 12px 16px;
          min-height: ${minHeight - 24}px;
        }

        .blocknote-wrapper .bn-block-content {
          line-height: 1.6;
        }

        /* Fix cursor positioning */
        .blocknote-wrapper .ProseMirror {
          padding: 0;
          outline: none;
        }

        .blocknote-wrapper .ProseMirror p {
          margin: 0.5em 0;
        }

        .blocknote-wrapper .ProseMirror p:first-child {
          margin-top: 0;
        }

        /* Ensure cursor is visible and properly aligned */
        .blocknote-wrapper .ProseMirror-focused {
          outline: none;
        }

        .blocknote-wrapper .bn-block-outer {
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
