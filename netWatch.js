/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025 Jonathan Robert Pool.

  Licensed under the MIT License. See LICENSE file at the project root or
  https://opensource.org/license/mit/ for details.

  SPDX-License-Identifier: MIT
*/

/*
  netWatch.js
  Module for watching for a network job and running it when found.
*/

// IMPORTS

// Module to keep secrets.
require('dotenv').config();
// Module to validate jobs.
const {isValidJob} = require('./procs/job');
// Modules to make requests to servers.
const httpClient = require('http');
const httpsClient = require('https');
// Module to perform jobs.
const {doJob} = require('./run');
// Module to process dates and times.
const {nowString} = require('./procs/dateTime');

// CONSTANTS

const netWatchURLIDs = process.env.NETWATCH_URLS.split(/,/);
const jobURLs = netWatchURLIDs.map(id => process.env[`NETWATCH_URL_${id}_JOB`]);
const reportURLs = netWatchURLIDs.map(id => process.env[`NETWATCH_URL_${id}_REPORT`]);
const auths = netWatchURLIDs.map(id => process.env[`NETWATCH_URL_${id}_AUTH`]);

// FUNCTIONS

// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
// Serves an object in JSON format.
const serveObject = (object, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(object));
};
// Removes the query if any, or otherwise the final segment, from a URL.
const getURLBase = url => url.replace(/[?/][^?/.]+$/, '');
/*
  Requests a network job and, when found, performs and reports it.
  Arguments:
  0. whether to continue watching after a job is run.
  1: interval in seconds from a cycle of no-job checks to the next cycle.
  2. whether to ignore unknown-certificate errors from watched servers.
*/
exports.netWatch = async (isForever, intervalInSeconds, isCertTolerant = true) => {
  // If the job and report URLs exist and are all valid:
  if (
    jobURLs
    && jobURLs.length
    && reportURLs
    && reportURLs.length === jobURLs.length
    && jobURLs.every((jobURL, index) => {
      const allDefined = [jobURL, reportURLs[index]].every(url => url);
      const allSchemed = allDefined
      && [jobURL, reportURLs[index]]
      .every(url => ['http://', 'https://'].some(prefix => url.startsWith(prefix)));
      return allSchemed;
    })
  ) {
    // Configure the watch.
    const urlCount = jobURLs.length;
    let cycleIndex = -1;
    let urlIndex = -1;
    let noJobYet = true;
    let abort = false;
    const certInfo = `Certificate-${isCertTolerant ? '' : 'in'}tolerant`;
    const foreverInfo = isForever ? 'repeating' : 'one-job';
    const intervalInfo = `with ${intervalInSeconds}-second intervals`;
    console.log(
      `${certInfo} ${foreverInfo} network watching started ${intervalInfo} (${nowString()})\n`
    );
    // As long as watching is to continue:
    while ((isForever || noJobYet) && ! abort) {
      // If the cycle is complete:
      if (cycleIndex === urlCount - 1) {
        // Wait for the specified interval.
        await wait(1000 * intervalInSeconds);
        // Log the start of a cycle.
        console.log('--');
      }
      // Otherwise, i.e. if the cycle is incomplete:
      else {
        // Wait briefly.
        await wait(1000);
      }
      // Configure the next check.
      cycleIndex = ++cycleIndex % urlCount;
      urlIndex = ++urlIndex % urlCount;
      const jobURL = jobURLs[urlIndex];
      const publicURL = auths[urlIndex] ? jobURL : getURLBase(jobURL);
      const logStart = `Requested job from ${publicURL} and got `;
      // Perform it.
      await new Promise(resolve => {
        try {
          const client = jobURL.startsWith('https://') ? httpsClient : httpClient;
          // Request a job.
          const requestOptions = isCertTolerant ? {rejectUnauthorized: false} : {};
          if (auths[urlIndex]) {
            requestOptions.method = 'POST';
          }
          client.request(jobURL, requestOptions, response => {
            const chunks = [];
            response
            // If the response throws an error:
            .on('error', async error => {
              // Report it.
              console.log(`${logStart}error message ${error.message}`);
              resolve(true);
            })
            .on('data', chunk => {
              chunks.push(chunk);
            })
            // When the response arrives:
            .on('end', async () => {
              const content = chunks.join('');
              // It should be JSON. If it is:
              try {
                let contentObj = JSON.parse(content);
                const {id, sources} = contentObj;
                // If it is empty:
                if (! Object.keys(contentObj).length) {
                  // Report this.
                  console.log(`${logStart}no job to do`);
                  resolve(true);
                }
                // Otherwise, if it is a job:
                else if (id) {
                  // Check it for validity.
                  const jobInvalidity = isValidJob(contentObj);
                  // If it is invalid:
                  if (jobInvalidity) {
                    // Report this to the server.
                    serveObject({
                      message: `invalidJob`,
                      jobInvalidity
                    }, response);
                    console.log(`${logStart}invalid job (${jobInvalidity})`);
                    resolve(true);
                  }
                  // Otherwise, i.e. if it is valid:
                  else {
                    // Restart the cycle.
                    cycleIndex = -1;
                    // Prevent further watching, if unwanted.
                    noJobYet = false;
                    // Add the agent and the server ID to the job.
                    sources.agent = process.env.AGENT || '';
                    sources.serverID = urlIndex;
                    // Perform the job and create a report.
                    console.log(`${logStart}job ${id} for server ${urlIndex} (${nowString()})`);
                    try {
                      const report = await doJob(contentObj);
                      const responseObj = auths[urlIndex] ? {
                        agentPW: auths[urlIndex],
                        report
                      } : report;
                      let responseJSON = JSON.stringify(responseObj, null, 2);
                      console.log(`Job ${id} finished (${nowString()})`);
                      const reportURL = reportURLs[urlIndex];
                      const publicReportURL = auths[urlIndex] ? reportURL : getURLBase(reportURL);
                      const reportClient = reportURL.startsWith('https://')
                        ? httpsClient
                        : httpClient;
                      const reportLogStart = `Submitted report ${id} to ${publicReportURL} and got `;
                      // Send the report to the server that assigned the job.
                      reportClient.request(reportURL, {method: 'POST'}, repResponse => {
                        const chunks = [];
                        repResponse
                        // If the response to the report threw an error:
                        .on('error', async error => {
                          // Report this.
                          console.log(`${reportLogStart}error message ${error.message}\n`);
                          resolve(true);
                        })
                        .on('data', chunk => {
                          chunks.push(chunk);
                        })
                        // When the response to the report arrives:
                        .on('end', async () => {
                          const content = chunks.join('');
                          // It should be JSON. If it is:
                          try {
                            const ackObj = JSON.parse(content);
                            // Report it.
                            console.log(
                              `${reportLogStart}response message: ${JSON.stringify(ackObj, null, 2)}\n`
                            );
                          }
                          // Otherwise, i.e. if it is not JSON:
                          catch(error) {
                            // Report this.
                            console.log(
                              `ERROR: ${reportLogStart}status ${repResponse.statusCode}, error message ${error.message}, and response ${content.slice(0, 1000)}\n`
                            );
                          }
                          // Free the memory used by the job and the report.
                          contentObj = {};
                          responseJSON = '';
                          resolve(true);
                        });
                      })
                      // If the report submission throws an error:
                      .on('error', async error => {
                        // Abort the watch.
                        abort = true;
                        // Report this.
                        console.log(
                          `ERROR ${error.code} in report submission: ${reportLogStart}error message ${error.message}\n`
                        );
                        resolve(true);
                      })
                      // Finish submitting the report.
                      .end(responseJSON);
                    }
                    catch(error) {
                      console.log(`ERROR performing job ${id} (${error.message})`);
                      resolve(true);
                    }
                  }
                }
                // Otherwise, i.e. if it is a message:
                else {
                  // Report it.
                  console.log(`${logStart}${JSON.stringify(contentObj, null, 2)}`);
                  resolve(true);
                }
              }
              // Otherwise, i.e. if it is not JSON:
              catch(error) {
                // Report this.
                console.log(`ERROR: ${logStart}status ${response.statusCode}, error message ${error.message}, and non-JSON response ${content.slice(0, 1000)}\n`);
                resolve(true);
              };
            });
          })
          // If the job request throws an error:
          .on('error', async error => {
            // If it is a refusal to connect:
            if (error.code && error.code.includes('ECONNREFUSED')) {
              // Report this.
              console.log(`${logStart}no connection`);
            }
            // Otherwise, if it was a DNS failure:
            else if (error.code && error.code.includes('ENOTFOUND')) {
              // Report this.
              console.log(`${logStart}no domain name resolution`);
            }
            // Otherwise, if it was any other error with a message:
            else if (error.message) {
              // Report this.
              console.log(`ERROR: ${logStart}got error message ${error.message.slice(0, 200)}`);
            }
            // Otherwise, i.e. if it was any other error with no message:
            else {
              // Report this.
              console.log(`ERROR: ${logStart}got an error with no message`);
            }
            resolve(true);
          })
          // Finish sending the job request, with a password if a POST request.
          .end(auths[urlIndex] ? JSON.stringify({
            agentPW: auths[urlIndex]
          }) : '');
        }
        // If requesting a job throws an error:
        catch(error) {
          // Abort the watch.
          abort = true;
          // Report this.
          console.log(`ERROR requesting a network job (${error.message})`);
          resolve(true);
        }
      });
    }
    console.log('Watching complete');
  }
  // Otherwise, i.e. if the job URLs do not exist or are invalid:
  else {
    // Report this.
    console.log('ERROR: List of job URLs invalid');
  }
};
