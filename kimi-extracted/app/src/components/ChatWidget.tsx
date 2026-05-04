import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ShoppingBag, Sparkles, Film, Camera } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';

const services = [
  {
    id: 'static',
    title: '30 Static Images',
    price: '₱499',
    description: '30 high-quality static ad images for your brand',
    icon: <Camera className="w-4 h-4" />,
  },
  {
    id: 'ugc',
    title: 'UGC Ads',
    price: '₱999',
    description: 'Authentic user-generated content style ads',
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    id: 'cinematic',
    title: 'Cinematic Ads',
    price: '₱1,499',
    description: 'Storytelling cinematic video ads',
    icon: <Film className="w-4 h-4" />,
  },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showServices, setShowServices] = useState(true);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const followUpTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { user } = useAuth();

  const { data: messages, refetch } = trpc.chat.myMessages.useQuery(undefined, {
    enabled: !!user && isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      setMessage('');
      setSendError(null);
      refetch();
    },
    onError: (err) => {
      setSendError(err.message || 'Failed to send message. Please try again.');
    },
  });

  // Auto follow-up messages
  useEffect(() => {
    if (!isOpen || !user) {
      // Clear all timers when chat closes
      followUpTimers.current.forEach(clearTimeout);
      followUpTimers.current = [];
      return;
    }

    // Reset follow-ups when reopening
    setFollowUps([]);
    setShowServices(true);

    // Follow-up 1: After 3 seconds - mention free features + services
    const t1 = setTimeout(() => {
      setFollowUps(prev => {
        if (prev.includes('fu1')) return prev;
        return [...prev, 'fu1'];
      });
    }, 3000);

    // Follow-up 2: After 20 seconds - encourage ordering
    const t2 = setTimeout(() => {
      setFollowUps(prev => {
        if (prev.includes('fu2')) return prev;
        return [...prev, 'fu2'];
      });
    }, 20000);

    // Follow-up 3: After 45 seconds - final nudge with urgency
    const t3 = setTimeout(() => {
      setFollowUps(prev => {
        if (prev.includes('fu3')) return prev;
        return [...prev, 'fu3'];
      });
    }, 45000);

    followUpTimers.current = [t1, t2, t3];

    return () => {
      followUpTimers.current.forEach(clearTimeout);
    };
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, followUps]);

  const handleSend = (text: string) => {
    if (!text.trim() || !user) return;
    setSendError(null);
    sendMutation.mutate({ message: text.trim() });
    setShowServices(false);
  };

  const handleServiceClick = (service: typeof services[0]) => {
    const text = `Hi! I'm interested in ordering ${service.title} for ${service.price}. Can you give me more details?`;
    handleSend(text);
  };

  if (!user) return null;

  const sortedMessages = messages ? [...messages].reverse() : [];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
          {messages && messages.some(m => m.isAdmin && !m.isRead) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">!</span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">BC AI Support</p>
                <p className="text-[10px] text-blue-100">Reply within 24 hours</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 text-sm text-gray-700 border border-blue-100">
              <p className="font-semibold mb-1">Welcome! 👋</p>
              <p className="text-xs text-gray-500">You have free access to all our AI tools — audience targeting, captions, and video scripts! Need custom ad creatives? Order below. 📩</p>
            </div>

            {/* Auto Follow-up Messages */}
            {followUps.includes('fu1') && (
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-gray-700 border border-amber-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="font-semibold text-amber-800 mb-1">💡 Did you know?</p>
                <p className="text-xs text-gray-600">All our AI generators are 100% FREE — buyer personas, Facebook keywords, demographics, captions, and video scripts. If you need actual ad images or videos, our team can create them for you starting at just ₱499!</p>
              </div>
            )}
            {followUps.includes('fu2') && (
              <div className="bg-pink-50 rounded-xl p-3 text-sm text-gray-700 border border-pink-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="font-semibold text-pink-800 mb-1">🎨 Need eye-catching creatives?</p>
                <p className="text-xs text-gray-600">While our AI gives you the strategy and scripts, our designers can produce the actual visuals. Tap a service above to get started — we reply within hours!</p>
              </div>
            )}
            {followUps.includes('fu3') && (
              <div className="bg-green-50 rounded-xl p-3 text-sm text-gray-700 border border-green-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="font-semibold text-green-800 mb-1">⚡ Limited slots this week!</p>
                <p className="text-xs text-gray-600">We only take 10 creative orders per week to ensure quality. Secure your spot now — just tap any service above and we'll message you back with next steps!</p>
              </div>
            )}

            {/* Service Cards */}
            {showServices && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Our Services</p>
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="w-full text-left p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                        {service.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{service.title}</p>
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-700">{service.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages */}
            {sortedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.isAdmin
                      ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      : 'bg-blue-600 text-white rounded-tr-sm'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-gray-400' : 'text-blue-200'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            {sendError && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
                <span className="w-4 h-4 flex-shrink-0 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold">!</span>
                {sendError}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => { setMessage(e.target.value); setSendError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(message)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSend(message)}
                disabled={!message.trim() || sendMutation.isPending}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {sendMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
