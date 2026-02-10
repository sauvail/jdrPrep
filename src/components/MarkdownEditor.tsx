import React, { useState, useRef, useEffect } from 'react';
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

interface AutocompleteState {
  show: boolean;
  query: string;
  position: { top: number; left: number };
  cursorPosition: number;
  selectedIndex: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description (supports markdown)...',
  rows = 6,
  entities = []
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
    show: false,
    query: '',
    position: { top: 0, left: 0 },
    cursorPosition: 0,
    selectedIndex: 0
  });

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

  // Get filtered entities based on query
  const getFilteredEntities = (): Entity[] => {
    if (!autocomplete.query) return entities;
    const lowerQuery = autocomplete.query.toLowerCase();
    return entities.filter(
      entity =>
        entity.id.toLowerCase().includes(lowerQuery) ||
        entity.name.toLowerCase().includes(lowerQuery)
    );
  };

  // Calculate autocomplete position
  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);

    // Copy textarea styles to div
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border'].forEach(prop => {
      div.style[prop as any] = style[prop as any];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.width = element.offsetWidth + 'px';

    const textBeforeCaret = element.value.substring(0, position);
    div.textContent = textBeforeCaret;

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);

    const coordinates = {
      top: span.offsetTop,
      left: span.offsetLeft
    };

    document.body.removeChild(div);
    return coordinates;
  };

  // Handle input changes and detect @( trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);

    // Check if we should show autocomplete
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const match = textBeforeCursor.match(/@\(([^)]*?)$/);

    if (match && textareaRef.current) {
      const query = match[1];
      const coords = getCaretCoordinates(textareaRef.current, cursorPos);

      setAutocomplete({
        show: true,
        query,
        position: {
          top: coords.top + 20,
          left: coords.left
        },
        cursorPosition: cursorPos - query.length - 2, // Position of @(
        selectedIndex: 0
      });
    } else {
      setAutocomplete(prev => ({ ...prev, show: false }));
    }
  };

  // Insert entity tag at cursor
  const insertEntity = (entity: Entity) => {
    if (!textareaRef.current) return;

    const beforeTag = value.substring(0, autocomplete.cursorPosition);
    const afterCursor = value.substring(textareaRef.current.selectionStart);
    const entityTag = `@(${entity.id})[]`;
    const newValue = beforeTag + entityTag + afterCursor;
    const newCursorPos = autocomplete.cursorPosition + entityTag.length;

    onChange(newValue);
    setAutocomplete(prev => ({ ...prev, show: false }));

    // Set cursor position after insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autocomplete.show) return;

    const filteredEntities = getFilteredEntities();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocomplete(prev => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, filteredEntities.length - 1)
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocomplete(prev => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0)
      }));
    } else if (e.key === 'Enter' && filteredEntities.length > 0) {
      e.preventDefault();
      insertEntity(filteredEntities[autocomplete.selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAutocomplete(prev => ({ ...prev, show: false }));
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setAutocomplete(prev => ({ ...prev, show: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (autocomplete.show && autocompleteRef.current) {
      const selectedItem = autocompleteRef.current.querySelector('.autocomplete-item-selected');
      if (selectedItem && typeof selectedItem.scrollIntoView === 'function') {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [autocomplete.selectedIndex, autocomplete.show]);

  const filteredEntities = getFilteredEntities();

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-container">
        <div className="markdown-editor-section">
          <label className="markdown-section-label">Edit (Markdown)</label>
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              className="markdown-textarea"
            />
            {autocomplete.show && filteredEntities.length > 0 && (
              <div
                ref={autocompleteRef}
                className="entity-autocomplete"
                style={{
                  top: autocomplete.position.top,
                  left: autocomplete.position.left
                }}
              >
                {filteredEntities.map((entity, index) => (
                  <div
                    key={entity.id}
                    className={`autocomplete-item ${index === autocomplete.selectedIndex ? 'autocomplete-item-selected' : ''}`}
                    onClick={() => insertEntity(entity)}
                    onMouseEnter={() => setAutocomplete(prev => ({ ...prev, selectedIndex: index }))}
                  >
                    <div className="autocomplete-item-name">{entity.name}</div>
                    <div className="autocomplete-item-id">@({entity.id})</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
