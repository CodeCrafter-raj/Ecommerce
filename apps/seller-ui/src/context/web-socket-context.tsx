"use client"
import { useEffect, useRef, useState, createContext } from "react"
import React from "react";


const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  seller
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!seller?.id) return;
    const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI!);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(`seller_${seller.id}`);
      setWsReady(true);
    }
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log(data);
      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        console.log(conversationId, count);
        setUnreadCounts((prev) => {
          return {
            ...prev,
            [conversationId]: count
          }
        })
      }
    }
    return () => {
      ws.close();
    };
  }, [seller?.id]);

  if (!wsReady) return null;
  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return React.useContext(WebSocketContext);
};