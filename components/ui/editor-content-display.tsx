"use client";

import { EditorProvider } from "@/components/ui/kibo-ui/editor";
import { JSONContent } from "@tiptap/react";

interface EditorContentDisplayProps {
  content: JSONContent | string;
  className?: string;
}

export default function EditorContentDisplay({ content, className = "" }: EditorContentDisplayProps) {
  // Parse content if it's a string
  let parsedContent: JSONContent;
  try {
    parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    // If parsing fails, create a simple paragraph with the text content
    parsedContent = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: typeof content === 'string' ? content : '' }]
      }]
    };
  }

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <EditorProvider
        editable={false}
        content={parsedContent}
        className="border-none p-0 bg-transparent"
        enablePasteRules={false}
        enableInputRules={false}
      />
    </div>
  );
}