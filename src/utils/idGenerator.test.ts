import { describe, it, expect } from 'vitest';
import { generateId } from './idGenerator';

describe('ID Generator', () => {
  it('should generate ID with correct prefix', () => {
    const id = generateId('test');
    expect(id).toContain('test_');
  });

  it('should generate unique IDs', () => {
    const id1 = generateId('entity');
    const id2 = generateId('entity');

    expect(id1).not.toBe(id2);
  });

  it('should include timestamp in ID', () => {
    const beforeTime = Date.now();
    const id = generateId('test');
    const afterTime = Date.now();

    const parts = id.split('_');
    expect(parts).toHaveLength(3);

    const timestamp = parseInt(parts[1]);
    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(timestamp).toBeLessThanOrEqual(afterTime);
  });

  it('should include random string in ID', () => {
    const id = generateId('test');
    const parts = id.split('_');

    expect(parts).toHaveLength(3);
    expect(parts[2]).toMatch(/^[a-z0-9]+$/);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('should work with different prefixes', () => {
    const prefixes = ['character', 'location', 'quest', 'map', 'campaign'];

    prefixes.forEach(prefix => {
      const id = generateId(prefix);
      expect(id).toContain(`${prefix}_`);
    });
  });

  it('should generate IDs that are different even when called rapidly', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId('test'));
    }

    // All IDs should be unique
    expect(ids.size).toBe(100);
  });
});
