import { NextRequest, NextResponse } from 'next/server';
import { apiApp } from '../../../../api/src/server'; // Import the Express app from the correct path
import { connectToDatabase } from '../../../../api/src/server';

// Initialize database connection
let dbInitialized = false;
const initDb = async () => {
  if (!dbInitialized) {
    await connectToDatabase();
    dbInitialized = true;
    console.log('Database connected for API routes');
  }
};

// Process the API request through Express
const processRequest = async (req: NextRequest) => {
  await initDb();
  
  // Create a mock response object
  let responseBody: any = null;
  let statusCode = 200;
  let responseHeaders: Record<string, string> = {};
  
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseBody = data;
      return res;
    },
    send: (data: any) => {
      responseBody = data;
      return res;
    },
    setHeader: (name: string, value: string) => {
      responseHeaders[name] = value;
      return res;
    },
    end: (data?: any) => {
      if (data) responseBody = data;
      return res;
    },
    writeHead: (code: number, headers?: Record<string, string>) => {
      statusCode = code;
      if (headers) {
        responseHeaders = { ...responseHeaders, ...headers };
      }
      return res;
    },
  };
  
  // Create a promise that resolves when the Express middleware chain completes
  return new Promise<{ statusCode: number, body: any, headers: Record<string, string> }>((resolve) => {
    // Convert the Next.js request to Express format
    const url = new URL(req.url);
    const expressReq: any = {
      method: req.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(req.headers),
      query: Object.fromEntries(url.searchParams),
      body: req.body,
      cookies: req.cookies,
    };
    
    // Add a callback to be executed when the response is ready
    res.end = (data?: any) => {
      if (data) responseBody = data;
      resolve({
        statusCode,
        body: responseBody,
        headers: responseHeaders,
      });
      return res;
    };
    
    // Process the request through the Express app
    apiApp(expressReq, res, () => {
      // This is called if no route matches
      resolve({
        statusCode: 404,
        body: { error: 'Not Found' },
        headers: responseHeaders,
      });
    });
  });
};

// Helper function to create a response from the Express result
const createResponse = (result: { statusCode: number, body: any, headers: Record<string, string> }) => {
  const { statusCode, body, headers } = result;
  
  // Create the response with the correct status code and body
  const response = NextResponse.json(body, { status: statusCode });
  
  // Add headers to the response
  Object.entries(headers).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  
  return response;
};

// Handle all API routes
export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

export async function PUT(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

export async function DELETE(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

export async function PATCH(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

export async function OPTIONS(request: NextRequest, { params }: { params: { route: string[] } }) {
  const result = await processRequest(request);
  return createResponse(result);
}

// Ensure dynamic rendering for API routes
export const dynamic = 'force-dynamic';
