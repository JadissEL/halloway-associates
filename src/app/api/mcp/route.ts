import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/mcp/server";
import { authorizeExternalMcpRequest } from "@/lib/mcp-external-auth";

// Real, spec-compliant MCP over HTTP (stateless — sessionIdGenerator:
// undefined, appropriate for a serverless-style Next.js route: no
// in-memory session survives between requests, each request is
// self-contained). This registers the SAME tool set (src/mcp/server.ts)
// the internal AI concierge talks to via an in-process transport — an
// external, authorized MCP client sees and can call exactly the tools its
// scopes allow, through the exact same authorization/audit path. A fresh
// server per request, not a shared singleton: the SDK's Protocol.connect()
// throws on a second connect, by design, for exactly this concurrent-request
// scenario (see the comment in mcp/server.ts).
async function handle(request: Request): Promise<Response> {
  const authInfo = authorizeExternalMcpRequest(request);
  if (!authInfo) {
    return Response.json(
      { error: "Unauthorized. Provide a valid x-mcp-client-key header." },
      { status: 403 },
    );
  }

  const server = createMcpServer(authInfo);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(request, { authInfo });
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function DELETE(request: Request) {
  return handle(request);
}
