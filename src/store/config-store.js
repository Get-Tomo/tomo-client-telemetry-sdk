/**
 * @module config-store
 * Simple in-memory config store for Tomo Client Telemetry SDK.
 */

/**
 * Internal config object storage.
 * @type {object|null}
 * @property {string} apiKey - The API key for the SDK
 * @property {string} serviceName - The name of the service
 * @property {string} serviceVersion - The version of the service
 * @property {string} collectorUrl - The URL of the collector
 * @property {boolean} debug - Whether to enable debug mode
 * @private
 */
let _config = null;

/**
 * Sets the global config object for the SDK.
 * @param {object} config - The configuration object to store
 */
export function setConfig(config) {
  _config = config;
}

/**
 * Retrieves the global config object for the SDK.
 * @typedef {object} TomoClientTelemetryConfig
 * @property {string} apiKey - The API key for the SDK
 * @property {string} serviceName - The name of the service
 * @property {string} serviceVersion - The version of the service
 * @property {string} collectorUrl - The URL of the collector
 * @property {boolean} debug - Whether to enable debug mode
 * @returns {TomoClientTelemetryConfig|null} The stored configuration object, or null if not set
 */
export function getConfig() {
  return _config;
}