"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[140px] max-h-[320px] overflow-y-auto px-3 py-2.5 text-xs text-slate-900 focus:outline-none leading-relaxed prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "<p></p>");
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[160px] animate-pulse rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-2 py-1.5 text-slate-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("bold") ? "bg-slate-200 text-indigo-600 font-bold" : ""
          }`}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("italic") ? "bg-slate-200 text-indigo-600 italic" : ""
          }`}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("heading", { level: 2 }) ? "bg-slate-200 text-indigo-600 font-bold" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("heading", { level: 3 }) ? "bg-slate-200 text-indigo-600 font-bold" : ""
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("bulletList") ? "bg-slate-200 text-indigo-600" : ""
          }`}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("orderedList") ? "bg-slate-200 text-indigo-600" : ""
          }`}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-1 text-xs hover:bg-slate-200 hover:text-slate-900 transition-colors ${
            editor.isActive("blockquote") ? "bg-slate-200 text-indigo-600" : ""
          }`}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="rounded p-1 text-xs hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Undo"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="rounded p-1 text-xs hover:bg-slate-200 disabled:opacity-40 transition-colors"
          title="Redo"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
