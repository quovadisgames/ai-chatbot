# Token Display Component

This document explains how to use and customize the token display component in the AI Chatbot application.

## Overview

The token display component shows:
1. **Current Message Tokens**: The number of tokens used in the most recent message and its cost
2. **Total Chat Tokens**: The cumulative number of tokens used in the entire chat and its total cost

This information helps users understand the resource usage and cost implications of their interactions with the AI.

## Preview

You can preview the token display without running the development server by opening the `token-display-preview.html` file in your browser. This file demonstrates:

- The basic token display layout
- Different states (normal, loading, error, detailed)
- Light and dark mode support
- Simulated token updates

## Customization

### Token Rate

The token rate (cost per token) is defined in `components/simple-token-display.tsx`:

```typescript
// Token rate in dollars per token - adjust based on your model
const TOKEN_RATE = 0.00001;
```

Adjust this value based on your AI model's pricing:
- GPT-3.5 Turbo: ~$0.000002 per token
- GPT-4: ~$0.00003 per token
- Claude: ~$0.00001 per token

### Mock Data

During development or when the API is not available, you can use mock data:

```typescript
// Set this to true to use mock data instead of fetching from the API
const USE_MOCK_DATA = true;
```

Set this to `false` in production to fetch real token usage data from your API.

### Styling

The token display is styled with Tailwind CSS classes. You can customize its appearance by modifying:

1. The container in `components/chat.tsx`:
```tsx
<div className="flex justify-end px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/20">
  <div className="border-2 border-blue-200 dark:border-blue-700 rounded-md shadow-sm">
    <SimpleTokenDisplay chatId={id} />
  </div>
</div>
```

2. The component itself in `components/simple-token-display.tsx`:
```tsx
<div className="flex flex-col gap-1 text-sm font-medium border rounded px-3 py-2 bg-white dark:bg-gray-800 min-w-[220px]">
  {/* Component content */}
</div>
```

## API Integration

The component fetches token usage data from `/api/token-usage?chatId=${chatId}`. Ensure your API returns:

```json
{
  "lastMessageTokens": 250,  // Tokens used in the most recent message
  "totalTokens": 1250        // Total tokens used in the chat
}
```

## Troubleshooting

If the token display is not showing:

1. Check browser console for errors
2. Verify that `USE_MOCK_DATA` is set to `true` if your API is not implemented
3. Ensure the component is properly imported and rendered in `components/chat.tsx`
4. Check that your API endpoint is returning the expected data format

## Future Enhancements

Potential improvements to consider:
- Add a detailed view showing prompt vs. completion tokens
- Include monthly usage limits and reset dates
- Add visual indicators for approaching usage limits
- Implement cost forecasting based on usage patterns 