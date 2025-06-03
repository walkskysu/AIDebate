import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export const createDebateMessage = async (
  messages: Message[],
  isPositiveSide: boolean
): Promise<string> => {
  try {
    const apiUrl = isPositiveSide
      ? import.meta.env.VITE_POSITIVE_API_URL
      : import.meta.env.VITE_NEGATIVE_API_URL;
    const apiKey = isPositiveSide
      ? import.meta.env.VITE_POSITIVE_API_KEY
      : import.meta.env.VITE_NEGATIVE_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error(`API配置缺失: ${isPositiveSide ? '正方' : '反方'}`);
    }

    const model = isPositiveSide
      ? import.meta.env.VITE_POSITIVE_MODEL || 'deepseek-chat'
      : import.meta.env.VITE_NEGATIVE_MODEL || 'deepseek-chat';

    const response = await axios.post<ChatCompletionResponse>(
      `${apiUrl}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.7,
      } as ChatCompletionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('API调用失败:', error);
    return `API调用失败: ${(error as Error).message}`;
  }
};