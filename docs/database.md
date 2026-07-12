# Database Strategy

Solo MUD currently uses SQLite through `better-sqlite3`. This is intentional for local development and a single-server deployment: setup is minimal, backups are simple, and synchronous transactions fit the current game loop.

## Schema Migrations

The `schema_migrations` table records the installed schema baseline. Future schema changes should receive a stable migration ID and remain backward compatible with existing local databases.

## Portable Exports

Export all durable data to database-neutral JSON:

```bash
pnpm --filter @solo-mud/server db:export -- ../../backups/solo-mud.json
```

The export includes players, characters, character world state, banks, and the shared-world snapshot. Keep exports private because player recovery codes are credentials until a login system replaces them.

## Moving Beyond SQLite

Do not point the current repositories directly at PostgreSQL or MySQL; they use synchronous SQLite APIs and SQL dialect features. The safe migration sequence is:

1. Export a portable JSON backup.
2. Add an asynchronous storage adapter for the target database.
3. Import each exported table through that adapter in foreign-key order.
4. Run dual-read verification before switching production traffic.

SQLite remains the supported runtime database for now. The portable format prevents data lock-in while avoiding a premature distributed-database abstraction.
