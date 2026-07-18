# Containerized deployment

## Introduction

This document describes how to deploy Testaro in a container, using the reference `Dockerfile` and `docker-compose.yml` at the project root. It accompanies the evaluation requested in [issue 32](https://github.com/jrpool/testaro/issues/32).

Containerization is practical. The reference image runs every Testaro tool:

- The image is based on the official Playwright image (`mcr.microsoft.com/playwright`), which contains the Chromium, Firefox, and WebKit browsers and their system libraries, plus standard fonts, which keep page rendering consistent across hosts.
- QualWeb’s own (Puppeteer) Chromium is downloaded at image build time, pinned by `package-lock.json`.
- A headless Java runtime is installed for the `nuVnu` test, so `vnu-jar` does not download one over the network on first use.
- The `nuVal` test is pure HTTP; the reference Compose stack pairs Testaro with a self-hosted Nu Html Checker sidecar (`ghcr.io/validator/validator`) via the `TESTARO_NU_URL` environment variable, so it does not depend on the public W3C service (which is rate-limited and rejects large documents).
- The `wave` test calls an external API and needs only a `WAVE_KEY`.

## Version coupling

The tag of the base image in the `Dockerfile` (`mcr.microsoft.com/playwright:v1.60.0-noble`) must match the version of the `playwright` package in `package-lock.json`, so that the browsers baked into the image are the ones the installed Playwright expects. When upgrading Playwright, change both together.

## The Chromium sandbox

Chromium’s sandbox requires unprivileged user-namespace cloning, which the default Docker seccomp policy blocks (and which some hardened hosts prohibit even outside containers). There are two ways to run:

1. **Without the sandbox** (the image default): the `TESTARO_CHROMIUM_NO_SANDBOX=true` environment variable makes Testaro launch Playwright’s Chromium with `chromiumSandbox: false` and QualWeb’s Chromium with `--no-sandbox`. This is the usual choice when the container itself is the isolation boundary and only untrusted web content is being visited.
2. **With the sandbox**: set `TESTARO_CHROMIUM_NO_SANDBOX=false` and run the container with a seccomp profile that permits user-namespace cloning, such as [the profile published by Playwright](https://github.com/microsoft/playwright/blob/main/utils/docker/seccomp_profile.json):

    ```bash
    docker run --security-opt seccomp=seccomp_profile.json …
    ```

WebKit and Firefox are unaffected either way.

## Quick start with Compose

```bash
mkdir -p watch/jobs/todo watch/jobs/done watch/reports/raw
chmod -R a+w watch
docker compose up --build
```

This builds the image, starts the Nu Html Checker sidecar, and starts Testaro watching `watch/jobs/todo` (checking every 300 seconds, per the default command `node call dirWatch true 300`). Drop a job file into `watch/jobs/todo` on the host; the report appears in `watch/reports/raw`, and the job file moves to `watch/jobs/done`.

The container runs as the unprivileged `pwuser` from the Playwright base image, so the mounted host directories must be writable by that user (the `chmod` above, or `chown` to the matching UID).

## One-shot job

To perform a single job and exit:

```bash
docker compose run --rm testaro node call run
```

Or without Compose (no Nu sidecar; `nuVal` then uses the public W3C service):

```bash
docker build -t testaro .
docker run --rm --init \
  -v "$PWD/watch/jobs:/home/pwuser/testaro/watch/jobs" \
  -v "$PWD/watch/reports:/home/pwuser/testaro/watch/reports" \
  testaro node call run
```

## Server polling

To poll a server for jobs instead of watching a directory, override the command and provide the `netWatch` variables:

```bash
docker run --rm --init \
  -e AGENT=agent1 \
  -e NETWATCH_URL_JOB=https://example.com/api/testaro-agent/job \
  -e NETWATCH_URL_REPORT=https://example.com/api/testaro-agent/report \
  -e NETWATCH_URL_AUTH=password \
  testaro node call netWatch true 300 true
```

## Operational notes

- **Init process**: Testaro forks a child process per test act, and some tools relaunch browsers repeatedly, so zombie reaping matters more than for typical browser-automation applications. Always run with an init process (`docker run --init`; in Compose, `init: true`).
- **Memory**: allow headroom for browser relaunch spikes; multiple tools’ browsers can briefly coexist with the catalog pass. The reference Compose stack allows 4 GB.
- **`/dev/shm`**: Testaro launches Chromium with `--disable-dev-shm-usage`, so the small default `/dev/shm` of containers is not a problem and no `--shm-size` option is needed.
- **Environment variables**: all variables in `env.example` work as usual; pass them with `-e`/`--env-file` or the Compose `environment` key rather than baking an `.env` file into the image.

## License

© 2026 Jeff Witt.

Licensed under the [MIT License](https://opensource.org/license/mit/). See [LICENSE](LICENSE) file at the project root for details.

SPDX-License-Identifier: MIT
