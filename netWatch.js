/*
  © 2022–2025 CVS Health and/or one of its affiliates. All rights reserved.
  © 2025–2026 Jonathan Robert Pool.

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

const jobURL = new URL(process.env.NETWATCH_URL_JOB);
const jobHost = jobURL.host;
const reportURL = new URL(process.env.NETWATCH_URL_REPORT);
const reportHost = reportURL.host;
const agentPW = process.env.NETWATCH_URL_AUTH;

// FUNCTIONS

// Waits.
const wait = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('');
    }, ms);
  });
};
// Ends a response with an object in JSON format.
const respondWithObject = (object, response) => {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(object));
};
/*
  Requests a network job and, when found, performs and reports it.
  Arguments:
  0. whether to continue watching after a job is run.
  1: interval in seconds from a no-job check to the next check.
  2. whether to ignore unknown-certificate errors from watched servers.
*/
exports.netWatch = async (isForever, intervalInSeconds, isCertTolerant = true) => {
  // If the job and report URLs exist and are valid:
  if (jobURL && reportURL) {
    // Configure the watch.
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
      // Log the start of a check.
      console.log('--');
      // Configure the next check.
      const logStart = `Requested job from ${jobHost} and got `;
      // Perform it.
      await new Promise(resolve => {
        try {
          const client = jobURL.protocol === 'https:' ? httpsClient : httpClient;
          // Request a job.
          const requestOptions = {
            method: 'POST',
            headers: {
              host: jobHost,
              'content-type': 'application/json; charset=utf-8'
            }
          };
          client.request(jobURL, requestOptions, response => {
            // Initialize a collection of data from the response.
            const chunks = [];
            response
            // If the response throws an error:
            .on('error', async error => {
              // Report it.
              console.log(`${logStart}error message ${error.message}`);
              // Stop checking.
              abort = true;
              resolve(true);
            })
            // If the response delivers data:
            .on('data', chunk => {
              // Add them to the collection.
              chunks.push(chunk);
            })
            // When the response is completed:
            .on('end', async () => {
              const content = chunks.join('');
              try {
                // Parse it as a JSON job.
                let contentObj = JSON.parse(content);
                const {id, sources} = contentObj;
                // If it is a no-job message:
                if (! Object.keys(contentObj).length) {
                  // Report this.
                  console.log(`${logStart}no job to do; waiting ${intervalInSeconds} sec before next check`);
                  // Wait for the specified interval.
                  await wait(1000 * intervalInSeconds);
                  resolve(true);
                }
                // Otherwise, if a job was received:
                else if (id) {
                  // Check it for validity.
                  const jobValidity = isValidJob(contentObj);
                  // If it is invalid:
                  if (! jobValidity.isValid) {
                    // Report this to the server.
                    respondWithObject({
                      message: `invalidJob`,
                      error: jobValidity.error
                    }, response);
                    console.log(`${logStart}invalid job (${jobValidity.error})`);
                    resolve(true);
                  }
                  // Otherwise, i.e. if it is valid:
                  else {
                    // Prevent further watching, if unwanted.
                    noJobYet = false;
                    // Add the agent and the server ID to the job.
                    sources.agent = process.env.AGENT || '';
                    // Perform the job and create a report.
                    console.log(`${logStart}job ${id} (${nowString()})`);
                    try {
                      const report = await doJob(contentObj);
                      const responseObj = {
                        agentPW,
                        report
                      };
                      let responseJSON = JSON.stringify(responseObj, null, 2);
                      console.log(`Job ${id} finished (${nowString()})`);
                      const reportLogStart = `Submitted report ${id} to ${reportURL} and got `;
                      const requestOptions = {
                        method: 'POST',
                        headers: {
                          host: reportHost,
                          'content-type': 'application/json; charset=utf-8'
                        }
                      };
                      // Submit the report.
                      const client = reportURL.protocol === 'https:' ? httpsClient : httpClient;
                      client.request(reportURL, requestOptions, repResponse => {
                        // Initialize a collection of data from the response.
                        const chunks = [];
                        repResponse
                        // If the response to the report threw an error:
                        .on('error', async error => {
                          // Report this.
                          console.log(`${reportLogStart}error message ${error.message}\n`);
                          // Stop checking.
                          abort = true;
                          resolve(true);
                        })
                        // If the response delivers data:
                        .on('data', chunk => {
                          // Add them to the collection.
                          chunks.push(chunk);
                        })
                        // When the response to the report is completed:
                        .on('end', async () => {
                          const content = chunks.join('');
                          try {
                            // Parse it as a JSON message.
                            const ackObj = JSON.parse(content);
                            // Report it.
                            console.log(
                              `${reportLogStart}response message: ${JSON.stringify(ackObj, null, 2)}\n`
                            );
                          }
                          // If it is not JSON:
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
                        // Stop checking.
                        abort = true;
                        resolve(true);
                      })
                      // Finish submitting the report.
                      .end(responseJSON);
                    }
                    catch(error) {
                      console.log(`ERROR performing job ${id} (${error.message})`);
                      // Stop checking.
                      abort = true;
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
                // Stop checking.
                abort = true;
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
              // Stop checking.
              abort = true;
            }
            // Otherwise, if it was a DNS failure:
            else if (error.code && error.code.includes('ENOTFOUND')) {
              // Report this.
              console.log(`${logStart}no domain name resolution`);
              // Stop checking.
              abort = true;
            }
            // Otherwise, if it was any other error with a message:
            else if (error.message) {
              // Report this.
              console.log(`ERROR: ${logStart}got error message ${error.message.slice(0, 200)}`);
              // Stop checking.
              abort = true;
            }
            // Otherwise, i.e. if it was any other error with no message:
            else {
              // Report this.
              console.log(`ERROR: ${logStart}got an error with no message`);
              // Stop checking.
              abort = true;
            }
            resolve(true);
          })
          // Finish sending the job request.
          .end(JSON.stringify({
            agentPW
          }));
        }
        // If requesting a job throws an error:
        catch(error) {
          // Report this.
          console.log(`ERROR requesting a network job (${error.message})`);
          // Stop checking.
          abort = true;
          resolve(true);
        }
      });
    }
    console.log(`Watching $(abort ? 'aborted' : 'complete')`);
  }
  // Otherwise, i.e. if the job or report URL does not exist or is invalid:
  else {
    // Report this.
    console.log('ERROR: Job or report URL does not exist or is invalid');
  }
};
