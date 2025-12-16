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
  const data = {
    prevented: false,
    source: ''
  };
  if (scheme === 'file') {
    const filePath = url.slice(7);
    const rawPage = await fs.readFile(filePath, 'utf8');
    data.source = rawPage;
  }
  else {
    try {
      const rawPageResponse = await fetch(url);
      const rawPage = await rawPageResponse.text();
      data.source = rawPage;
    }
    catch(error) {
      console.log(`ERROR getting source of ${url} (${error.message})`);
      data.prevented = true;
      data.error = `ERROR getting source of ${url}`;
    }
  }
  return data;
};
