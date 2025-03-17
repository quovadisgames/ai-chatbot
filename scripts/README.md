# AI Chatbot Test Scripts

This directory contains utility scripts for testing the AI chatbot.

## Chat API Test Script

The `test-chat-api.ts` script sends a POST request to the `/api/chat` endpoint and logs the full response stream. It's useful for debugging issues with the chat API without involving the UI.

### Setup

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

### Usage

To test against your Vercel deployment:
```bash
npm run test-chat -- https://ai-chatbot-git-good-testing-branch-alexs-projects-27b9957e.vercel.app
```

To test against a local development server:
```bash
npm run test-chat -- http://localhost:3000
```

### What the Script Does

1. Sends a POST request to the `/api/chat` endpoint with a test message
2. Logs the response status and headers
3. If the response is a stream (content-type: text/event-stream):
   - Processes the stream chunk by chunk
   - Parses and logs each SSE event
   - Extracts and displays the data from each event
4. If the response is not a stream:
   - Logs the full response body

### Troubleshooting

If you see errors like:
- No events received: The server might not be formatting the response as SSE events
- Missing 'data:' prefixes: The server might not be properly formatting SSE events
- Empty response: The server might be timing out or not responding

Check the server logs for more details on what's happening during the request processing. 