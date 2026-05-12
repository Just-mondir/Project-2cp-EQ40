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
import { useTranslations } from "next-intl";

const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded-md transition-all h-[32px] w-[32px] flex items-center justify-center
      ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      ${isActive ? "bg-[#432817]/10 text-[#432817]" : "hover:bg-[#E0D5C5]/40 text-[#8B7355]"}
    `}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-[1px] h-[24px] bg-[#E0D5C5]/60 mx-1" />;

export function TitleEditor({ value, onChange, placeholder }) {
    const t = useTranslations("auth.richTextEditor");
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, blockquote: false, bulletList: false, orderedList: false, codeBlock: false, horizontalRule: false }),
            Underline,
            Placeholder.configure({ placeholder: placeholder ?? t("placeholders.title") }),
        ],
        immediatelyRender: false,
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none rich-text-editor__content text-[#432817] px-3 py-2.5 text-[14px]",
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
            <div className="rich-text-editor__toolbar flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E0D5C5]/60 bg-[#FDFDFD]">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title={t("toolbar.bold")}><Bold size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title={t("toolbar.italic")}><Italic size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title={t("toolbar.underline")}><UnderlineIcon size={13} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title={t("toolbar.strikethrough")}><Strikethrough size={13} /></ToolbarButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = "180px" }) {
    const t = useTranslations("auth.richTextEditor");
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const headingMenuRef = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Placeholder.configure({ placeholder: placeholder ?? t("placeholders.content") }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
        ],
        immediatelyRender: false,
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none rich-text-editor__content text-[#432817] p-4 text-[14px]",
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

    const headingOptions = [
        { key: "paragraph", label: t("types.paragraph") },
        { key: "heading1", label: t("types.heading1"), level: 1 },
        { key: "heading2", label: t("types.heading2"), level: 2 },
        { key: "heading3", label: t("types.heading3"), level: 3 },
    ];

    const currentType = editor.isActive("heading", { level: 1 })
        ? "heading1"
        : editor.isActive("heading", { level: 2 })
            ? "heading2"
            : editor.isActive("heading", { level: 3 })
                ? "heading3"
                : "paragraph";

    return (
        <div className="rich-text-editor__surface w-full border border-[#E0D5C5] rounded-[10.75px] overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="rich-text-editor__toolbar flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[#E0D5C5]/60 bg-[#FDFDFD]">
                <div className="relative" ref={headingMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                        className="rich-text-editor__select flex items-center gap-2 px-3 h-[32px] rounded-md hover:bg-[#E0D5C5]/40 transition-colors text-[13px] text-[#432817] font-medium"
                    >
                        {headingOptions.find((option) => option.key === currentType)?.label}
                        <ChevronDown size={14} className={`transition-transform ${showHeadingMenu ? "rotate-180" : ""}`} />
                    </button>
                    {showHeadingMenu && (
                        <div className="absolute top-full left-0 mt-1 py-1 w-[140px] bg-white border border-[#E0D5C5] rounded-lg shadow-lg z-50">
                            {headingOptions.map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    onClick={() => {
                                        if (type.key === "paragraph") editor.commands.setParagraph();
                                        else editor.commands.toggleHeading({ level: type.level });
                                        setShowHeadingMenu(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[#432817]/5 ${currentType === type.key ? "text-[#8B6914] bg-[#432817]/5" : "text-[#432817]"}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title={t("toolbar.bold")}>
                    <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title={t("toolbar.italic")}>
                    <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title={t("toolbar.strikethrough")}>
                    <Strikethrough size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title={t("toolbar.underline")}>
                    <UnderlineIcon size={16} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title={t("toolbar.alignLeft")}>
                    <AlignLeft size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title={t("toolbar.alignCenter")}>
                    <AlignCenter size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title={t("toolbar.alignRight")}>
                    <AlignRight size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title={t("toolbar.alignJustify")}>
                    <AlignJustify size={16} />
                </ToolbarButton>

                <Divider />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title={t("toolbar.bulletList")}>
                    <List size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title={t("toolbar.orderedList")}>
                    <ListOrdered size={16} />
                </ToolbarButton>
            </div>

            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #A09080;
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
          border-left: 3px solid #E0D5C5;
          padding-left: 1em;
          color: #8B7355;
          font-style: italic;
        }
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid #E0D5C5;
        }
        .ProseMirror td, .ProseMirror th {
          min-width: 1em;
          border: 1px solid #E0D5C5;
          padding: 3px 5px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror th {
          font-weight: bold;
          text-align: left;
          background-color: #F7F5EF;
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
