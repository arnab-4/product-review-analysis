
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, User, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    reviewsAnalyzed?: number;
    averageRating?: string;
    sentimentBreakdown?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

interface ProductReviewChatbotProps {
  productId: string;
  productName: string;
}

// Component to render markdown-style formatting
const MarkdownMessage = ({ content }: { content: string }) => {
  const renderContent = () => {
    // Split content by lines
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${index}`} />);
      } else if (line.startsWith('**') && line.endsWith(':**')) {
        // Headers like **📊 Review Summary:**
        const headerText = line.replace(/\*\*/g, '');
        elements.push(
          <div key={index} className="font-bold text-slate-800 mt-3 mb-2 text-sm">
            {headerText}
          </div>
        );
      } else if (line.startsWith('* **') || line.startsWith('• **')) {
        // Bold bullet points like * **Overwhelmingly Positive:**
        const bulletText = line.replace(/^[*•]\s*/, '').replace(/\*\*/g, '');
        elements.push(
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-blue-600 mt-1">•</span>
            <span className="text-xs leading-relaxed">
              <span className="font-semibold">{bulletText}</span>
            </span>
          </div>
        );
      } else if (line.startsWith('* ') || line.startsWith('• ')) {
        // Regular bullet points
        const bulletText = line.replace(/^[*•]\s*/, '');
        elements.push(
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-blue-600 mt-1">•</span>
            <span className="text-xs leading-relaxed">{bulletText}</span>
          </div>
        );
      } else if (line.trim()) {
        // Regular text
        elements.push(
          <div key={index} className="text-xs leading-relaxed mb-2">
            {line}
          </div>
        );
      }
    });
    
    return elements;
  };

  return <div className="space-y-1">{renderContent()}</div>;
};

const ProductReviewChatbot = ({ productId, productName }: ProductReviewChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chatbot opens
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: `Hi! I'm here to help you learn about ${productName} based on customer reviews. Ask me anything about the product's quality, features, pros and cons, or what customers are saying!`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, productName]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      console.log('Sending chatbot request:', { productId, question: inputText, productName });
      
      const { data, error } = await supabase.functions.invoke('product-review-chatbot', {
        body: {
          productId,
          question: inputText,
          productName
        }
      });

      if (error) {
        console.error('Chatbot error:', error);
        throw error;
      }

      console.log('Chatbot response:', data);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: data.answer,
        timestamp: new Date(),
        metadata: {
          reviewsAnalyzed: data.reviewsAnalyzed,
          averageRating: data.averageRating,
          sentimentBreakdown: data.sentimentBreakdown
        }
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show a user-friendly error message
      toast({
        title: "Connection Issue",
        description: "Having trouble connecting to the review analysis service. The chatbot is still functional with basic review data.",
        variant: "destructive",
      });

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: "I'm having some technical difficulties right now, but I can still help! Try asking me about the product's ratings, positive/negative feedback, or specific features mentioned in reviews.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white"
          size="lg"
          aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
        >
          {isOpen ? <X size={28} className="transition-transform duration-200 hover:rotate-90" /> : <MessageCircle size={28} />}
        </Button>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 w-[98vw] max-w-md mx-auto md:right-6 h-[70vh] max-h-[600px] bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl shadow-md flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
              <Bot size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Review Assistant</h3>
              <p className="text-xs text-blue-100">Ask about {productName}</p>
            </div>
            <button
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
              className="rounded-full hover:bg-white/10 p-1.5 transition-colors duration-150"
            >
              <X size={19} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-transparent backdrop-blur-sm">
            {messages.map((message, i) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 shadow shadow-blue-100">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`
                      p-4 rounded-2xl 
                      transition-colors duration-300
                      ${message.type === 'user' ? 
                        'bg-blue-600 text-white ml-auto shadow-lg' : 
                        'bg-white/90 text-slate-800 border border-slate-100 shadow'
                      }
                      ${message.type === 'bot' ? 'bot-bubble border-b-4 border-blue-200' : ''}
                    `}
                  >
                    {message.type === 'bot' ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  {message.metadata && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-xs shadow border-b-4">
                      <div className="flex items-center gap-1 mb-2">
                        <BarChart3 size={14} className="text-blue-600" />
                        <span className="font-semibold text-blue-800">Analysis Summary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-700">
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-medium">Reviews:</span> {message.metadata.reviewsAnalyzed}
                        </div>
                        <div className="bg-white rounded px-2 py-1">
                          <span className="font-medium">Rating:</span> {message.metadata.averageRating}/5
                        </div>
                        {message.metadata.sentimentBreakdown && (
                          <>
                            <div className="bg-green-50 text-green-700 rounded px-2 py-1">
                              <span className="font-medium">👍 Positive:</span> {message.metadata.sentimentBreakdown.positive}
                            </div>
                            <div className="bg-red-50 text-red-700 rounded px-2 py-1">
                              <span className="font-medium">👎 Negative:</span> {message.metadata.sentimentBreakdown.negative}
                            </div>
                            {message.metadata.sentimentBreakdown.neutral > 0 && (
                              <div className="bg-gray-50 text-gray-700 rounded px-2 py-1 col-span-2">
                                <span className="font-medium">😐 Neutral:</span> {message.metadata.sentimentBreakdown.neutral}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 shadow shadow-slate-100">
                    <User size={16} className="text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow shadow-blue-100">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/90 border border-slate-100 p-4 rounded-2xl shadow">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white/80 rounded-b-2xl backdrop-blur flex items-center">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the product reviews..."
              className="flex-1 p-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white/60"
              rows={2}
              disabled={isLoading}
              style={{ transition: 'box-shadow 0.2s' }}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`ml-2 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 p-3 rounded-xl shadow-md transition-all duration-200 active:scale-95 ${(!inputText.trim() || isLoading) ? "opacity-60 cursor-not-allowed" : ""}`}
              aria-label="Send"
              type="button"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductReviewChatbot;
