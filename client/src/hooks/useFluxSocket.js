import { useEffect, useRef, useState, useCallback } from "react";

export function useFluxSocket(onMessage) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const timer = useRef(null);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  const connect = useCallback(() => {
    const socket = new WebSocket(`ws://localhost:4000`);
    wsRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onmessage = (e) => {
      try { cbRef.current(JSON.parse(e.data)); } catch {}
    };
    socket.onclose = () => {
      setConnected(false);
      timer.current = setTimeout(connect, 2500);
    };
    socket.onerror = () => socket.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return connected;
}
