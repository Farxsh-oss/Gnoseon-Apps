class LmStudioService {
  async sendMessage(_sessionId: string, message: string): Promise<string> {
    try {
      const response = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Bot API error');
      const data = await response.json();
      return data.text || 'Tidak ada respons dari bot.';
    } catch {
      return 'Bot sedang tidak tersedia. Silakan coba lagi nanti.';
    }
  }
}

export const lmStudioService = new LmStudioService();
export default lmStudioService;
