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
// Returns an operating-system-compatible path to a temporary directory.
exports.getTmpDir = async () => {
  const tmpDirs = [`${__dirname}/../${process.env.TMPDIRNAME || 'scratch'}`, os.tmpdir(), '/tmp'];
  let tmpDir = null;
  // For each potential temporary directory:
  for (const tmpDirAlternative of tmpDirs) {
    try {
      // Verify that it is writable.
      await fs.access(tmpDirAlternative, fs.constants.W_OK);
      tmpDir = tmpDirAlternative;
      // If it is, stop checking alternatives.
      break;
    }
    // If it is not:
    catch(error) {
      // Report this and continue checking alternatives.
      console.log(`ERROR: ${tmpDirAlternative} is not a writable directory for temporary reports`);
    }
  }
  // If no writable temporary directory was found:
  if (! tmpDir) {
    // Report this.
    console.log('ERROR: No writable temporary directory was found; quitting');
  }
  // Return the directory path or a failure.
  return tmpDir;
};
