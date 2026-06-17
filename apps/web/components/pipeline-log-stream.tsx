"use client";

import { startTransition, useEffect, useMemo, useState } from "react";

type PipelineLogStreamProps = {
  runId: string;
  initialLines: string[];
};

type ConnectionState = "connecting" | "streaming" | "closed" | "error";

export function PipelineLogStream({ runId, initialLines }: PipelineLogStreamProps) {
  const [lines, setLines] = useState(initialLines);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  const socketUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    return `${baseUrl.replace(/^http/, "ws")}/api/v1/pipelines/${runId}/logs/ws`;
  }, [runId]);

  useEffect(() => {
    const socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => setConnectionState("streaming"));
    socket.addEventListener("message", (event) => {
      startTransition(() => {
        setLines((current) => [...current, String(event.data)]);
      });
    });
    socket.addEventListener("close", () => setConnectionState("closed"));
    socket.addEventListener("error", () => setConnectionState("error"));

    return () => {
      socket.close();
    };
  }, [socketUrl]);

  return (
    <div className="pipeline-log-shell">
      <div className="meta-row muted">
        <span>WebSocket log stream</span>
        <span className={`pill ${connectionState === "error" ? "warn-pill" : connectionState === "closed" ? "muted-pill" : "accent-pill"}`}>
          {connectionState}
        </span>
      </div>
      <div className="pipeline-log top-gap-sm">
        {lines.map((line, index) => (
          <code key={`${runId}-${index}-${line}`}>{line}</code>
        ))}
      </div>
    </div>
  );
}
