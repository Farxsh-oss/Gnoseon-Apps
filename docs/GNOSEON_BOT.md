# Gnoseon Bot Integration

## Overview

Gnoseon Bot adalah AI assistant yang terintegrasi dengan aplikasi Gnoseon untuk membantu pengguna memahami fitur aplikasi, menjawab pertanyaan teknis, dan menjaga percakapan tetap relevan dengan konteks aplikasi.

## Fitur Utama

### 1. AI Assistant dengan LM Studio
- **Model**: `mistralai/ministral-3-3b`
- **Endpoint**: `http://192.168.47.1:1234`
- **System Prompt**: Chatbot khusus aplikasi Gnoseon
- **Fallback**: Backend API jika LM Studio tidak tersedia

### 2. Conversation History & Memory
- Menyimpan 20 pesan terakhir per kontak
- Context management otomatis
- Sistem prompt yang konsisten

### 3. Backend Optimizations

#### Caching Middleware
- **TTL**: 5 menit default
- **Scope**: GET requests ke `/api/`
- **Storage**: In-memory cache
- **Cleanup**: Otomatis saat expired

#### Rate Limiting
- **Limit**: 100 requests per 15 menit
- **Message**: "Mohon tunggu sebentar, terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat."
- **Headers**: `X-RateLimit-*` untuk monitoring
- **Identifier**: User ID atau IP address

#### Async Queue
- **Priority**: Higher priority tasks first
- **Retry**: Max 3 retries dengan decreasing priority
- **Status**: Real-time queue monitoring
- **Workers**: Registrasi worker per task type

## Cara Penggunaan

### 1. Mengakses Gnoseon Bot
1. Buka tab **Contacts** di aplikasi
2. Gnoseon Bot muncul di kontak pertama dengan badge "AI"
3. Klik tombol **[CHAT]** untuk memulai percakapan

### 2. Fitur Chat Interface
- **Typing Indicator**: Menunjukkan saat bot sedang berpikir
- **AI Badge**: Identifikasi visual bahwa ini adalah AI bot
- **Message History**: Percakapan tersimpan otomatis
- **Error Handling**: Pesan error yang user-friendly

## API Endpoints

### Bot Chat
```
POST /api/bot/chat
Content-Type: application/json

{
  "message": "Pertanyaan user",
  "contactId": "gnoseon-bot"
}
```

### Queue Status
```
GET /api/queue/status
Response: {
  "size": 0,
  "processing": false,
  "taskTypes": {}
}
```

## Konfigurasi

### Environment Variables
```bash
# Production
NODE_ENV=production
BACKEND_URL=https://yourdomain.com

# Development  
NODE_ENV=development
BACKEND_URL=http://localhost:3001
```

### LM Studio Configuration
1. Install LM Studio
2. Download model `mistralai/ministral-3-3b`
3. Start server di `http://192.168.47.1:1234`
4. Enable CORS untuk domain aplikasi

## Monitoring & Debugging

### Logs
- Frontend: Browser console
- Backend: Server logs dengan timestamps
- LM Studio: LM Studio console

### Queue Monitoring
```javascript
// Check queue status
fetch('/api/queue/status')
  .then(res => res.json())
  .then(console.log);
```

### Cache Status
Cache hits/misses tercatat di server logs.

## Troubleshooting

### Common Issues

#### 1. Bot tidak merespons
- **Check**: LM Studio running di correct port
- **Check**: Model loaded correctly
- **Check**: Network connectivity
- **Fallback**: Backend API akan digunakan otomatis

#### 2. Rate limit exceeded
- **Wait**: 15 menit untuk reset
- **Check**: Headers untuk remaining requests
- **Solution**: Implementasikan client-side rate limiting

#### 3. Queue backup
- **Monitor**: `/api/queue/status`
- **Action**: Restart server jika perlu
- **Prevention**: Adjust worker priorities

## Performance Considerations

### Best Practices
1. **Cache**: Pertanyaan umum akan di-cache
2. **Queue**: Heavy requests diproses asynchronously  
3. **Rate Limit**: Mencegah abuse dan overload
4. **Context Limit**: Maksimal 10 messages untuk AI context
5. **History Limit**: Maksimal 20 messages per kontak

### Scalability
- Horizontal scaling dengan shared cache (Redis)
- Load balancing untuk queue workers
- Database persistence untuk conversation history

## Security

### Measures
- Rate limiting per user/IP
- Input sanitization
- CORS configuration
- Error message sanitization

### Recommendations
- Monitor API usage patterns
- Implement authentication untuk sensitive features
- Regular security audits

## Future Enhancements

### Planned Features
- [ ] Multiple AI models support
- [ ] Custom prompts per user
- [ ] Voice input/output
- [ ] File analysis capabilities
- [ ] Integration dengan external APIs
- [ ] Advanced analytics dashboard

### Performance Improvements
- [ ] Redis cache integration
- [ ] Database conversation history
- [ ] Load balancing
- [ ] CDN for static assets

## Support

Untuk issues atau pertanyaan:
1. Check logs dan error messages
2. Verify configuration settings
3. Test dengan LM Studio disabled
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2025-03-19  
**Compatibility**: Gnoseon Apps v2.0+
