import React, { useState, useRef, useEffect } from "react";
import { Search, MoreVertical, Send, Plus, LogOut, Bot, Trash2, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Separator } from "@base-ui/react";
import { MessageBubble } from "../components/MessageBubble";
import { streamMessageFromServer } from "../services/chat.service";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router";
import UserOnboardingModal from "../components/UserOnboardingModal";
import TypingIndicator from "../components/TypingIndicator";

const SESSIONS_STORAGE_KEY = "chatsupport_sessions";

const buildInitialBotMessage = (name) => ({
  id: uuidv4(),
  author: "bot",
  text: name
    ? `Hi **${name}**! 👋 I'm **Anaya**, your support assistant from Substring Technologies.\n\nI can help you **report issues**, **track existing tickets**, or **escalate your concern** to the support team. How can I help you today?`
    : `Hi there! 👋 I'm **Anaya**, your support assistant from Substring Technologies.\n\nI can help you **report issues**, **track existing tickets**, or **escalate your concern** to the support team. How can I help you today?`,
  at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
});

const Chat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  /* ── 1. Load User & Saved Sessions on Mount ── */
  useEffect(() => {
    const storedUser = localStorage.getItem("chatsupport_user");
    let currentUser = null;

    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
        setUser(currentUser);
      } catch {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }

    // Load saved sessions
    const rawSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    let loadedSessions = [];
    if (rawSessions) {
      try {
        loadedSessions = JSON.parse(rawSessions);
      } catch {
        loadedSessions = [];
      }
    }

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      setActiveSessionId(loadedSessions[0].id);
      setMessages(loadedSessions[0].messages || []);
    } else {
      // Create first default session
      const newId = uuidv4();
      const initialMsg = buildInitialBotMessage(currentUser?.name);
      const firstSession = {
        id: newId,
        title: "New Conversation",
        lastMessage: "How can I help you today?",
        updatedAt: Date.now(),
        messages: [initialMsg],
      };
      setSessions([firstSession]);
      setActiveSessionId(newId);
      setMessages([initialMsg]);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([firstSession]));
    }
  }, []);

  /* ── 2. Sync Active Session Messages to Storage ── */
  const saveSessionMessages = (sessionId, updatedMessages, newTitle = null) => {
    setSessions((prevSessions) => {
      const next = prevSessions.map((s) => {
        if (s.id === sessionId) {
          const lastMsg = updatedMessages[updatedMessages.length - 1];
          return {
            ...s,
            title: newTitle || s.title,
            lastMessage: lastMsg?.text?.slice(0, 50) || s.lastMessage,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return s;
      });
      // Sort most recent first
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  /* ── 3. Start a Brand New Chat (+) ── */
  const handleNewChat = () => {
    const newId = uuidv4();
    const initialMsg = buildInitialBotMessage(user?.name);
    const newSession = {
      id: newId,
      title: "New Conversation",
      lastMessage: "How can I help you today?",
      updatedAt: Date.now(),
      messages: [initialMsg],
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setActiveSessionId(newId);
    setMessages([initialMsg]);
    setDraft("");
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* ── 4. Switch to an Existing Chat ── */
  const handleSelectSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* ── 5. Delete a Chat Session ── */
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);

    if (remaining.length === 0) {
      // If deleted the last session, create a fresh one
      const newId = uuidv4();
      const initialMsg = buildInitialBotMessage(user?.name);
      const freshSession = {
        id: newId,
        title: "New Conversation",
        lastMessage: "How can I help you today?",
        updatedAt: Date.now(),
        messages: [initialMsg],
      };
      setSessions([freshSession]);
      setActiveSessionId(newId);
      setMessages([initialMsg]);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([freshSession]));
    } else {
      setSessions(remaining);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(remaining));
      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
        setMessages(remaining[0].messages || []);
      }
    }
  };

  /* ── 6. Auto-scroll on new messages ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── 7. Onboarding Complete ── */
  const handleOnboardingComplete = (userData) => {
    setUser(userData);
    setShowModal(false);
    // Refresh current chat welcome message with user name
    const initialMsg = buildInitialBotMessage(userData.name);
    setMessages([initialMsg]);
    saveSessionMessages(activeSessionId, [initialMsg]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ── 8. Send Message with Streaming ── */
  async function sendMessage() {
    const textMessage = draft.trim();
    if (!textMessage || sending) return;

    setSending(true);

    const userMsg = {
      id: uuidv4(),
      author: "user",
      text: textMessage,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    const isFirstUserMsg = !currentSession?.messages?.some((m) => m.author === "user");
    const autoTitle = isFirstUserMsg
      ? textMessage.length > 28
        ? textMessage.slice(0, 28) + "..."
        : textMessage
      : null;

    const botMsgId = uuidv4();
    const botMsgPlaceholder = {
      id: botMsgId,
      author: "bot",
      text: "",
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      streaming: true,
    };

    const newMessages = [...messages, userMsg, botMsgPlaceholder];
    setMessages(newMessages);
    setDraft("");

    let streamedFullText = "";

    try {
      const contextQuery = user
        ? `[User: ${user.name}, Email: ${user.email}]\n${textMessage}`
        : textMessage;

      await streamMessageFromServer(contextQuery, activeSessionId, (chunk) => {
        streamedFullText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, text: m.text + chunk } : m
          )
        );
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });

      // Mark streaming finished & save complete conversation to storage
      const finalBotMsg = {
        id: botMsgId,
        author: "bot",
        text: streamedFullText,
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        streaming: false,
      };

      const finalMessagesList = [...messages, userMsg, finalBotMsg];
      setMessages(finalMessagesList);
      saveSessionMessages(activeSessionId, finalMessagesList, autoTitle);

    } catch (err) {
      console.error("Streaming error:", err);
      const errorBotMsg = {
        id: botMsgId,
        author: "bot",
        text: "⚠️ Something went wrong. Please try again.",
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        streaming: false,
      };
      const finalMessagesList = [...messages, userMsg, errorBotMsg];
      setMessages(finalMessagesList);
      saveSessionMessages(activeSessionId, finalMessagesList, autoTitle);
    }

    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("chatsupport_user");
    navigate("/");
  };

  const isStreaming = messages.some((m) => m.streaming);

  // Filter sessions by search query
  const filteredSessions = sessions.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {showModal && <UserOnboardingModal onComplete={handleOnboardingComplete} />}

      <div className="fixed top-0 left-0 right-0 mx-auto min-h-screen max-w-7xl grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] border-x">
        {/* ── Left Sidebar (Chat History) ── */}
        <div className="h-full">
          <aside className="hidden md:flex md:flex-col border-r h-full bg-card/40">
            {/* User info strip */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/40">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Top Action Bar: New Chat + Search */}
            <div className="p-3 flex items-center gap-2 border-b">
              <Button
                id="new-chat-btn"
                onClick={handleNewChat}
                size={"icon"}
                variant={"default"}
                className={"h-9 w-9 shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-sm cursor-pointer"}
                title="Start New Conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 pr-3 w-full border rounded-xl text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="h-3.5 w-3.5 pointer-events-none absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredSessions.length === 0 ? (
                  <div className="p-6 flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <Bot className="h-8 w-8 opacity-25" />
                    <p className="text-xs">No conversations found</p>
                  </div>
                ) : (
                  filteredSessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`group relative flex items-center gap-3 w-full p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                          isActive
                            ? "bg-accent shadow-xs border border-border"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          <MessageSquare className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-semibold truncate ${isActive ? "text-foreground" : "text-foreground/90"}`}>
                              {s.title}
                            </p>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {s.lastMessage}
                          </p>
                        </div>

                        {/* Delete conversation icon on hover */}
                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          title="Delete conversation"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>
        </div>

        {/* ── Main Chat Section ── */}
        <section className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0">
            <div className="flex gap-3 items-center">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-violet-600 text-white font-semibold">
                  AN
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Anaya — Support Assistant</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isStreaming ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                      </span>
                      Typing...
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Online
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={handleNewChat}
                variant={"outline"}
                size={"sm"}
                className={"text-xs gap-1.5 rounded-lg md:hidden cursor-pointer"}
              >
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
              <Button
                onClick={handleLogout}
                variant={"ghost"}
                size={"icon"}
                className={"h-8 w-8"}
                title="Leave chat"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
              {messages.map((chat) => (
                <MessageBubble key={chat.id} author={chat.author} at={chat.at}>
                  {chat.text}
                </MessageBubble>
              ))}

              {messages.some((m) => m.streaming && m.text === "") && (
                <TypingIndicator />
              )}

              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="border-t p-3 bg-background/80 backdrop-blur-sm shrink-0">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <Input
                ref={inputRef}
                id="chat-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Anaya..."
                className="flex-1 rounded-xl h-11"
                disabled={sending || showModal}
              />
              <Button
                id="send-button"
                disabled={sending || !draft.trim() || showModal}
                onClick={sendMessage}
                className="rounded-xl px-5 h-11 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white border-0 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Press <kbd className="px-1 py-0.5 rounded border text-[9px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded border text-[9px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Chat;
