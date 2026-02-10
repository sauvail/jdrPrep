import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Entity } from '../types';
import { replaceEntityTags } from '../utils/entityTagParser';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  entities?: Entity[];
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description (supports markdown)...',
  rows = 6,
  entities = []
}) => {
  // Parse markdown to HTML
  const getMarkdownPreview = () => {
    if (!value) return '<p class="markdown-placeholder">Preview will appear here...</p>';
    try {
      // First replace entity tags, then parse markdown
      const textWithEntityTags = replaceEntityTags(value, entities);
      const rawHTML = marked.parse(textWithEntityTags) as string;
      return DOMPurify.sanitize(rawHTML);
    } catch (error) {
      return '<p class="markdown-error">Error parsing markdown</p>';
    }
  };

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-container">
        <div className="markdown-editor-section">
          <label className="markdown-section-label">Edit (Markdown)</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="markdown-textarea"
          />
        </div>
        <div className="markdown-preview-section">
          <label className="markdown-section-label">Preview</label>
          <div 
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: getMarkdownPreview() }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
