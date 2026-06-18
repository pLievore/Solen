"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const BUTTON =
  "rounded px-2 py-1 text-xs transition hover:bg-border/60 disabled:opacity-40";
const BUTTON_ACTIVE = "bg-border text-fg";

export default function RichEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Escreva aqui…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[300px] w-full rounded border border-border bg-bg p-3 text-sm outline-none focus:border-brand prose prose-sm max-w-none",
      },
    },
  });

  if (!editor) return null;

  function setLink() {
    const url = window.prompt("URL do link:");
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 rounded border border-border bg-bg p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${BUTTON} ${editor.isActive("bold") ? BUTTON_ACTIVE : ""}`}
        >
          <b>N</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${BUTTON} ${editor.isActive("italic") ? BUTTON_ACTIVE : ""}`}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${BUTTON} ${editor.isActive("heading", { level: 2 }) ? BUTTON_ACTIVE : ""}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${BUTTON} ${editor.isActive("heading", { level: 3 }) ? BUTTON_ACTIVE : ""}`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${BUTTON} ${editor.isActive("bulletList") ? BUTTON_ACTIVE : ""}`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${BUTTON} ${editor.isActive("orderedList") ? BUTTON_ACTIVE : ""}`}
        >
          1. Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${BUTTON} ${editor.isActive("blockquote") ? BUTTON_ACTIVE : ""}`}
        >
          Citação
        </button>
        <button type="button" onClick={setLink} className={BUTTON}>
          Link
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className={BUTTON}
        >
          Remover link
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
