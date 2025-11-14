// AI API Client для интеграции с backend
export interface MoodEntry {
  mood: number;
  activities: string[];
  notes: string;
  stressLevel: number;
  timestamp?: string;
}

export interface ActivityEntry {
  activity: string;
  category: string;
  duration: number;
  success: boolean;
  notes: string;
  mood?: number;
  energy?: number;
  stress?: number;
  success_rating?: number;
}

export interface AIInsight {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  category: string;
  message: string;
  priority: string;
  created_at: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis?: string;
  signalId?: string;
  error?: string;
}

export interface AIRecommendationResponse {
  success: boolean;
  recommendation?: string;
  error?: string;
}

export interface AIInsightsResponse {
  success: boolean;
  insights: AIInsight[];
}

export interface AIRecommendationsResponse {
  success: boolean;
  recommendations: AIRecommendation[];
}

export interface DailyInsightResponse {
  success: boolean;
  insight: string;
}

class AIClient {
  private baseURL: string;

  constructor() {
    // В production используем относительные пути (тот же домен)
    // В dev режиме Vite proxy обработает /api запросы
    const envApiUrl = (import.meta as any).env?.VITE_API_URL;
    const mode = (import.meta as any).env?.MODE || 'production';
    const isDev = mode === 'development';
    
    // Определяем hostname для более надежной проверки
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (envApiUrl) {
      // Если явно указан URL, используем его (приоритет)
      this.baseURL = envApiUrl;
      console.log('🔧 AI Client: Используем VITE_API_URL из env:', envApiUrl);
    } else if (isDev && isLocalhost) {
      // Только в dev режиме И на localhost используем localhost:3001 (Vite proxy обработает)
      this.baseURL = 'http://localhost:3001';
      console.log('🔧 AI Client: Dev режим на localhost, используем localhost:3001');
    } else {
      // Во всех остальных случаях (production или не localhost) используем относительные пути
      this.baseURL = '';
      console.log('🔧 AI Client: Используем относительные пути (production или не localhost)');
    }
    
    console.log('🔧 AI Client baseURL:', this.baseURL || '(относительные пути)', {
      mode,
      isDev,
      isLocalhost,
      hostname,
      hasEnvUrl: !!envApiUrl,
      currentHost: typeof window !== 'undefined' ? window.location.host : 'N/A'
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('🌐 AI Client: Выполняем запрос к:', url);
    console.log('📋 AI Client: Опции запроса:', options);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('📡 AI Client: Получен ответ:', response.status, response.statusText);

      if (!response.ok) {
        // Пытаемся получить детали ошибки из ответа
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Если не удалось распарсить JSON, используем стандартное сообщение
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('📦 AI Client: Данные ответа:', responseData);
      
      // Проверяем, есть ли ошибка в ответе
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      
      return responseData;
    } catch (error: any) {
      console.error(`❌ AI API request failed: ${endpoint}`, error);
      
      // Улучшаем сообщение об ошибке
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Ошибка подключения к серверу. Проверьте интернет-соединение.');
      }
      
      throw error;
    }
  }

  // Анализ настроения
  async analyzeMood(moodData: MoodEntry, userId?: number): Promise<AIAnalysisResponse> {
    console.log('🚀 AI Client: Отправляем данные настроения:', moodData);
    console.log('🌐 AI Client: URL запроса:', `${this.baseURL}/api/ai/analyze-mood`);
    
    if (!userId) {
      throw new Error('userId is required for mood analysis');
    }
    
    const requestBody = {
      ...moodData,
      userId: userId,
    };
    
    console.log('📦 AI Client: Тело запроса:', requestBody);
    
    return this.request<AIAnalysisResponse>('/api/ai/analyze-mood', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Логирование активности
  async logActivity(activityData: ActivityEntry, userId?: number): Promise<AIRecommendationResponse> {
    if (!userId) {
      throw new Error('userId is required for activity logging');
    }
    
    return this.request<AIRecommendationResponse>('/api/ai/log-activity', {
      method: 'POST',
      body: JSON.stringify({
        ...activityData,
        userId: userId,
      }),
    });
  }

  // Получение инсайтов
  async getInsights(userId: string = '1'): Promise<AIInsightsResponse> {
    return this.request<AIInsightsResponse>(`/api/ai/insights/${userId}`);
  }

  // Получение рекомендаций
  async getRecommendations(userId: string = '1'): Promise<AIRecommendationsResponse> {
    return this.request<AIRecommendationsResponse>(`/api/ai/recommendations?userId=${userId}`);
  }

  // Генерация дневного инсайта
  async generateDailyInsight(userId: string = '1'): Promise<DailyInsightResponse> {
    return this.request<DailyInsightResponse>('/api/ai/generate-daily-insight', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }
}

export const aiClient = new AIClient();
export default aiClient;
