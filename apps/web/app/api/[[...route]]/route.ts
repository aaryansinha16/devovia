import { NextRequest, NextResponse } from 'next/server';

// Simple API proxy that forwards requests to the actual API server
// This avoids bundling native Node.js modules with the Next.js app
async function handleApiRequest(request: NextRequest, params: { route: string[] }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const route = params.route?.join('/') || '';
  const url = `${apiUrl}/${route}`;
  
  // Get the request body if it exists
  let body;
  try {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.json();
    }
  } catch (error) {
    // No body or invalid JSON
  }

  try {
    // Forward the request to the actual API server
    const response = await fetch(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...request.headers.get('authorization') ? 
          { 'Authorization': request.headers.get('authorization') || '' } : {}
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get the response data
    let data;
    try {
      data = await response.json();
    } catch (error) {
      data = { message: 'No response body' };
    }

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`API proxy error for ${url}:`, error);
    return NextResponse.json(
      { error: 'API service unavailable' },
      { status: 500 }
    );
  }
}

// Handle all HTTP methods
export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

export async function OPTIONS(request: NextRequest, { params }: { params: { route: string[] } }) {
  return handleApiRequest(request, params);
}

// Ensure dynamic rendering for API routes
export const dynamic = 'force-dynamic';
