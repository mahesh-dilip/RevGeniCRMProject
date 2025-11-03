'use client';

import { useEffect } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface BlocknoteViewerProps {
  content: string;
  minHeight?: number;
}

export default function BlocknoteViewer({
  content,
  minHeight = 100
}: BlocknoteViewerProps) {
  const editor = useCreateBlockNote({
    initialContent: undefined,
  });

  // Load content into editor
  useEffect(() => {
    const loadContent = async () => {
      try {
        if (content && content.trim()) {
          let contentToLoad = content;

          // If content doesn't have HTML tags, convert newlines to HTML paragraphs
          if (!content.includes('<p>') && !content.includes('<br') && content.includes('\n')) {
            const paragraphs = contentToLoad
              .split(/\n\n+/)
              .map(para => para.trim())
              .filter(para => para.length > 0);

            if (paragraphs.length > 1) {
              contentToLoad = paragraphs.map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('\n');
            } else {
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
        }
      } catch (error) {
        console.error('Error loading content into viewer:', error);
      }
    };

    loadContent();
  }, [content, editor]);

  return (
    <div
      className="blocknote-viewer border rounded-md overflow-hidden bg-white"
      style={{ minHeight: `${minHeight}px` }}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
        editable={false}
      />
      <style jsx global>{`
        .blocknote-viewer .bn-container {
          min-height: ${minHeight}px;
        }

        .blocknote-viewer .bn-editor {
          padding: 12px 16px;
          min-height: ${minHeight - 24}px;
        }

        .blocknote-viewer .bn-block-content {
          line-height: 1.6;
        }

        .blocknote-viewer .ProseMirror {
          padding: 0;
          outline: none;
        }

        .blocknote-viewer .ProseMirror p {
          margin: 0.5em 0;
        }

        .blocknote-viewer .ProseMirror p:first-child {
          margin-top: 0;
        }

        /* Hide block handles and other editing UI in viewer mode */
        .blocknote-viewer .bn-block-outer[data-node-type="blockContainer"] > .bn-block-content > .bn-block-group::before {
          display: none;
        }

        .blocknote-viewer .bn-drag-handle-menu {
          display: none !important;
        }

        .blocknote-viewer .bn-side-menu {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
