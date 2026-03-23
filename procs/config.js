/*
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  config
  Shared configuration values for Testaro.
*/

// Timeout multiplier from environment variable.
// Set TIMEOUT_MULTIPLIER > 1 for slow networks/sites, < 1 for fast environments.
const timeoutMultiplier = Number.parseFloat(process.env.TIMEOUT_MULTIPLIER) || 1;

// Helper to apply multiplier to a timeout value.
// Use for navigation, interaction, and long-running operation timeouts.
// Do NOT use for very short "fail-fast" timeouts (< 100ms).
const applyMultiplier = (baseTimeout) => Math.round(baseTimeout * timeoutMultiplier);

module.exports = {
  timeoutMultiplier,
  applyMultiplier
};
