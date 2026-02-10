import { describe, it, expect } from 'vitest';
import { parseEntityTags, replaceEntityTags } from './entityTagParser';
import { Entity } from '../types';

describe('Entity Tag Parser', () => {
  describe('parseEntityTags', () => {
    it('should parse entity tag with display text', () => {
      const text = '@(gobelins)[lulu le gobelin]';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        fullMatch: '@(gobelins)[lulu le gobelin]',
        entityId: 'gobelins',
        displayText: 'lulu le gobelin',
      });
    });

    it('should parse entity tag without display text', () => {
      const text = '@(jean)[]';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        fullMatch: '@(jean)[]',
        entityId: 'jean',
        displayText: null,
      });
    });

    it('should parse multiple entity tags', () => {
      const text = 'Bob knows @(jean)[] and @(gobelins)[lulu le gobelin]';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(2);
      expect(tags[0].entityId).toBe('jean');
      expect(tags[1].entityId).toBe('gobelins');
    });

    it('should handle entity tags in markdown headings', () => {
      const text = '## Enemies\n\n@(jean)[]\n@(gobelins)[lulu le gobelin]';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(2);
    });

    it('should return empty array for text without tags', () => {
      const text = 'This is plain text without any tags';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(0);
    });

    it('should handle entity IDs with hyphens and underscores', () => {
      const text = '@(entity-id_123)[Test Entity]';
      const tags = parseEntityTags(text);

      expect(tags).toHaveLength(1);
      expect(tags[0].entityId).toBe('entity-id_123');
    });
  });

  describe('replaceEntityTags', () => {
    const mockEntities: Entity[] = [
      {
        id: 'jean',
        name: 'Jean the Brave',
        type: 'character',
        description: 'A brave warrior',
        connections: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'gobelins',
        name: 'Goblin Tribe',
        type: 'organization',
        description: 'A tribe of goblins',
        connections: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should replace entity tag with display text', () => {
      const text = '@(gobelins)[lulu le gobelin]';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('lulu le gobelin');
      expect(result).toContain('class="entity-tag"');
      expect(result).toContain('data-entity-id="gobelins"');
      expect(result).toContain('title="Goblin Tribe"');
    });

    it('should replace entity tag without display text using entity name', () => {
      const text = '@(jean)[]';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('Jean the Brave');
      expect(result).toContain('class="entity-tag"');
      expect(result).toContain('data-entity-id="jean"');
    });

    it('should handle entity tag for non-existent entity', () => {
      const text = '@(unknown)[Unknown Entity]';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('Unknown Entity');
      expect(result).toContain('data-entity-id="unknown"');
      expect(result).toContain('title="unknown"');
    });

    it('should handle entity tag for non-existent entity without display text', () => {
      const text = '@(unknown)[]';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('unknown');
      expect(result).toContain('data-entity-id="unknown"');
    });

    it('should replace multiple entity tags', () => {
      const text = 'Bob knows @(jean)[] and @(gobelins)[lulu le gobelin]';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('Jean the Brave');
      expect(result).toContain('lulu le gobelin');
      expect(result).toMatch(/class="entity-tag"/g);
    });

    it('should preserve surrounding text', () => {
      const text = 'Before @(jean)[] after';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toContain('Before');
      expect(result).toContain('after');
    });

    it('should handle text without entity tags', () => {
      const text = 'Plain text without tags';
      const result = replaceEntityTags(text, mockEntities);

      expect(result).toBe(text);
    });

    it('should work with empty entities array', () => {
      const text = '@(jean)[]';
      const result = replaceEntityTags(text, []);

      expect(result).toContain('jean');
      expect(result).toContain('class="entity-tag"');
    });
  });
});
