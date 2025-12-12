import { describe, it, expect } from 'vitest';
import { validateFactObject } from '../src/utils';

describe('validateFactObject', () => {
  it('returns true for a valid fact object with source', () => {
    const obj = { fact: 'Paris was the capital of the Kingdom of the Franks in X year', source_url: 'https://example.org', source_title: 'Example' };
    expect(validateFactObject(obj)).toBe(true);
  });

  it('returns true for a valid fact object without source fields', () => {
    const obj = { fact: 'Some obscure geographic fact.' };
    expect(validateFactObject(obj)).toBe(true);
  });

  it('returns false for missing fact', () => {
    expect(validateFactObject({})).toBe(false);
  });

  it('returns false for non-string fact', () => {
    expect(validateFactObject({ fact: 123 })).toBe(false);
  });

  it('returns false for non-string source fields', () => {
    expect(validateFactObject({ fact: 'a', source_url: 12 })).toBe(false);
  });

  it('returns false for whitespace fact', () => {
    expect(validateFactObject({ fact: '   ' })).toBe(false);
  });
});
