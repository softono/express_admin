# Models (read-only copy)

This folder is a verbatim copy of `express/src/models`. The `express` project
owns the Drizzle schema, migrations (`express/db/migrations`), and seeder —
this project runs NO migrations against the shared database.

When a model changes: change it in `express` first, run `db:generate`/`db:migrate`
there, then copy the updated files here.
