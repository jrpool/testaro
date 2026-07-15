# © 2026 Jeff Witt.
#
# Licensed under the MIT License. See LICENSE file at the project root or
# https://opensource.org/license/mit/ for details.
#
# SPDX-License-Identifier: MIT

# Reference container image for Testaro. See CONTAINERS.md for usage.
#
# The base-image tag must match the version of the playwright package in
# package-lock.json, so that the browsers baked into the image are the ones
# the installed Playwright expects.
FROM mcr.microsoft.com/playwright:v1.60.0-noble

# Install a headless Java runtime for the nuVnu test (vnu-jar); baking it in
# prevents vnu-jar from downloading a Temurin runtime over the network on
# first use. Also install unzip, which Puppeteer's browser downloader needs
# during `npm ci` and which the base image lacks.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-17-jre-headless unzip \
  && rm -rf /var/lib/apt/lists/*

# Run as the unprivileged user provided by the Playwright base image.
USER pwuser
WORKDIR /home/pwuser/testaro

# Install the dependencies first, for build-layer caching. QualWeb's
# Puppeteer downloads its own Chromium during this step (into
# ~/.cache/puppeteer), so that browser is also baked into the image, pinned
# by package-lock.json. Playwright's browsers are already in the base image.
COPY --chown=pwuser:pwuser package.json package-lock.json ./
RUN npm ci

# Copy the application.
COPY --chown=pwuser:pwuser . .

# Directories for jobs and reports when watching a directory; mount volumes
# here (see CONTAINERS.md and docker-compose.yml).
ENV JOBDIR=/home/pwuser/testaro/watch/jobs \
    REPORTDIR=/home/pwuser/testaro/watch/reports
RUN mkdir -p watch/jobs/todo watch/jobs/done watch/reports/raw

# Chromium's sandbox requires unprivileged user-namespace cloning, which the
# default Docker seccomp policy blocks. This default disables the sandbox
# (for Playwright's Chromium and QualWeb's). To keep the sandbox instead,
# run the container with a seccomp profile that permits user-namespace
# cloning and set this variable to false. See CONTAINERS.md.
ENV TESTARO_CHROMIUM_NO_SANDBOX=true

# Testaro forks a child process per test act, and some tools relaunch
# browsers repeatedly, so zombie reaping matters: run the container with an
# init process (`docker run --init`; in Compose, `init: true`).
CMD ["node", "call", "dirWatch", "true", "300"]
