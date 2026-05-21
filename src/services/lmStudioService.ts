export interface LMStudioMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LMStudioRequest {
  model: string;
  messages: LMStudioMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface LMStudioResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ConversationHistory {
  [contactId: string]: LMStudioMessage[];
}

class LMStudioService {
  private readonly API_URL = process.env.NODE_ENV === 'development' 
    ? ''  // Use Vite proxy in development
    : 'http://192.168.47.1:1234';  // Direct connection in production
  private readonly MODEL = 'qwen/qwen3-4b-2507';
  private readonly SYSTEM_PROMPT = `Kamu adalah asisten AI di aplikasi Gnoseon. Berikan jawaban yang SANGAT RINGKAS, JELAS, dan TEPAT sasaran.

Aturan wajib:
- Maksimal 2-3 kalimat untuk jawaban informatif
- 1 kalimat untuk jawaban sederhana
- Fokus pada solusi, bukan penjelasan panjang
- Gunakan bahasa yang mudah dimengerti
- Jika ditanya fitur, sebutkan langsung caranya

Contoh:
Q: "Cara kirim pesan?"
A: "Klik kontak, tulis pesan di kotak bawah, lalu klik Send."

Bantu pengguna gunakan fitur Gnoseon dengan cepat dan efisien.`;
  private readonly BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3001';
  
  private conversationHistory: ConversationHistory = {};
  private requestQueue: Array<{
    contactId: string;
    message: string;
    resolve: (response: string) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private isProcessing = false;
  private cache = new Map<string, string>();
  private rateLimitTracker = new Map<string, number[]>();

  async sendMessage(contactId: string, message: string): Promise<string> {
    // Check rate limiting
    if (this.isRateLimited(contactId)) {
      return 'Mohon tunggu sebentar, terlalu banyak permintaan dalam waktu singkat.';
    }

    // Check cache first
    const cacheKey = `${contactId}:${message}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        contactId,
        message,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        const response = await this.processMessage(request.contactId, request.message);
        request.resolve(response);
        
        // Cache the response
        const cacheKey = `${request.contactId}:${request.message}`;
        this.cache.set(cacheKey, response);
        
        // Clean old cache entries (keep last 100)
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) {
            this.cache.delete(firstKey);
          }
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
        request.reject(error as Error);
      }
    }

    this.isProcessing = false;
  }

  private async processMessage(contactId: string, message: string): Promise<string> {
    // Initialize conversation history if not exists
    if (!this.conversationHistory[contactId]) {
      this.conversationHistory[contactId] = [
        {
          role: 'system',
          content: this.SYSTEM_PROMPT
        }
      ];
    }

    // Add user message to history
    this.conversationHistory[contactId].push({
      role: 'user',
      content: message
    });

    // Keep only last 10 messages to manage context length
    const messages = this.conversationHistory[contactId].slice(-10);

    try {
      // Try LM Studio API first
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? '/api/lm-studio/v1/chat/completions'
        : `${this.API_URL}/v1/chat/completions`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 150,
          stream: false
        } as LMStudioRequest)
      });

      if (response.ok) {
        const data: LMStudioResponse = await response.json();
        let assistantMessage = data.choices[0]?.message?.content ?? 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
        
        // Ensure response is concise
        assistantMessage = this.truncateResponse(assistantMessage);
        
        // Add assistant response to history
        this.conversationHistory[contactId].push({
          role: 'assistant',
          content: assistantMessage
        });
        
        return assistantMessage;
      }
    } catch (error) {
      console.warn('LM Studio API unavailable, falling back to backend:', error);
    }

    // Fallback to backend API
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/bot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          contactId
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let assistantMessage = data.text || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
      
      // Ensure response is concise
      assistantMessage = this.truncateResponse(assistantMessage);

      // Add assistant response to history
      this.conversationHistory[contactId].push({
        role: 'assistant',
        content: assistantMessage
      });

      return assistantMessage;

    } catch (error) {
      console.error('Both LM Studio and Backend API failed:', error);
      throw new Error('Terjadi kesalahan saat menghubungi AI assistant. Silakan coba lagi nanti.');
    } finally {
      // Keep history manageable (last 20 messages)
      if (this.conversationHistory[contactId].length > 20) {
        this.conversationHistory[contactId] = this.conversationHistory[contactId].slice(-20);
      }
    }
  }

  private truncateResponse(response: string): string {
    // Remove excessive whitespace and newlines
    let cleaned = response.trim().replace(/\s+/g, ' ');
    
    // If response is too long, truncate at sentence boundary
    if (cleaned.length > 200) {
      const sentences = cleaned.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        if (truncated.length + sentence.length > 180) break;
        if (sentence.trim()) {
          truncated += sentence.trim() + '. ';
        }
      }
      
      cleaned = truncated.trim() || cleaned.substring(0, 180) + '...';
    }
    
    return cleaned;
  }

  private isRateLimited(contactId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitTracker.get(contactId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    // Update tracker
    this.rateLimitTracker.set(contactId, recentRequests);
    
    // Rate limit: max 10 requests per minute
    return recentRequests.length >= 10;
  }

  clearConversationHistory(contactId: string): void {
    delete this.conversationHistory[contactId];
    this.rateLimitTracker.delete(contactId);
  }

  getConversationHistory(contactId: string): LMStudioMessage[] {
    return this.conversationHistory[contactId] || [];
  }

  // Test connection to LM Studio
  async testConnection(): Promise<boolean> {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? '/api/lm-studio/v1/models'
        : `${this.API_URL}/v1/models`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('LM Studio connection test failed:', error);
      return false;
    }
  }
}

export const lmStudioService = new LMStudioService();
