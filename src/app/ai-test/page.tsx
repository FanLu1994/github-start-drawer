'use client';

import { useState } from 'react';
import { ChatMessage, AIResponse } from '@/lib/ai/types';

export default function AITestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // 检查配置状态
  const checkConfig = async () => {
    try {
      const response = await fetch('/api/ai/config');
      const data = await response.json();
      setIsConfigured(data.isConfigured);
    } catch (error) {
      console.error('检查配置失败:', error);
    }
  };

  // 配置 API key
  const configureApiKey = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API key');
      return;
    }

    try {
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim()
        }),
      });

      if (response.ok) {
        setIsConfigured(true);
        alert('配置成功！');
      } else {
        const error = await response.json();
        alert(`配置失败: ${error.error}`);
      }
    } catch (error) {
      console.error('配置失败:', error);
      alert('配置失败，请检查网络连接');
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const aiResponse: AIResponse = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date()
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败，请检查网络连接和 API 配置');
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话
  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">AI 聊天测试</h1>
        
        {/* 配置区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API 配置</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="请输入您的 DeepSeek API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={configureApiKey}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              配置
            </button>
            <button
              onClick={checkConfig}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              检查状态
            </button>
          </div>
          <div className="mt-2">
            <span className={`text-sm ${isConfigured ? 'text-green-600' : 'text-red-600'}`}>
              状态: {isConfigured ? '已配置' : '未配置'}
            </span>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">对话</h2>
            <button
              onClick={clearMessages}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              清空
            </button>
          </div>

          {/* 消息列表 */}
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                开始对话吧！
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? '您' : 'AI'}
                    </div>
                    <div>{message.content}</div>
                    {message.timestamp && (
                      <div className="text-xs opacity-75 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">AI 正在思考...</span>
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入您的消息..."
              disabled={!isConfigured || isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!isConfigured || isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
