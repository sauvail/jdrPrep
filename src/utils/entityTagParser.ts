import { Entity } from '../types';

export interface EntityTag {
  fullMatch: string;
  entityId: string;
  displayText: string | null;
}

/**
 * Parses entity tags from markdown text
 * Format: @(entityId)[optional display text]
 * Examples:
 *   @(jean)[] -> links to entity with id 'jean', displays entity name
 *   @(gobelins)[lulu le gobelin] -> links to entity with id 'gobelins', displays 'lulu le gobelin'
 */
export function parseEntityTags(text: string): EntityTag[] {
  const regex = /@\(([^)]+)\)\[([^\]]*)\]/g;
  const tags: EntityTag[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    tags.push({
      fullMatch: match[0],
      entityId: match[1],
      displayText: match[2] || null,
    });
  }

  return tags;
}

/**
 * Replaces entity tags in markdown with HTML links
 */
export function replaceEntityTags(text: string, entities: Entity[]): string {
  const tags = parseEntityTags(text);
  let result = text;

  // Create a map for quick entity lookup
  const entityMap = new Map(entities.map(e => [e.id, e]));

  // Replace tags in reverse order to preserve string indices
  const sortedTags = [...tags].sort((a, b) =>
    text.lastIndexOf(b.fullMatch) - text.lastIndexOf(a.fullMatch)
  );

  for (const tag of sortedTags) {
    const entity = entityMap.get(tag.entityId);
    const displayName = tag.displayText || (entity ? entity.name : tag.entityId);
    const title = entity ? entity.name : tag.entityId;

    // Create a span with data attributes instead of an actual link
    // This prevents navigation but allows styling and potential future interactivity
    const replacement = `<span class="entity-tag" data-entity-id="${tag.entityId}" title="${title}">${displayName}</span>`;

    result = result.replace(tag.fullMatch, replacement);
  }

  return result;
}
