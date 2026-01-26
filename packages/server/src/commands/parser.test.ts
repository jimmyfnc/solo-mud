import { describe, it, expect } from 'vitest';
import { parseCommand } from './parser';

describe('parseCommand', () => {
  it('should parse a single word command', () => {
    const result = parseCommand('look');

    expect(result.command).toBe('look');
    expect(result.args).toEqual([]);
    expect(result.raw).toBe('look');
  });

  it('should parse command with single argument', () => {
    const result = parseCommand('go north');

    expect(result.command).toBe('go');
    expect(result.args).toEqual(['north']);
  });

  it('should parse command with multiple arguments', () => {
    const result = parseCommand('give sword to guard');

    expect(result.command).toBe('give');
    expect(result.args).toEqual(['sword', 'to', 'guard']);
  });

  it('should normalize command to lowercase', () => {
    const result = parseCommand('LOOK');

    expect(result.command).toBe('look');
  });

  it('should preserve argument case for names', () => {
    const result = parseCommand('say Hello World');

    expect(result.command).toBe('say');
    expect(result.args).toEqual(['Hello', 'World']);
  });

  it('should trim whitespace', () => {
    const result = parseCommand('  look  ');

    expect(result.command).toBe('look');
    expect(result.args).toEqual([]);
  });

  it('should handle multiple spaces between words', () => {
    const result = parseCommand('go    north');

    expect(result.command).toBe('go');
    expect(result.args).toEqual(['north']);
  });

  it('should return empty command for empty input', () => {
    const result = parseCommand('');

    expect(result.command).toBe('');
    expect(result.args).toEqual([]);
  });

  it('should handle direction shortcuts', () => {
    expect(parseCommand('n').command).toBe('north');
    expect(parseCommand('s').command).toBe('south');
    expect(parseCommand('e').command).toBe('east');
    expect(parseCommand('w').command).toBe('west');
    expect(parseCommand('u').command).toBe('up');
    expect(parseCommand('d').command).toBe('down');
  });

  it('should handle command aliases', () => {
    expect(parseCommand('l').command).toBe('look');
    expect(parseCommand('i').command).toBe('inventory');
    expect(parseCommand('inv').command).toBe('inventory');
    expect(parseCommand('get').command).toBe('take');
    expect(parseCommand('exam').command).toBe('examine');
  });

  it('should provide target from first argument', () => {
    const result = parseCommand('attack goblin');

    expect(result.target).toBe('goblin');
  });

  it('should handle quoted strings as single argument', () => {
    const result = parseCommand('say "hello world"');

    expect(result.command).toBe('say');
    expect(result.args).toEqual(['hello world']);
  });

  describe('take from syntax', () => {
    it('should parse "take X from Y" with source field', () => {
      const result = parseCommand('take dagger from corpse');

      expect(result.command).toBe('take');
      expect(result.target).toBe('dagger');
      expect(result.source).toBe('corpse');
    });

    it('should parse "get X from Y" as take with source', () => {
      const result = parseCommand('get sword from wolf');

      expect(result.command).toBe('take');
      expect(result.target).toBe('sword');
      expect(result.source).toBe('wolf');
    });

    it('should parse "take all from corpse"', () => {
      const result = parseCommand('take all from corpse');

      expect(result.command).toBe('take');
      expect(result.target).toBe('all');
      expect(result.source).toBe('corpse');
    });

    it('should parse "take 1 from corpse" (by number)', () => {
      const result = parseCommand('take 1 from corpse');

      expect(result.command).toBe('take');
      expect(result.target).toBe('1');
      expect(result.source).toBe('corpse');
    });

    it('should handle multi-word source', () => {
      const result = parseCommand('take gold from dead wolf');

      expect(result.command).toBe('take');
      expect(result.target).toBe('gold');
      expect(result.source).toBe('dead wolf');
    });

    it('should handle multi-word target', () => {
      const result = parseCommand('take rusty dagger from corpse');

      expect(result.command).toBe('take');
      expect(result.target).toBe('rusty dagger');
      expect(result.source).toBe('corpse');
    });

    it('should not set source for simple take command', () => {
      const result = parseCommand('take sword');

      expect(result.command).toBe('take');
      expect(result.target).toBe('sword');
      expect(result.source).toBeUndefined();
    });
  });

  describe('talk command', () => {
    it('should parse "talk mira"', () => {
      const result = parseCommand('talk mira');
      expect(result.command).toBe('talk');
      expect(result.target).toBe('mira');
    });

    it('should parse "talk to mira"', () => {
      const result = parseCommand('talk to mira');
      expect(result.command).toBe('talk');
      expect(result.target).toBe('mira');
    });
  });
});
