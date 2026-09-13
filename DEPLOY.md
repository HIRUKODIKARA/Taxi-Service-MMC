# Production deployment

The production stack runs three built containers behind **your existing reverse
proxy** (which terminates TLS for `taxi.mmck.lk`):

```
Internet ──TLS──> your nginx/Caddy ──http──> frontend (nginx, host :8080)
                                                 ├─ serves the built React SPA
                                                 └─ /api ──> api (.NET, :8080) ──> mysql
```

Same-origin by design — the browser only ever talks to `taxi.mmck.lk`, so no CORS.

## 1. One-time: generate the DB seed

The prod server starts MySQL on a fresh volume and seeds it from `db/init/*.sql`.
Create that dump on the dev box (see [db/init/README.md](db/init/README.md)):

```bash
docker exec taxi-service-mmc-mysql-1 \
  mysqldump -u root -p<root_password> \
  --databases mmc_taxi_db \
  --single-transaction --routines --triggers --no-tablespaces \
  > db/init/01-seed.sql
```

## 2. On the production server

```bash
git clone <repo> && cd Taxi-Service-MMC
cp .env.example .env        # then edit .env — set strong secrets
docker compose -f docker-compose.prod.yml up -d --build
```

Required `.env` values: `JWT_KEY`, `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`
(and optionally `APP_PORT`, default 8080). Generate secrets with
`openssl rand -base64 48`.

## 3. Point your reverse proxy at it

Forward `taxi.mmck.lk` to `http://127.0.0.1:${APP_PORT}` (default 8080). Example
nginx server block:

```nginx
server {
    server_name taxi.mmck.lk;
    # ... your TLS / certbot config ...
    client_max_body_size 25m;          # allow document uploads
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`taxi.mmck.lk` is already in `allowedHosts` for the dev server; the production
build is static files so that setting does not apply there.

## Operations

| Task | Command |
|------|---------|
| Logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| Update to latest code | `git pull && docker compose -f docker-compose.prod.yml up -d --build` |
| Stop (keep data) | `docker compose -f docker-compose.prod.yml down` |
| Stop + **wipe DB** | `docker compose -f docker-compose.prod.yml down -v` |

Persistent data lives in the `mmc-taxi-prod-db` (database) and `api-uploads`
(driver documents / vehicle photos) volumes.

## Still worth doing before heavy production use

- **HTTPS inside the API**: `RequireHttpsMetadata=false` and the HTTPS redirect is
  commented out in `Program.cs`. That's fine behind a TLS-terminating proxy, but
  make sure the proxy enforces HTTPS.
- **EF migrations**: the schema currently comes from a SQL dump, not versioned
  migrations. Consider adding EF Core migrations so schema changes are repeatable.
- **Backups**: schedule `mysqldump` of the `mmc-taxi-prod-db` volume.
