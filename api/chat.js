// OpenAI Chat API Endpoint for Vercel Serverless Functions
import { Configuration, OpenAIApi } from 'openai';

// Initialize OpenAI configuration with API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

// Token counter utility function (simplified)
function countTokens(messages) {
  // This is a simplified estimation - in production, use a proper tokenizer
  // like GPT-3 Tokenizer or tiktoken
  let totalTokens = 0;
  
  messages.forEach(message => {
    // Rough estimate: 1 token ≈ 4 characters
    const contentLength = message.content ? message.content.length : 0;
    totalTokens += Math.ceil(contentLength / 4);
  });
  
  return totalTokens;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is configured
    if (!configuration.apiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'The server has not been configured with an OpenAI API key'
      });
    }

    // Get request body
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000 } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'The request must include a messages array'
      });
    }

    // Estimate token count for request
    const estimatedTokens = countTokens(messages);
    
    // Make request to OpenAI
    const completion = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens,
    });

    // Extract response
    const responseMessage = completion.data.choices[0].message;
    
    // Calculate actual token usage from OpenAI response
    const tokenUsage = completion.data.usage;

    // Return response with token information
    return res.status(200).json({
      message: responseMessage,
      tokenUsage,
      estimatedTokens
    });
  } catch (error) {
    // Handle errors
    console.error('Error calling OpenAI API:', error);
    
    // Determine error type and return appropriate response
    if (error.response) {
      // OpenAI API error
      return res.status(error.response.status).json({
        error: 'OpenAI API error',
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        code: error.response.status
      });
    } else {
      // Other error
      return res.status(500).json({
        error: 'Server error',
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
} 