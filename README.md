# Tomo Client Telemetry SDK

Open Telemetry compatible SDK to ingest network telemetry data from web applications like Next.js, React, Vue, etc.

## Features

- **Automatic HTTP Request Tracing**: All `fetch` requests are automatically traced with request/response data
- **OpenTelemetry Compatible**: Follows OpenTelemetry specification for seamless integration
- **Zero Configuration**: Drop-in solution that works out of the box
- **Framework Agnostic**: Works with any JavaScript framework (React, Vue, Angular, etc.)
- **Multiple Build Formats**: Supports CommonJS, ESM, and UMD formats

## Installation

```bash
npm install @get-tomo/tomo-client-telemetry-sdk
```

## Quick Start

```javascript
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

// Initialize the SDK
const telemetry = new TomoClientTelemetry({
  apiKey: 'your-api-key',
  serviceName: 'my-web-app',
  serviceVersion: '1.0.0',
  collectorUrl: 'https://collector.tomo.ai',
  debug: true // Optional: enables console logging
});

// That's it! The SDK automatically starts tracking:
// - HTTP requests via fetch
```

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | Your Tomo API key |
| `serviceName` | string | Yes | Name of your service |
| `serviceVersion` | string | Yes | Version of your service |
| `collectorUrl` | string | Yes | Tomo collector endpoint URL |
| `debug` | boolean | No | Enable debug logging (default: false) |

## Automatic Tracking

### HTTP Requests
All `fetch` requests are automatically traced with:
- Request method, URL, headers, and body
- Response status, headers, and body
- Request/response timing
- Error information
- Query parameters (for GET requests)
- Request body type detection (JSON, FormData, etc.)

## Manual Tracking

### Custom Network Events
```javascript
telemetry.trackNetworkEvent('custom_network_action', {
  action: 'api_call',
  endpoint: '/api/users',
  user_id: '12345'
});
```

## Build and Development

### Building the SDK
```bash
npm run build
```

This creates three distribution formats:
- `dist/index.js` - CommonJS format
- `dist/index.esm.js` - ES Module format  
- `dist/index.umd.js` - UMD format

### Development
```bash
npm run dev
```

Runs the build in watch mode for development.

## Usage Examples

### React Application
```javascript
import React, { useEffect } from 'react';
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

function App() {
  useEffect(() => {
    const telemetry = new TomoClientTelemetry({
      apiKey: process.env.REACT_APP_TOMO_API_KEY,
      serviceName: 'my-react-app',
      serviceVersion: '1.0.0',
      collectorUrl: 'https://collector.tomo.ai'
    });
  }, []);

  return <div>My App</div>;
}
```

### Next.js Application
```javascript
// pages/_app.js
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const telemetry = new TomoClientTelemetry({
      apiKey: process.env.NEXT_PUBLIC_TOMO_API_KEY,
      serviceName: 'my-nextjs-app',
      serviceVersion: '1.0.0',
      collectorUrl: 'https://collector.tomo.ai'
    });
  }, []);

  return <Component {...pageProps} />;
}
```

### Vue.js Application
```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import TomoClientTelemetry from '@get-tomo/tomo-client-telemetry-sdk';

const telemetry = new TomoClientTelemetry({
  apiKey: import.meta.env.VITE_TOMO_API_KEY,
  serviceName: 'my-vue-app',
  serviceVersion: '1.0.0',
  collectorUrl: 'https://collector.tomo.ai'
});

createApp(App).mount('#app');
```

## What Gets Tracked

### HTTP Request Details
- **Method**: GET, POST, PUT, DELETE, etc.
- **URL**: Full request URL
- **Host**: Request hostname
- **Path**: Request pathname
- **Query Parameters**: URL query string (for GET requests)
- **Request Body**: Request payload (truncated to 2048 characters)
- **Request Body Type**: JSON, FormData, URLSearchParams, etc.
- **Response Status**: HTTP status code
- **Response Body**: Response payload (truncated to 2048 characters)
- **Response Type**: JSON, text, etc.
- **Timing**: Request duration
- **Errors**: Network errors and exceptions

### Excluded Requests
The SDK automatically excludes tracing requests to the collector endpoint to prevent infinite loops.

## License

MIT
