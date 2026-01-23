import { describe, it, expect } from 'vitest';
import { parseCommand, type ParsedCommand } from './parser';

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
});
