/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  getSource
  Gets and returns the source of a document.
*/

// IMPORTS

// Module to process files.
const fs = require('fs/promises');

// FUNCTIONS

// Gets and returns the source of a page.
exports.getSource = async page => {
  const url = page.url();
  const scheme = url.replace(/:.+/, '');
  // Initialize the test data.
  const data = {
    prevented: false,
    source: ''
  };
  // If the page is a local file:
  if (scheme === 'file') {
    const filePath = url.slice(7);
    // Get the source from it.
    const rawPage = await fs.readFile(filePath, 'utf8');
    // Add the source to the test data.
    data.source = rawPage;
  }
  // Otherwise, i.e. if the page is not a local file:
  else {
    try {
      console.log(`XXX About to get pageRequest of ${url}`);
      const pageRequest = page.request;
      console.log(`XXX Got pageRequest`);
      const pageResponse = await pageRequest.get(url);
      console.log('XXX got pageResponse');
      const rawPage = await pageResponse.text();
      console.log('Got rawPage');
      data.source = rawPage;
    }
    catch(error) {
      console.log(`ERROR (${error.message}) getting source of ${url} because ${error.cause}`);
      data.prevented = true;
      data.error = `ERROR getting source of ${url}`;
    }
  }
  return data;
};
