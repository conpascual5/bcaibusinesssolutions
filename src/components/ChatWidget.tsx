import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatList, refetch: refetchChats } = trpc.chat.list.useQuery(undefined, {
    enabled: !!user && isOpen,
  });
  const { data: chatMessages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { chatId: selectedChatId! },
    { enabled: !!selectedChatId && isOpen }
  );
  const createChatMutation = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setSelectedChatId(data.id);
      refetchChats();
    },
  });
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchChats();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim()) return;
    if (selectedChatId) {
      sendMessageMutation.mutate({ chatId: selectedChatId, content: message });
    } else {
      createChatMutation.mutate({ title: message.slice(0, 50) });
    }
    setMessage('');
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '500px' }}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-semibold">AI Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {!selectedChatId && chatList && chatList.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Your Chats</p>
                {chatList.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className="w-full text-left px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{chat.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                  </button>
                ))}
                <button
                  onClick={() => createChatMutation.mutate({ title: 'New Chat' })}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  + New Chat
                </button>
              </div>
            )}

            {!selectedChatId && (!chatList || chatList.length === 0) && (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Start a new conversation</p>
              </div>
            )}

            {selectedChatId && (
              <>
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold mb-2 block"
                >
                  &larr; Back to chats
                </button>
                {chatMessages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedChatId ? 'Type a message...' : 'Start a new chat...'}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

