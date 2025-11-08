import React, { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessageToBot } from '../services/geminiService';
import { ChatMessage } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { SparklesIcon } from './icons/SparklesIcon';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await sendMessageToBot(input, messages);
      const modelMessage: ChatMessage = { role: 'model', content: botResponse };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: "Desculpe, não consegui obter uma resposta. Por favor, tente novamente." };
      setMessages(prev => [...prev, errorMessage]);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
       <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Assistente de Chat com IA</h2>
        <p className="mt-4 text-lg text-gray-400">Pergunte-me qualquer coisa! Estou aqui para ajudar.</p>
        <p className="mt-1 text-sm text-gray-500">Com Gemini 2.5 Flash para conversas rápidas.</p>
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
              <div className="max-w-md p-3 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                 <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
	                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
	                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="mt-6 flex gap-2 items-center border-t border-gray-700 pt-4" data-tour-id="chat-input">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" isLoading={isLoading} disabled={!input.trim()}>
            Enviar
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ChatBot;