import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon.jsx";

const DEFAULT_SUGGESTIONS = [
  "How do I register a property?",
  "What documents are required?",
  "Calculate stamp duty",
  "How does deed QR verification work?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am Bhoomi Assistant, your land registration & title deeds guide. Ask me anything about registration steps, mandatory documents, or deed verification.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function sendMessage(textToSend) {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
        if (data.suggestions?.length) {
          setSuggestions(data.suggestions);
        }
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I can help with: 1) Registering property on the portal, 2) Finding required documents, 3) Surveyor boundary verification, and 4) Digital Deed QR verification.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
      {/* Floating Toggle Button */}
      {!open && (
        <button
          className="btn"
          onClick={() => setOpen(true)}
          style={{
            background: "var(--green-900)",
            color: "#f6f2e8",
            borderRadius: "50px",
            padding: "12px 20px",
            boxShadow: "0 4px 16px rgba(20,51,37,0.35)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            border: "1.5px solid var(--gold-500)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>💬</span>
          <span>Bhoomi Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          style={{
            width: "360px",
            maxWidth: "calc(100vw - 32px)",
            height: "520px",
            maxHeight: "calc(100vh - 100px)",
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 32px rgba(0,0,0,0.22)",
            border: "1px solid var(--line-strong)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--green-900)",
              color: "#f6f2e8",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid var(--gold-500)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.3rem" }}>🏛️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Bhoomi Assistant</div>
                <div style={{ fontSize: "0.72rem", color: "var(--gold-500)" }}>Digital Land Records Helpdesk</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#f6f2e8",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#fafcfb",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: m.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.sender === "user" ? "var(--green-700)" : "#ffffff",
                  color: m.sender === "user" ? "#ffffff" : "var(--ink)",
                  fontSize: "0.85rem",
                  lineHeight: "1.45",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  border: m.sender === "user" ? "none" : "1px solid var(--line)",
                  whiteSpace: "pre-line",
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 12px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  color: "var(--ink-soft)",
                }}
              >
                Bhoomi Assistant is thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div
            style={{
              padding: "8px 12px",
              background: "#ffffff",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s)}
                style={{
                  fontSize: "0.72rem",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  border: "1px solid var(--line-strong)",
                  background: "var(--paper-soft)",
                  color: "var(--ink)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              padding: "10px 12px",
              background: "#ffffff",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.85rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--line-strong)",
              }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !input.trim()}
              style={{ padding: "0 12px" }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
