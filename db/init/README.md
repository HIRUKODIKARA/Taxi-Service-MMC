# Database seed

Any `*.sql` / `*.sh` file in this directory runs **once**, in filename order, the
first time the production MySQL container starts on an **empty** data volume
(`docker-entrypoint-initdb.d`). On later boots it is ignored.

This is how a fresh production server gets the schema, roles, permissions and the
admin login — the dev box's pre-seeded volume does not exist on the prod server.

## Generating the seed

On the dev box (where the seeded DB is running), dump it into `01-seed.sql`:

```bash
docker exec taxi-service-mmc-mysql-1 \
  mysqldump -u root -p<root_password> \
  --databases mmc_taxi_db \
  --single-transaction --routines --triggers --no-tablespaces \
  > db/init/01-seed.sql
```

Commit `db/init/01-seed.sql` (or copy it to the prod server) before the first
`docker compose -f docker-compose.prod.yml up`.

> Re-seeding later: `docker compose -f docker-compose.prod.yml down -v` drops the
> volume so the next `up` re-runs these scripts. **This deletes all prod data** —
> only do it intentionally.
