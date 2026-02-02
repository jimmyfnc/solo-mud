import { describe, it, expect } from 'vitest';
import { parseCommand, isPropVerb, PROP_VERBS } from './parser';

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

  describe('prop verbs', () => {
    it('should parse simple prop verb with target', () => {
      const result = parseCommand('sit bench');
      expect(result.command).toBe('sit');
      expect(result.target).toBe('bench');
    });

    it('should parse "pet cat"', () => {
      const result = parseCommand('pet cat');
      expect(result.command).toBe('pet');
      expect(result.target).toBe('cat');
    });

    it('should parse "use fireplace"', () => {
      const result = parseCommand('use fireplace');
      expect(result.command).toBe('use');
      expect(result.target).toBe('fireplace');
    });

    it('should parse "push lever"', () => {
      const result = parseCommand('push lever');
      expect(result.command).toBe('push');
      expect(result.target).toBe('lever');
    });

    it('should parse "smell flowers"', () => {
      const result = parseCommand('smell flowers');
      expect(result.command).toBe('smell');
      expect(result.target).toBe('flowers');
    });

    describe('prop verbs with item pattern', () => {
      it('should parse "toss coin well" with item', () => {
        const result = parseCommand('toss coin well');
        expect(result.command).toBe('toss');
        expect(result.target).toBe('well');
        expect(result.item).toBe('coin');
      });

      it('should parse "throw rock window"', () => {
        const result = parseCommand('throw rock window');
        expect(result.command).toBe('throw');
        expect(result.target).toBe('window');
        expect(result.item).toBe('rock');
      });

      it('should parse "offer bread altar"', () => {
        const result = parseCommand('offer bread altar');
        expect(result.command).toBe('offer');
        expect(result.target).toBe('altar');
        expect(result.item).toBe('bread');
      });

      it('should parse "feed meat dog"', () => {
        const result = parseCommand('feed meat dog');
        expect(result.command).toBe('feed');
        expect(result.target).toBe('dog');
        expect(result.item).toBe('meat');
      });

      it('should parse "toss coin into well" with preposition', () => {
        const result = parseCommand('toss coin into well');
        expect(result.command).toBe('toss');
        expect(result.target).toBe('well');
        expect(result.item).toBe('coin');
      });

      it('should parse "offer bread to altar" with preposition', () => {
        const result = parseCommand('offer bread to altar');
        expect(result.command).toBe('offer');
        expect(result.target).toBe('altar');
        expect(result.item).toBe('bread');
      });

      it('should parse "donate gold to shrine" with preposition', () => {
        const result = parseCommand('donate gold to shrine');
        expect(result.command).toBe('donate');
        expect(result.target).toBe('shrine');
        expect(result.item).toBe('gold');
      });

      it('should parse multi-word target "toss coin wishing well"', () => {
        const result = parseCommand('toss coin wishing well');
        expect(result.command).toBe('toss');
        expect(result.target).toBe('wishing well');
        expect(result.item).toBe('coin');
      });

      it('should parse multi-word item with preposition "offer fresh bread to altar"', () => {
        const result = parseCommand('offer fresh bread to altar');
        expect(result.command).toBe('offer');
        expect(result.target).toBe('altar');
        expect(result.item).toBe('fresh bread');
      });
    });

    describe('existing commands should not break', () => {
      it('should still handle attack as before', () => {
        const result = parseCommand('attack goblin');
        expect(result.command).toBe('attack');
        expect(result.target).toBe('goblin');
        expect(result.item).toBeUndefined();
      });

      it('should still handle look as before', () => {
        const result = parseCommand('look sword');
        expect(result.command).toBe('look');
        expect(result.target).toBe('sword');
        expect(result.item).toBeUndefined();
      });

      it('should still handle examine as before', () => {
        const result = parseCommand('examine chest');
        expect(result.command).toBe('examine');
        expect(result.target).toBe('chest');
        expect(result.item).toBeUndefined();
      });

      it('should still handle drink as before (non-item verb)', () => {
        const result = parseCommand('drink potion');
        expect(result.command).toBe('drink');
        expect(result.target).toBe('potion');
        expect(result.item).toBeUndefined();
      });

      it('should still handle take from syntax', () => {
        const result = parseCommand('take sword from corpse');
        expect(result.command).toBe('take');
        expect(result.target).toBe('sword');
        expect(result.source).toBe('corpse');
      });
    });
  });

  describe('isPropVerb', () => {
    it('should return true for prop verbs', () => {
      expect(isPropVerb('sit')).toBe(true);
      expect(isPropVerb('pet')).toBe(true);
      expect(isPropVerb('push')).toBe(true);
      expect(isPropVerb('toss')).toBe(true);
      expect(isPropVerb('smell')).toBe(true);
    });

    it('should return false for non-prop verbs', () => {
      expect(isPropVerb('go')).toBe(false);
      expect(isPropVerb('inventory')).toBe(false);
      expect(isPropVerb('cast')).toBe(false);
    });
  });

  describe('PROP_VERBS array', () => {
    it('should contain expected verbs', () => {
      expect(PROP_VERBS).toContain('use');
      expect(PROP_VERBS).toContain('sit');
      expect(PROP_VERBS).toContain('push');
      expect(PROP_VERBS).toContain('pet');
      expect(PROP_VERBS).toContain('toss');
      expect(PROP_VERBS).toContain('smell');
      expect(PROP_VERBS).toContain('pray');
    });
  });
});
