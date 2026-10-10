import { useState, useEffect, useRef } from 'react';
import { X, Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfile } from '@/hooks/useProfile';
const READ_KEY = 'feedback_chat_read';
interface FeedbackChatProps {
  onOpenChange?: (isOpen: boolean) => void;
}
const FeedbackChat = ({
  onOpenChange
}: FeedbackChatProps) => {
  const {
    data: profile
  } = useProfile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{
    type: 'bot' | 'user';
    text: string;
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversationStage, setConversationStage] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const avatarUrl = profile?.avatar || '';
  const displayName = profile?.name || 'Profile';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Set unread state and animation on every page load
  useEffect(() => {
    setHasUnreadMessages(true);

    // Trigger animation after a short delay
    setTimeout(() => setHasAnimated(true), 500);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto'
    });
  }, [messages, isTyping]);
  const handleExpand = () => {
    setIsExpanded(true);
    onOpenChange?.(true);
    setHasUnreadMessages(false);
    localStorage.setItem(READ_KEY, 'true');

    // Always show initial greeting on expand
    setIsTyping(true);

    // Initial greeting
    setTimeout(() => {
      setMessages([{
        type: 'bot',
        text: '👋 Hi there! Thanks for using Taleex.'
      }]);
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: "This app is still in active development, and I'm working hard to make it the best experience possible. 🚀"
        }]);
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'bot',
            text: "I'd love to hear your thoughts — what improvements or features would make Taleex more useful for you? 💬"
          }]);
          setIsTyping(false);
          setConversationStage(1);
        }, 1500);
      }, 1500);
    }, 800);
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = userInput;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage
    }]);
    setUserInput('');
    setIsTyping(true);

    // Save user message to database
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('feedback_messages').insert([{
        message: userMessage,
        type: 'user'
      }]);
    } catch (error) {
      // Silently handle error - feedback still works locally
    }

    // Bot response
    setTimeout(async () => {
      const botMessage1 = '🎉 Thank you for sharing your feedback!';
      setMessages(prev => [...prev, {
        type: 'bot',
        text: botMessage1
      }]);

      setIsTyping(true);
      setTimeout(async () => {
        const botMessage2 = "Your input helps shape the future of Taleex. If you ever have more ideas or suggestions, don't hesitate to reach out! 🙌";
        setMessages(prev => [...prev, {
          type: 'bot',
          text: botMessage2
        }]);

        setIsTyping(false);
        setConversationStage(2);
      }, 1500);
    }, 1000);
  };
  const handleClose = () => {
    setIsExpanded(false);
    onOpenChange?.(false);
    // Reset conversation state on close
    setMessages([]);
    setConversationStage(0);
    setIsTyping(false);
  };
  return <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? <button onClick={handleExpand} className="relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center group" style={{transition: 'background-color 0.3s, box-shadow 0.3s, transform 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.boxShadow = 'var(--tw-shadow)'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseLeave={(e) => {e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '';}} aria-label="Open feedback chat">
          <Bell className={`h-8 w-8 text-primary-foreground ${hasUnreadMessages ? 'animate-[swing_1s_ease-in-out_infinite]' : hasAnimated ? '' : 'animate-[swing_1s_ease-in-out_3]'}`} />
          {hasUnreadMessages && <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full border-2 border-background animate-pulse">
              <span className="absolute inset-0 w-full h-full bg-destructive rounded-full animate-ping opacity-75"></span>
            </span>}
        </button> : <Card className="fixed inset-0 md:relative md:inset-auto md:w-80 lg:w-96 h-screen md:h-[450px] lg:h-[500px] md:max-h-[70vh] shadow-2xl animate-scale-in bg-card border-0 overflow-hidden flex flex-col md:rounded-lg rounded-none">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-primary/90">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-white text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-semibold text-white block">{displayName}</span>
                
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 bg-muted/20">
            <div className="space-y-4">
              {messages.length === 0 && !isTyping && <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-muted-foreground text-sm">Start a conversation...</p>
                </div>}
              {messages.map((msg, idx) => <div key={idx} className={`flex gap-2 items-end ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'bot' && <Avatar className="h-9 w-9 shrink-0 border-2 border-white shadow-sm">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.type === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card text-white rounded-bl-md border border-border/50'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>)}

              {isTyping && <div className="flex gap-2 items-end justify-start">
                  <Avatar className="h-9 w-9 shrink-0 border-2 border-white shadow-sm">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card rounded-2xl rounded-bl-md px-5 py-3 shadow-sm border border-border/50">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Textarea ref={textareaRef} placeholder="Message..." value={userInput} onChange={e => setUserInput(e.target.value)} onFocus={() => messagesEndRef.current?.scrollIntoView({
              behavior: 'auto'
            })} className="resize-none min-h-[44px] max-h-[120px] bg-muted/50 text-white placeholder:text-muted-foreground border border-border rounded-3xl pr-3 pl-4 py-3 text-sm leading-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all" rows={1} disabled={conversationStage !== 1 || isTyping} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }} />
              </div>
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full shadow-md hover:shadow-lg transition-shadow" disabled={conversationStage !== 1 || isTyping || !userInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>}
    </div>;
};

export default FeedbackChat;