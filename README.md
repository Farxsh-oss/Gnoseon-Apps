
  # Gnōseōn - Secure Messaging Application

A modern, secure peer-to-peer messaging application built with React, TypeScript, and SQLite. Focused on privacy with military-grade end-to-end encryption, private group chats, and decentralized-ready architecture.

## 🚀 Features

- **Secure Messaging**: End-to-end encryption for private conversations
- **Group Chats**: Create and manage group conversations with admin controls
- **File Sharing**: Share files with automatic file management
- **User Management**: Block users, manage contacts, and privacy settings
- **Self-Destructing Messages**: Set expiration times for sensitive messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Customizable user interface themes
- **Real-time Notifications**: Desktop notifications and sound alerts

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: TailwindCSS, Radix UI, Material-UI
- **Database**: SQLite with better-sqlite3
- **State Management**: React Hooks, Context API
- **Authentication**: bcryptjs for password hashing
- **File Handling**: Native File API with blob URLs
- **Testing**: Jest, React Testing Library
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with ES6+ support

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gnoseon-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env file with your settings
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## 📁 Project Structure

```
src/
├── app/                    # Main application components
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── data/             # Application data and types
│   └── types.ts          # TypeScript type definitions
├── assets/               # Static assets (images, icons)
├── database/             # Database layer and types
│   ├── browser-database.ts
│   ├── database-types.ts
│   └── database.ts
├── styles/              # CSS and styling files
│   ├── fonts.css
│   ├── index.css
│   └── neumorphism.css
└── main.tsx            # Application entry point
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `VITE_DB_NAME` | Database filename | `gnoseon.db` |
| `VITE_LOG_LEVEL` | Logging level | `info` |

### Database Configuration

The application uses SQLite for local data storage. The database is automatically created on first run and includes:

- Users table with encrypted passwords
- Messages table with encryption support
- Groups and group members
- File sharing metadata
- User relationships (blocked, etc.)

## 🔐 Security Features

- **End-to-End Encryption**: Messages are encrypted using public-key cryptography
- **Password Security**: User passwords are hashed with bcryptjs
- **Message Expiration**: Self-destructing messages with configurable timers
- **User Blocking**: Privacy controls for unwanted interactions
- **Input Validation**: Comprehensive input sanitization

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Database API

The application provides a comprehensive database API for:

- User management and authentication
- Message handling with encryption
- Group chat functionality
- File sharing operations
- Contact and relationship management

See [API Documentation](docs/API.md) for detailed API reference.

## 🚀 Deployment

### Development Deployment

```bash
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy the dist/ folder to your web server
```

### Docker Deployment

```bash
# Build Docker image
docker build -t gnoseon-app .

# Run container
docker run -p 3000:3000 gnoseon-app
```

## 🗺 Roadmap

### Version 1.1 (Q2 2026)
- [ ] Voice messaging support
- [ ] Video calling integration
- [ ] Advanced search functionality
- [ ] Message reactions

### Version 1.2 (Q3 2026)
- [ ] Multi-device synchronization
- [ ] Cloud backup integration
- [ ] Advanced admin panel
- [ ] API rate limiting

### Version 2.0 (Q4 2026)
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Push notifications
- [ ] Performance monitoring

## 🐛 Troubleshooting

### Common Issues

**Database not loading**
- Check browser permissions for local storage
- Ensure SQLite is supported in your browser

**Messages not sending**
- Verify database connection
- Check user authentication status

**File upload issues**
- Check file size limits
- Verify supported file types

### Getting Help

- Check our [FAQ](docs/FAQ.md)
- Search existing [Issues](../../issues)
- Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original design from [Figma](https://www.figma.com/design/BhT6FpYU1TWK7tzq1lAjnf/Make-app-responsive)
- Built with modern web technologies
- Community contributors and testers

## 📞 Contact

For questions or support, please:
- Open an issue on GitHub
- Contact the development team
- Check our documentation

---

**Built with ❤️ by the Gnōseōn team**
  