/*
  © 2025–2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  config
  Shared configuration values for Testaro.
*/

// Amount to multiply by specified time limits (normally 1) to adapt to network/site speed.
const timeoutMultiplier = Number.parseFloat(process.env.TIMEOUT_MULTIPLIER) || 1;
// Multiplies a time limit by the configured amount.
exports.applyMultiplier = (baseTimeout) => Math.round(baseTimeout * timeoutMultiplier);
