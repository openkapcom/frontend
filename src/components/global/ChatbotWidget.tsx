import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  X,
  Plus,
  Send,
  ArrowLeft,
  Trash2,
  Bot,
  User,
} from 'lucide-react';
import { chatService } from '@/services/chatService';
import type { ChatConversation, ChatMessage } from '@/types';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations when opened
  useEffect(() => {
    if (isOpen && !activeConversation) {
      fetchConversations();
    }
  }, [isOpen, activeConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    setLoading(true);
    try {
      const data = await chatService.getMessages(conversation.id);
      setMessages(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const conversation = await chatService.createConversation();
      setActiveConversation(conversation);
      setMessages([]);
      setConversations((prev) => [conversation, ...prev]);
    } catch {
      // ignore
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || sendingMessage) return;

    const content = input.trim();
    setInput('');
    setSendingMessage(true);

    // Optimistic user message
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      conversation_id: activeConversation.id,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatService.sendMessage(
        activeConversation.id,
        content
      );
      // response is the assistant message
      setMessages((prev) => [...prev, response]);
    } catch {
      // ignore
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBack = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              {activeConversation && (
                <Button variant="ghost" size="icon-xs" onClick={goBack}>
                  <ArrowLeft className="size-3.5" />
                </Button>
              )}
              <span className="text-sm font-semibold">
                {activeConversation
                  ? activeConversation.title || 'Chat'
                  : 'AI Assistant'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!activeConversation && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={createNewConversation}
                  title="New conversation"
                >
                  <Plus className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {activeConversation ? (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bot className="mb-2 size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Start a conversation with ScreenSense AI
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot className="size-3.5" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                        {message.role === 'user' && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                            <User className="size-3.5" />
                          </div>
                        )}
                      </div>
                    ))}
                    {sendingMessage && (
                      <div className="flex gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Bot className="size-3.5" />
                        </div>
                        <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                          Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || sendingMessage}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Conversation list */
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="mb-3 size-8 text-muted-foreground" />
                  <p className="mb-1 text-sm font-medium">No conversations</p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Start chatting with ScreenSense AI
                  </p>
                  <Button size="sm" onClick={createNewConversation}>
                    <Plus className="size-3.5" />
                    New chat
                  </Button>
                </div>
              ) : (
                <div className="py-1">
                  {conversations.map((conversation, index) => (
                    <div key={conversation.id}>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                        onClick={() => openConversation(conversation)}
                      >
                        <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate text-sm font-medium">
                            {conversation.title || 'Untitled conversation'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.messages_count} messages
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 [div:hover>&]:opacity-100"
                          onClick={(e) => deleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </button>
                      {index < conversations.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}

      {/* Floating bubble button */}
      <button
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : (
          <MessageCircle className="size-5" />
        )}
      </button>
    </>
  );
}
