function readPositiveInteger(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const MAX_COMMAND_LENGTH = readPositiveInteger('MAX_COMMAND_LENGTH', 500);
export const MAX_TELNET_BUFFER_LENGTH = readPositiveInteger('MAX_TELNET_BUFFER_LENGTH', 8192);

export function adminCommandsEnabled(): boolean {
  const configured = process.env['ENABLE_ADMIN_COMMANDS'];
  if (configured !== undefined) {
    return configured.toLowerCase() === 'true';
  }
  return process.env['NODE_ENV'] !== 'production';
}
