import { NextRequest, NextResponse } from 'next/server';

// Enhanced API proxy that forwards requests to the actual API server
// This avoids bundling native Node.js modules with the Next.js app
async function handleApiRequest(request: NextRequest, params?: { route?: string[] }) {
  // Get the API URL from environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const route = params?.route?.join('/') || '';
  const url = `${apiUrl}/${route}`;
  
  console.log(`Proxying request to: ${url}`);
  
  // Add request tracking for debugging
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Get the request body if it exists
  let body;
  try {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.json();
    }
  } catch (_) {
    // No body or invalid JSON
  }

  try {
    // Clone the headers to modify them
    const headers = new Headers();
    
    // Copy all headers from the original request
    request.headers.forEach((value, key) => {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // Set content type if not already set
    if (!headers.has('content-type') && body) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Add request tracking header
    headers.set('X-Request-ID', requestId);
    
    // Forward the request to the actual API server
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    console.log(`[${requestId}] Response status: ${response.status}`);
    

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (_) {
      data = { message: 'No response body' };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error(`[${requestId}] API proxy error for ${url}:`, err);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'API service unavailable',
        message: 'Could not connect to the API server',
        requestId,
        url: url.replace(/\/\//g, '/') // Sanitize URL for logging
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Handle all HTTP methods
export async function GET(request: NextRequest) {
  return handleApiRequest(request);
}

export async function POST(request: NextRequest) {
  return handleApiRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleApiRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleApiRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleApiRequest(request);
}

// Ensure dynamic rendering for API routes
export const dynamic = 'force-dynamic';
