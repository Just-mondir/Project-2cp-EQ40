"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";


import {
    Bold,
    Italic,
    Strikethrough,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ESPRESSO = "#432817";

const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{ color: "#FFF8E2", opacity: disabled ? 0.3 : 1 }}
            className={`p-1.5 rounded-md transition-all h-[32px] w-[32px] flex items-center justify-center
      ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      ${isActive ? "bg-[#FFF8E2]/10 text-[#FFF8E2]" : "hover:bg-[#FFF8E2]/10 text-[#FFF8E2]"}
    `}
        >
            <span style={{ color: "#FFF8E2", display: "inline-flex", opacity: 1 }}>
                {children}
            </span>
        </button>
    );
};

const Divider = () => <div className="w-[1px] h-[24px] bg-[#E0D5C5]/60 mx-1" />;

export function TitleEditor({ value, onChange, placeholder = "Entrez le titre de votre post ici..." }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, blockquote: false, bulletList: false, orderedList: false, codeBlock: false, horizontalRule: false }),
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        immediatelyRender: false,
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none rich-text-editor__content px-3 py-2.5 text-[14px]",
                style: "font-family: var(--font-lato), sans-serif; min-height: 40px; max-height: 80px; overflow-y: auto;",
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="rich-text-editor__surface w-full border border-[#E0D5C5] rounded-[10.75px] overflow-hidden bg-white shadow-sm flex flex-col">
            {/* Mini toolbar */}
            <div className="rich-text-editor__toolbar flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E0D5C5]/60 bg-[#FDFDFD]">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold"><Bold size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic"><Italic size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline"><UnderlineIcon size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={13} /></ToolbarButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

export default function RichTextEditor({ value, onChange, placeholder = "Nouveau contenu...", minHeight = "180px" }) {
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const headingMenuRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Placeholder.configure({ placeholder }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),

        ],
        immediatelyRender: false,
        content: value || "", // HTML content
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none rich-text-editor__content p-4 text-[14px]",
                style: `font-family: var(--font-lato), sans-serif; min-height: ${minHeight};`,
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    useEffect(() => {
        const handleClick = (e) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(e.target)) setShowHeadingMenu(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!editor) return null;

    const currentType = editor.isActive("heading", { level: 1 })
        ? "Titre 1"
        : editor.isActive("heading", { level: 2 })
            ? "Titre 2"
            : editor.isActive("heading", { level: 3 })
                ? "Titre 3"
                : "Paragraphe";

    return (
        <div className="rich-text-editor__surface w-full border border-[#E0D5C5] rounded-[10.75px] overflow-hidden bg-white shadow-sm flex flex-col">
            {/* ── TOOLBAR ── */}
            <div className="rich-text-editor__toolbar flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[#E0D5C5]/60 bg-[#FDFDFD]">
                {/* Paragraph Dropdown */}
                <div className="relative" ref={headingMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                        className="rich-text-editor__select flex items-center gap-2 px-3 h-[32px] rounded-md hover:bg-[#E0D5C5]/40 transition-colors text-[13px] font-medium"
                    >
                        {currentType}
                        <ChevronDown size={14} className={`transition-transform ${showHeadingMenu ? "rotate-180" : ""}`} />
                    </button>
                    {showHeadingMenu && (
                        <div className="absolute top-full left-0 mt-1 py-1 w-[140px] bg-white border border-[#E0D5C5] rounded-lg shadow-lg z-50">
                            {["Paragraphe", "Titre 1", "Titre 2", "Titre 3"].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        if (type === "Paragraphe") editor.commands.setParagraph();
                                        else editor.commands.toggleHeading({ level: parseInt(type.split(" ")[1]) });
                                        setShowHeadingMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#432817]/5 ${currentType === type ? "text-[#432817] bg-[#432817]/5" : "text-[#432817]"}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Gras">
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italique">
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Barré">
                    <Strikethrough size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Souligné">
                    <UnderlineIcon size={16} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Aligner à gauche">
                    <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centrer">
                    <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Aligner à droite">
                    <AlignRight size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title="Justifier">
                    <AlignJustify size={16} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Liste à puces">
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Liste numérotée">
                    <ListOrdered size={16} />
                </ToolbarButton>


            </div>



            {/* ── CONTENT AREA ── */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #FFF8E2;
          opacity: 0.7;
          font-style: italic;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          height: 100%;
        }
        .ProseMirror > * + * {
          margin-top: 0.75em;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }
        .ProseMirror ul { list-style-type: disc; }
        .ProseMirror ol { list-style-type: decimal; }
        .ProseMirror h1 { font-size: 1.8em; font-weight: bold; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: bold; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: bold; }
        .ProseMirror blockquote {
          border-left: 3px solid rgba(255, 248, 226, 0.45);
          padding-left: 1em;
          color: #FFF8E2;
          font-style: italic;
        }
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid rgba(255, 248, 226, 0.35);
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid rgba(255, 248, 226, 0.35);
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: rgba(255, 248, 226, 0.12);
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
      `}</style>
        </div>
    );
}
