/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.
  © 2026 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  tellServer
  Send a notice to an observer.
*/

// CONSTANTS

const httpClient = require('http');
const httpsClient = require('https');
const agent = process.env.AGENT;

// FUNCTIONS

// Sends a notice to an observer.
exports.tellServer = (report, messageParams, logMessage) => {
  const {serverID} = report.sources;
  const observerURL = typeof serverID === 'number'
    ? process.env[`NETWATCH_URL_${serverID}_OBSERVE`]
    : '';
  if (observerURL) {
    const whoParams = `agent=${agent}&jobID=${report.id || ''}`;
    const wholeURL = `${observerURL}?${whoParams}&${messageParams}`;
    const client = wholeURL.startsWith('https://') ? httpsClient : httpClient;
    client.request(wholeURL)
    // If the notification threw an error:
    .on('error', error => {
      // Report the error.
      const errorMessage = 'ERROR notifying the server';
      console.log(`${errorMessage} (${error.message})`);
    })
    .end();
    console.log(`${logMessage} (server notified)`);
  }
};
