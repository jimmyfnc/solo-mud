import { closeDatabase } from './database';
import { writePortableBackup } from './portable-backup';

const destination = process.argv[2] ?? 'data/solo-mud-backup.json';

try {
  const outputPath = writePortableBackup(destination);
  console.log(`Portable database backup written to ${outputPath}`);
} finally {
  closeDatabase();
}
