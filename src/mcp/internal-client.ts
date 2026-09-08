import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpServer } from "./server";
import { MCP_CLIENT_INTERNAL } from "./types";

// The AI concierge is a genuine MCP client, not a direct function-call loop:
// it connects to a real McpServer over a real (in-process) MCP transport and
// speaks the actual protocol (tools/list, tools/call), same as an external
// client would over HTTP — the only difference is the transport.
//
// One real SDK gap this works around: InMemoryTransport.send() accepts an
// `authInfo` option (confirmed in the SDK's own type defs — it flows to the
// receiving side's onmessage extra, which Protocol threads into every tool
// handler's RequestHandlerExtra.authInfo), but the high-level Client class's
// request methods (listTools/callTool) don't expose a way to pass it through
// per-call — only `{relatedRequestId, resumptionToken, onresumptiontoken}`
// reach transport.send() from there. So the client-side transport's own
// `send` is wrapped here to always attach the fixed authInfo for this
// connection's lifetime — a legitimate use of a documented SDK primitive,
// just wired at the transport layer since the convenience API doesn't
// surface it.
//
// A fresh Client + fresh McpServer + fresh linked transport pair per call,
// not a shared singleton: Protocol.connect() throws on a second connect by
// design (see mcp/server.ts) — exactly the constraint that would otherwise
// cause concurrent chat requests to corrupt each other's identity.
export interface InternalMcpSession {
  client: Client;
  close: () => Promise<void>;
}

export async function connectInternalMcpClient(authInfo: AuthInfo): Promise<InternalMcpSession> {
  // Passing authInfo here means the server only ever *registers* the tools
  // this caller's scopes include — tools/list is honest at the source, not
  // just enforced at call time. groq-client.ts previously also filtered the
  // listed tools client-side before offering them to Groq; that filter is
  // now redundant (listTools() already returns only what's visible) but
  // harmless, so it stays as an explicit defense-in-depth check rather than
  // being the only thing standing between an unauthorized tool and the model.
  const server = createMcpServer(authInfo);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const rawSend = clientTransport.send.bind(clientTransport);
  clientTransport.send = (message, options) => rawSend(message, { ...options, authInfo });

  const client = new Client({ name: MCP_CLIENT_INTERNAL, version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
