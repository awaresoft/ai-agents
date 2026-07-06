---
name: websockets
description: WebSocket support in Fastify
metadata:
  tags: websockets, realtime, ws, socket
---

# WebSocket Support

## @fastify/websocket Basics That Bite

```typescript
app.register(websocket);

app.get("/ws", { websocket: true }, (socket, request) => {
  socket.on("message", (message) => {
    socket.send(`Echo: ${message.toString()}`);
  });
  socket.on("close", () => {
    /* cleanup */
  });
  socket.on("error", (error) => request.log.error({ err: error }, "WebSocket error"));
});
```

- The handler receives the ws `socket` directly (plus the Fastify `request`); it is a regular route otherwise — hooks, encapsulation, and prefixes all apply.
- `message` is a Buffer — `.toString()` before parsing.
- ALWAYS attach an `error` listener; an unhandled ws error event crashes the process.
- Set `options.maxPayload` (e.g. 1 MB) at registration — the default accepts large frames; enable `perMessageDeflate` deliberately, it costs memory per connection.

## Auth Happens Before the Upgrade

Run auth in `preValidation` on the websocket route — once upgraded there is no `reply`. Browsers can't set headers on WebSocket connects, so accept the token via query param fallback:

```typescript
app.get(
  "/ws",
  {
    websocket: true,
    preValidation: async (request, reply) => {
      const token = request.query.token || request.headers.authorization?.replace("Bearer ", "");
      if (!token) return reply.code(401).send({ error: "Token required" });
      try {
        request.user = await verifyToken(token);
      } catch {
        reply.code(401).send({ error: "Invalid token" });
      }
    },
  },
  (socket, request) => {
    /* request.user is set */
  },
);
```

A hook added inside an encapsulated plugin guards all ws routes of that plugin — same scoping as HTTP.

## Connection Registry, Rooms, Broadcast

Track sockets yourself (a `Set`, or `Map<roomId, Set<socket>>` for rooms); delete on `close`. Before every `send`, check `socket.readyState === WebSocket.OPEN` — sending to a closing socket throws. Broadcasting from an HTTP route is just iterating the registry. Note: an in-process registry does not span instances — multi-node broadcast needs a Redis pub/sub (or similar) fan-out layer.

## Protocol, Heartbeat, Rate Limit

- Use a JSON envelope `{ type, payload, id? }`; wrap `JSON.parse` in try/catch and answer with an error frame, never throw in the `message` listener (uncaught → connection-level error).
- Dead connections don't fire `close` — run a heartbeat: mark `isAlive = false`, `socket.ping()`, flip on `pong`; on the next interval `socket.terminate()` (not `close()` — terminate is immediate) for anything still not alive. 30 s interval is standard.
- Per-socket message rate limiting is manual (counter + window in a `Map`, cleaned up on `close`) — `@fastify/rate-limit` only covers the HTTP upgrade, not messages.

## Shutdown and Streams

On shutdown, notify and close before `app.close()`: send a `{ type: "shutdown" }` frame, then `socket.close(1001, "Server shutdown")` (1001 = going away). When bridging a server-side stream to a socket, wire BOTH directions of teardown: `stream.on("end")` closes the socket, and `socket.on("close")` calls `stream.destroy()` — otherwise abandoned streams leak.
