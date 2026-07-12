import { afterEach, describe, expect, it } from 'vitest';
import { adminCommandsEnabled } from './runtime';

const originalNodeEnv = process.env['NODE_ENV'];
const originalAdminSetting = process.env['ENABLE_ADMIN_COMMANDS'];

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env['NODE_ENV'];
  else process.env['NODE_ENV'] = originalNodeEnv;

  if (originalAdminSetting === undefined) delete process.env['ENABLE_ADMIN_COMMANDS'];
  else process.env['ENABLE_ADMIN_COMMANDS'] = originalAdminSetting;
});

describe('adminCommandsEnabled', () => {
  it('allows admin commands during local development', () => {
    process.env['NODE_ENV'] = 'development';
    delete process.env['ENABLE_ADMIN_COMMANDS'];
    expect(adminCommandsEnabled()).toBe(true);
  });

  it('disables admin commands by default in production', () => {
    process.env['NODE_ENV'] = 'production';
    delete process.env['ENABLE_ADMIN_COMMANDS'];
    expect(adminCommandsEnabled()).toBe(false);
  });

  it('supports an explicit production override', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['ENABLE_ADMIN_COMMANDS'] = 'true';
    expect(adminCommandsEnabled()).toBe(true);
  });
});
