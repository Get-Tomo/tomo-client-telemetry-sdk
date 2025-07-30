/**
 * Traced fetch implementation for Tomo Client Telemetry SDK.
 * Provides a drop-in replacement for fetch with OpenTelemetry tracing.
 * @module patch-fetch
 */
import { SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { runWithSpan, setSpanAttributes } from './otel/tracing-utils.js'
import { getConfig } from './store/config-store.js'

/**
 * Sets HTTP attributes and status on a span based on response.
 * @param {object} span - The span
 * @param {object} res - The HTTP response
 */
function setHttpSpanStatus(span, res) {
  if (!span || !res) return
  
  if (typeof res.status === 'number') {
    setSpanAttributes(span, {
      'httpStatusCode': res.status
    })
    span.setStatus({ code: res.status >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK })
  }
}

async function setHTTPResponseBody(span, res) {
  if (!span || !res) return res

  let bodyText = '';
  let responseType = '';
  const contentType = res.headers.get('content-type') || '';
  let clonedRes = res.clone();

  try {
    if (contentType.includes('application/json')) {
      const json = await clonedRes.json();
      bodyText = JSON.stringify(json);
      responseType = 'json';
    } else if (contentType.startsWith('text/')) {
      bodyText = await clonedRes.text();
      responseType = 'text';
    }
  } catch (err) {
    clonedRes = res.clone()

    try {
      bodyText = await clonedRes.text();
      responseType = 'text';
    } catch {
      bodyText = '[unreadable response body]';
      responseType = 'unknown';
    }
  }

  setSpanAttributes(span, {
    'httpResponse': bodyText,
    'httpResponseType': responseType
  })
}

/**
 * Extracts and serializes the request body for tracing.
 * Handles string, JSON, FormData, and other body types. Truncates long strings.
 * @param {RequestInit} options - Fetch options possibly containing a body
 * @returns {{body: string|undefined, type: string|undefined}} An object with the serialized body and its type
 */
function extractRequestBody(options) {
  if (options && options.body) {
    if (typeof options.body === 'string') {
      let type = 'string';
      // Try to detect JSON
      try {
        JSON.parse(options.body);
        type = 'json';
      } catch {}
      const body = options.body.length > 2048 ? options.body.slice(0, 2048) + '...[truncated]' : options.body;
      return { body, type };
    } else if (options.body instanceof FormData) {
      return { body: '[FormData body]', type: 'formdata' };
    } else if (options.body instanceof URLSearchParams) {
      return { body: options.body.toString(), type: 'urlencoded' };
    } else if (options.body instanceof ArrayBuffer) {
      return { body: '[ArrayBuffer body]', type: 'arraybuffer' };
    } else if (options.body instanceof Blob) {
      return { body: `[Blob: ${options.body.type}]`, type: 'blob' };
    } else {
      return { body: '[unhandled body type]', type: typeof options.body };
    }
  }
  return { body: undefined, type: undefined };
}

/**
 * Extracts query parameters from a URL string or Request object for tracing.
 * @param {string|Request} url - The URL or Request object
 * @returns {string|undefined} The query string (including '?'), or undefined if none
 */
function extractQueryParams(url) {
  let urlString = typeof url === 'string' ? url : (url && url.url ? url.url : undefined);
  if (!urlString) return undefined;
  try {
    const u = new URL(urlString, window.location.origin);
    return u.search ? u.search : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Patches globalThis.fetch to add OpenTelemetry tracing.
 */
export function patchFetch() {
  if (globalThis.__patchedFetch) return;

  const config = getConfig();
  
  const originalFetch = globalThis.fetch;
  const ingestEndpoint = config.collectorUrl;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;

    // Skip tracing the trace ingestion endpoint
    if (url.includes(ingestEndpoint)) {
      try {
        return await originalFetch(input, init);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }

    const method = init?.method || (typeof input === 'object' && input.method) || 'GET';
    
    // --- Request body tracing ---
    const { body: requestBody, type: requestBodyType } = extractRequestBody(init);
    
    // --- Query params for GET ---
    let queryParams = undefined;
    
    if (method.toUpperCase() === 'GET') {
      queryParams = extractQueryParams(input);
    }
    
    return runWithSpan(`tomo.http.request`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'httpMethod': method,
        'httpUrl': url,
        'httpHost': new URL(url, window.location.origin).host,
        'httpPath': new URL(url, window.location.origin).pathname,
        ...(requestBody !== undefined ? { 'httpRequestBody': requestBody } : {}),
        ...(requestBodyType !== undefined ? { 'httpRequestBodyType': requestBodyType } : {}),
        ...(queryParams !== undefined ? { 'httpQueryParams': queryParams } : {})
      }
    }, async (span) => {
      try {
        const res = await originalFetch(input, init);
        setHttpSpanStatus(span, res);
        await setHTTPResponseBody(span, res);
        return res;
      } catch (err) {
        setSpanAttributes(span, {
          'httpError': err && err.message ? err.message : String(err),
          'httpStatusCode': err && err.status ? err.status : 500
        });
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      }
    });
  };

  globalThis.__patchedFetch = true;
}