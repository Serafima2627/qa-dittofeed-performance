# qa-dittofeed-performance

Performance testing of Dittofeed Lite using k6.

## 1. Objective

The purpose of this project is to deploy Dittofeed Lite in a reproducible test environment and evaluate its performance under different workload profiles.

The testing will cover:

* smoke testing;
* load testing;
* stress testing;
* spike testing;
* soak testing;
* end-to-end processing verification;
* resource monitoring during load.

The main performance indicators will include HTTP latency, throughput, error rate, end-to-end processing time, CPU usage, memory usage, and possible OOM events.

> Only synthetic test data is used in this project. No production or real customer data is used.

## 2. Test Environment

The project is executed in GitHub Codespaces.

Environment:

* Platform: GitHub Codespaces
* OS: Linux
* Git: 2.53.0
* Docker: 29.3.0-1
* Docker Compose: v2.40.3
* Dittofeed commit: `52b2bee909744d07dd5d409fd3974d4b95c66766`
* Deployment mode: Dittofeed Lite

The environment was moved to GitHub Codespaces because the local macOS environment had compatibility problems with Docker and Homebrew dependencies.

## 3. Dittofeed Lite Deployment

The Dittofeed repository was prepared separately in:

```bash
cd ~/dittofeed
```

The Lite deployment is managed using:

```bash
docker compose -f docker-compose.lite.yaml
```

The main services are:

* Dittofeed Lite
* PostgreSQL 15
* ClickHouse 24.12.6.70
* Temporal 1.22.4

The environment configuration was prepared using `.env`.

Before starting the services, the Docker Compose configuration was validated:

```bash
docker compose -f docker-compose.lite.yaml config
```

The services were started with:

```bash
docker compose -f docker-compose.lite.yaml up -d
```

Container status was checked using:

```bash
docker compose -f docker-compose.lite.yaml ps
```

The following containers were successfully started:

```text
dittofeed-lite-1
dittofeed-postgres-1
dittofeed-clickhouse-server-1
temporal
```

Exposed ports include:

| Port | Service                               |
| ---- | ------------------------------------- |
| 3000 | Dittofeed Lite                        |
| 5432 | PostgreSQL                            |
| 7233 | Temporal                              |
| 8123 | ClickHouse HTTP                       |
| 9000 | ClickHouse native protocol            |
| 9009 | ClickHouse inter-server communication |

## 4. Configuration Issue — DASHBOARD_API_BASE

### Problem

After Dittofeed Lite was started in GitHub Codespaces, the Docker Compose configuration contained:

```text
DASHBOARD_API_BASE=http://localhost:3000
```

The application itself was running inside Codespaces, while browser access was performed through the GitHub Codespaces forwarded HTTPS URL.

The Codespace environment values were checked with:

```bash
echo $CODESPACE_NAME
echo $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
```

Result:

```text
CODESPACE_NAME=improved-guide-qj6r75qw6qfx496
GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN=app.github.dev
```

Therefore, the forwarded URL for port `3000` was:

```text
https://improved-guide-qj6r75qw6qfx496-3000.app.github.dev
```

### Solution

The previous `DASHBOARD_API_BASE` value was removed from `.env`:

```bash
sed -i '/^DASHBOARD_API_BASE=/d' .env
```

The correct Codespaces URL was added:

```bash
echo 'DASHBOARD_API_BASE=https://improved-guide-qj6r75qw6qfx496-3000.app.github.dev' >> .env
```

The configuration was verified:

```bash
grep '^DASHBOARD_API_BASE=' .env
```

Result:

```text
DASHBOARD_API_BASE=https://improved-guide-qj6r75qw6qfx496-3000.app.github.dev
```

The Dittofeed Lite container was then recreated so that the updated environment variable would be applied:

```bash
docker compose -f docker-compose.lite.yaml up -d --force-recreate lite
```

The value inside the running container was verified:

```bash
docker inspect dittofeed-lite-1 \
  --format='{{range .Config.Env}}{{println .}}{{end}}' \
  | grep DASHBOARD_API_BASE
```

Result:

```text
DASHBOARD_API_BASE=https://improved-guide-qj6r75qw6qfx496-3000.app.github.dev
```

## 5. Deployment Verification

After recreating the container, the service status was checked again:

```bash
docker compose -f docker-compose.lite.yaml ps
```

All required services were in the `Up` state.

A Docker Compose warning was observed:

```text
the attribute `version` is obsolete, it will be ignored
```

This warning did not prevent the environment from starting successfully.

### HTTP availability

The Dittofeed endpoint was checked from the Codespace:

```bash
curl -I http://localhost:3000
```

Result:

```text
HTTP/1.1 307 Temporary Redirect
location: /dashboard
```

The response confirmed that the application was available on port `3000` and redirected requests to the dashboard.

### UI verification

The application was opened through the forwarded Codespaces URL.

The Dittofeed login page loaded successfully.

The configured admin password was used to authenticate.

After authentication, the Dittofeed dashboard loaded successfully and application sections such as Journeys, Users, Segments, Events, Deliveries, and Analysis were available.

This confirmed that the Dittofeed Lite environment was operational before starting performance testing.

## 6. Issues Encountered

### Local Docker environment

Initial setup was attempted on a local Apple Silicon Mac.

The local environment had compatibility issues involving:

* an older macOS version;
* Docker Desktop compatibility;
* Homebrew support;
* Colima/QEMU dependencies.

To avoid spending additional time modifying the local workstation, the test environment was moved to GitHub Codespaces.

### Obsolete Docker Compose version attribute

Docker Compose reports:

```text
the attribute `version` is obsolete
```

The warning is non-blocking and does not affect the current deployment.

### Incorrect dashboard base URL

`DASHBOARD_API_BASE` initially pointed to `http://localhost:3000`.

It was changed to the GitHub Codespaces forwarded HTTPS URL and the Lite container was recreated.

## 7. Current Status

Completed:

* [x] Prepare test environment
* [x] Prepare Dittofeed Lite configuration
* [x] Start Docker Compose services
* [x] Verify required containers
* [x] Configure Codespaces forwarded URL
* [x] Verify Dittofeed HTTP response
* [x] Verify Dittofeed UI
* [x] Authenticate successfully

Next:

* [ ] Complete post-bootstrap configuration
* [ ] Register required user properties
* [ ] Prepare k6 environment
* [ ] Seed synthetic users
* [ ] Run smoke test
* [ ] Run load test
* [ ] Run stress test
* [ ] Run soak test
* [ ] Run spike test
* [ ] Collect Docker resource metrics
* [ ] Measure end-to-end processing time
* [ ] Check OOM events
* [ ] Compare configuration matrix
* [ ] Prepare charts
* [ ] Prepare final performance report

## References

* Dittofeed Documentation
* Grafana k6 Documentation
* GitHub Codespaces Documentation
