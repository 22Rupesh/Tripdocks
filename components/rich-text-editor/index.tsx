

'use client'

import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { MenuBar } from "./menu-bar";
import TextAlign from '@tiptap/extension-text-align'
import Highlight from "@tiptap/extension-highlight";
import { VARIABLES } from './constants';
import './rich-text-editor.css';
import { Node, mergeAttributes } from '@tiptap/core';
import { Variable } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const initialContent = `Hello {{user_name}},<br/>  
Welcome to **{{company}}**!<br/>  

Your email address is: *{{email}}*<br/>  
Today's date is: **{{date}}**<br/>  

You are currently on the **{{subscription_plan}}** plan,<br/>  
with an account balance of **{{account_balance}}**.<br/>  

For support, contact us at: **{{support_phone}}**<br/>  
Visit our website: [Click Here]({{website_url}})<br/>  

Thank you for choosing us!<br/>
Please press Enter`;

const VariableNode = Node.create({
    name: 'variable',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: { default: null },
            label: { default: null },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span.variable-token',
            },
        ];
    },

    renderHTML({ node }) {
        return [
            'span',
            mergeAttributes({ class: 'variable-token', 'data-id': node.attrs.id }),
            `${node.attrs.label}`,
            ['span', { class: 'remove-variable', onclick: 'removeVariable(event)' }, '×']
        ];
    },
});

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
    const [showPopover, setShowPopover] = useState(false);
    const [filteredVars, setFilteredVars] = useState(VARIABLES);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { HTMLAttributes: { class: "list-disc ml-3" } },
                orderedList: { HTMLAttributes: { class: "list-decimal ml-3" } },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight,
            VariableNode,
        ],
        content: initialContent,
        editorProps: {
            attributes: { class: "min-h-[156px] border rounded-md bg-slate-50 py-2 px-3 " },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onTransaction: ({ editor }) => {
            const text = editor?.getText() || "";
            const match = text.match(/\{\{([^}]+)?$/);
            if (match) {
                const { from } = editor.state.selection;
                const coords = editor.view.coordsAtPos(from);
                setPosition({ top: coords.top + 20, left: coords.left });
                setFilteredVars(VARIABLES);
                setShowPopover(true);
            } else {
                setShowPopover(false);
            }
        }
    });

 

    const insertVariable = (variable: { id: any; label?: string; value?: string; }) => {
        editor?.chain().focus().insertContent(
            `<span class='variable-token' data-id='${variable.id}' contenteditable='false'>${variable.id} <span class='remove-variable'>&times;</span></span>`
        ).run();
        setShowPopover(false);
    };

    const removeVariable = (event: { target: { parentNode: { remove: () => void; }; }; }) => {
        event.target.parentNode.remove();
    };

    const exportContent = () => {
        if (!editor) return;
        const rawContent = editor.getHTML();
        const processedContent = renderProcessedContent(rawContent);
        const blob = new Blob([JSON.stringify({ raw: rawContent, processed: processedContent }, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'editor-content.json';
        link.click();
    };

    const renderProcessedContent = (content: string) => {
        return content.replace(/\{\{(.*?)\}\}/g, (match: any, variableName: string) => {
            const foundVar = VARIABLES.find(v => v.id === variableName);
            return foundVar ? foundVar.value.replace(/\{\{(.*?)\}\}/g, '$1') : match;
        });
    };

    return (
        <div>
            <div>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </div>
            <div className="editor-container">
                <EditorContent editor={editor} />
                {showPopover && (
                    <div className="popover" style={{ top: position.top, left: position.left }}>
                        {filteredVars.map((variable) => (
                            <div key={variable.id} className="popover-item" onClick={() => insertVariable(variable)}>
                                {variable.id}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="output-container">
                <h3>Output:</h3>
                <div dangerouslySetInnerHTML={{ __html: renderProcessedContent(content || "") }} />
            </div>
            <button
                onClick={exportContent}
                className="export-button bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300"
            >
                Export Content
            </button>

        </div>
    );
}