"use client"
import React from "react";
import Breadcrumbs from "apps/admin-ui/src/shared/component/breadcrumbs";
import { Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";


type LogType = "success" | "error" | "warning" | "info" | "debug";

type Logitem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
}

const typeColorMap: Record<LogType, string> = {
  success: "text-green-400",
  error: "text-red-500",
  warning: "text-yellow-300",
  info: "text-blue-300",
  debug: "text-gray-400"
};


const Loggers = () => {
  const [logs, setLogs] = useState<Logitem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Logitem[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:6008");
    ws.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        setLogs((prevLogs) => [...prevLogs, log]);
        setFilteredLogs((prevLogs) => [...prevLogs, log]);
      } catch (error) {
        console.error("Error parsing log:", error);
      }
    };
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    setFilteredLogs(logs);
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  //handle key presses for filtering
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        setFilteredLogs(logs.filter(log => log.type === "error"));
      }
      if (event.key === "2") {
        setFilteredLogs(logs.filter(log => log.type === "success"));
      }
      if (event.key === "0") {
        setFilteredLogs(logs);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);

  }, [logs]);

  const downLoadLogs = () => {
    const content = filteredLogs.map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.source}[${log.type.toUpperCase()}] ${log.message}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Application-logs.log";
    link.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
      {/* headers */}
      <div className="flex justify-between items mb-3">
        <h2 className="text-xl font-bold items-center">Applications Logs</h2>
        <button onClick={downLoadLogs} className="text-xs px-3 flex items-center gap-1 py-2 bg-gray-400 rounded">
          <Download size={18} className="bg-blue-700 p-1 rounded" /> Download Logs</button>
      </div>

      {/* {BreadCrumbs} */}
      <div className="mb-4">
        <Breadcrumbs title="Application Logs" />
      </div>

      {/* Terminal Log Stream */}

      <div ref={logContainerRef}
        className="bg-black font-mono border border-gray-900 rounded-md p-4 h-[600px] overflow-y-auto space-y-1">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500">Waiting for logs...</p>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="whitespace=pre-wrap">
              <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
              <span className={typeColorMap[log.type]}>{log.source}</span>{" "}
              <span className={typeColorMap[log.type]}>{log.type.toUpperCase()}</span>{" "}
              <span>{log.message}</span>
              <br />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Loggers;