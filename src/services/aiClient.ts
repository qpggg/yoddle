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
  analysis: string;
  signalId: string;
}

export interface AIRecommendationResponse {
  success: boolean;
  recommendation: string;
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
    this.baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('📦 AI Client: Данные ответа:', responseData);
      
      return responseData;
    } catch (error) {
      console.error(`❌ AI API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Анализ настроения
  async analyzeMood(moodData: MoodEntry): Promise<AIAnalysisResponse> {
    console.log('🚀 AI Client: Отправляем данные настроения:', moodData);
    console.log('🌐 AI Client: URL запроса:', `${this.baseURL}/api/ai/analyze-mood`);
    
    const requestBody = {
      ...moodData,
      userId: 1, // Временно используем ID = 1 для тестирования
    };
    
    console.log('📦 AI Client: Тело запроса:', requestBody);
    
    return this.request<AIAnalysisResponse>('/api/ai/analyze-mood', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Логирование активности
  async logActivity(activityData: ActivityEntry): Promise<AIRecommendationResponse> {
    return this.request<AIRecommendationResponse>('/api/ai/log-activity', {
      method: 'POST',
      body: JSON.stringify({
        ...activityData,
        userId: 1, // Временно используем ID = 1 для тестирования
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
