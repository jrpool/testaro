/*
  © 2023–2024 CVS Health and/or one of its affiliates. All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
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
  const observerURL = typeof serverID === 'number' ? process.env[`NETWATCH_URL_${serverID}_OBSERVE`] : '';
  if (observerURL) {
    const whoParams = `agent=${agent}&jobID=${report.id || ''}`;
    const wholeURL = `${observer}?${whoParams}&${messageParams}`;
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
