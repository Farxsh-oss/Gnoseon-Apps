# Pengujian Alur Register-Login Bot Accounts

Dokumentasi untuk pengujian alur register-login menggunakan beberapa akun bot pada aplikasi Gnoseon.

## 📋 Overview

Pengujian ini dirancang untuk memvalidasi alur register dan login dengan multiple bot accounts. Pengujian mencakup:

1. **Health Check** - Memastikan server berjalan normal
2. **Multiple User Registration** - Mendaftarkan beberapa akun bot
3. **Multiple User Login** - Login dengan akun-akun bot yang terdaftar
4. **Validation Tests** - Test validasi input dan error handling
5. **Logout Functionality** - Test logout functionality
6. **Performance Tests** - Test performa untuk concurrent operations

## 🤖 Bot Accounts

Terdapat 5 akun bot yang digunakan untuk pengujian:

| Username | Password | Display Name |
|----------|----------|--------------|
| testbot1 | botpass123 | Test Bot 1 |
| testbot2 | botpass456 | Test Bot 2 |
| testbot3 | botpass789 | Test Bot 3 |
| smartbot4 | smartpass123 | Smart Bot 4 |
| assistantbot5 | assistpass456 | Assistant Bot 5 |

## 🚀 Cara Menjalankan Pengujian

### 1. Pastikan Server Berjalan

```bash
# Start server di terminal pertama
npm run dev:server
```

### 2. Jalankan Live Tests

```bash
# Di terminal kedua, jalankan live tests
node scripts/runLiveTests.mjs
```

### 3. Jalankan Unit Tests

```bash
# Jalankan unit tests dengan mocking
npm test

# Jalankan tests dengan coverage
npm run test:coverage

# Jalankan tests dalam watch mode
npm run test:watch
```

## 📁 Struktur File

```
src/tests/
├── registerLoginTest.ts      # Main test class dengan logic pengujian
├── registerLogin.spec.ts     # Unit tests dengan mocking
└── setup.ts                  # Test setup dan utilities

scripts/
└── runLiveTests.mjs          # Script untuk live testing dengan server aktif
```

## 🔍 Test Cases

### 1. Health Check Test
- Memverifikasi server responsif
- Mengecek endpoint `/api/health`

### 2. Registration Tests
- Register multiple bot users
- Handle duplicate registration
- Validate password requirements (min 6 characters)
- Test error handling

### 3. Login Tests
- Login dengan credentials yang valid
- Handle invalid credentials
- Test empty username/password
- Test nonexistent users

### 4. Logout Tests
- Logout functionality
- User status update

### 5. Performance Tests
- Concurrent registrations
- Response time validation

## 📊 Expected Output

Contoh output yang diharapkan:

```
🚀 Starting Register-Login Flow Tests for Bot Accounts

📋 Test 1: Health Check
✅ Server is healthy

📋 Test 2: Register Multiple Bot Users
🔹 Registering testbot1...
✅ testbot1 registered successfully
🔹 Registering testbot2...
✅ testbot2 registered successfully
...

📋 Test 3: Login Multiple Bot Users
🔹 Logging in testbot1...
✅ testbot1 logged in successfully
   User ID: user-testbot1
   Display Name: Test Bot 1
   Status: online
...

============================================================
📊 TEST RESULTS SUMMARY
============================================================
Total Tests: 7
Passed: 7 ✅
Failed: 0 ❌
Success Rate: 100.0%

🤖 BOT USERS CREATED:
1. testbot1 (Test Bot 1) - ID: user-testbot1
2. testbot2 (Test Bot 2) - ID: user-testbot2
...
```

## 🛠️ Troubleshooting

### Server Tidak Berjalan
Jika muncul error "Server is not running", pastikan:
- Server berjalan di port 3001
- Tidak ada firewall yang blocking
- Server database accessible

### Database Issues
Jika ada error terkait database:
- Hapus file `data/gnoseon-server.db` untuk reset database
- Restart server
- Jalankan tests kembali

### Port Conflicts
Jika port 3001 sudah digunakan:
- Stop process yang menggunakan port 3001
- Atau ubah port configuration di server

## 📈 Coverage Metrics

Pengujian dirancang untuk mencapai coverage threshold:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🔧 Customization

### Menambah Bot Baru
Edit file `src/tests/registerLoginTest.ts`:

```typescript
const BOT_USERS = [
  // ... existing bots
  {
    username: 'newbot6',
    password: 'newpass123',
    displayName: 'New Bot 6'
  }
];
```

### Mengubah Test Parameters
Edit konfigurasi di `jest.config.js` untuk mengubah:
- Coverage threshold
- Test patterns
- Timeout values

## 📝 Notes

- Tests menggunakan real API calls untuk live testing
- Unit tests menggunakan mocks untuk isolation
- Performance tests mengukur response time
- Semua test results tersimpan dalam memory untuk analysis

## 🎯 Best Practices

1. **Reset Database**: Hapus database file sebelum testing untuk clean state
2. **Sequential Testing**: Jalankan tests secara sequential untuk avoid conflicts
3. **Error Logging**: Semua errors tercatat untuk debugging
4. **Performance Monitoring**: Monitor response times untuk performance issues
