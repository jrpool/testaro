/*
  © 2022–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  This tool subjects a page and its source to the Nu Html Checker, thereby testing scripted content found only in the loaded page and erroneous content before the browser corrects it. The API erratically replaces left and right double quotation marks with invalid UTF-8, which appears as 2 or 3 successive instances of the replacement character (U+fffd). Therefore, this test removes all such quotation marks and the replacement character. That causes 'Bad value “” for' to become 'Bad value  for'. Since the corruption of quotation marks is erratic, no better solution is known.
  This tool is the installed version of the Nu Html Checker. It is an alternative to the nuVal tool, which uses the same validator as a web service of the World Wide Web Consortium (W3C). Each tool has advantages and disadvantages. The main advantage of the nuVnu tool is that it can evaluate pages larger than about 80,000 bytes and pages reachable from the host that Testaro runs on even if not reachable from the public Internet. The main advantages of nuVal are that it usually runs faster than nuVnu and it does not require the Testaro host to provide a Java virtual machine.
  When both nuVal and nuVnu are included in a job, nuVal should precede nuVnu. If nuVal succeeds, nuVnu aborts. So, only one of the two tools contributes instances to the job report.
*/

// IMPORTS

// Module to perform file operations.
const fs = require('fs/promises');
// Module to define the operating-system temporary-file directory.
const os = require('os');
// Module to run tests.
const {vnu} = require('vnu-jar');
// Module to get the content.
const {curate, getContent} = require('../procs/nu');

// CONSTANTS

const tmpDir = os.tmpdir();

// FUNCTIONS

// Conducts and reports the Nu Html Checker tests.
exports.reporter = async (page, report, actIndex) => {
  // Get the vuVal act, if it exists.
  const nuValAct = report.acts.find(act => act.type === 'test' && act.which === 'nuVal');
  // If it does not exist or it exists but was prevented:
  if (! nuValAct || nuValAct.data?.prevented) {
    const act = report.acts[actIndex];
    const {rules, withSource} = act;
    // Get the content.
    const data = await getContent(page, withSource);
    let result;
    // If it was obtained:
    if (data.testTarget) {
      const pagePath = `${tmpDir}/nuVnu-page-${report.id}.html`;
      // Save it in a temporary file.
      await fs.writeFile(pagePath, data.testTarget);
      let nuData;
      try {
        // Get Nu Html Checker output on it.
        nuData = await vnu.check(['--format', 'json', '--stdout', pagePath]);
      }
      // If any error was thrown:
      catch (error) {
        const errorMessage = error.message;
        try {
        // Parse it as JSON, i.e. a benign nuVnu result with at least 1 violation.
          nuData = JSON.parse(error.message);
        }
        // If parsing it as JSON fails:
        catch (error) {
          // Report a genuine error.
          data.prevented = true;
          data.error = errorMessage;
        }
      }
      // Delete the temporary file.
      await fs.unlink(pagePath);
      // Postprocess the result.
      result = curate(data, nuData, rules);
    }
    // Otherwise, i.e. if the content was not obtained:
    else {
      // Report this.
      data.prevented = true;
      data.error = 'Content not obtained';
    }
    return {
      data,
      result
    };
  }
  // Otherwise, i.e. if the nuVal act exists and succeeded:
  else {
    // Abort this act and report this.
    return {
      data: {
        skipped: true,
        reason: 'nuVal succeeded'
      },
      result: {}
    };
  }
};
