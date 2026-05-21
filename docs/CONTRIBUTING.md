# Contributing to Gnōseōn

Thank you for your interest in contributing to Gnōseōn! This guide will help you get started with contributing to our secure messaging application.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Modern web browser
- Code editor (recommended: VS Code)

### Setup

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/your-username/gnoseon.git
   cd gnoseon
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/code-cleanup` - Code refactoring
- `test/add-tests` - Adding tests

### Commit Messages

Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug in component`
- `docs: update README`
- `style: format code`
- `refactor: optimize database queries`
- `test: add unit tests for auth`

### Pull Request Process

1. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run test
   npm run test:coverage
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

## 🏗 Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type when possible
- Use proper error handling

### React Guidelines

- Use functional components with hooks
- Follow React best practices
- Use proper prop types/interfaces
- Keep components small and focused

### CSS Guidelines

- Use TailwindCSS for styling
- Follow BEM methodology for custom CSS
- Keep styles responsive
- Use CSS variables for theming

## 🧪 Testing

### Test Requirements

- Unit tests for all new functions
- Component tests for UI components
- Integration tests for user flows
- Minimum 80% code coverage

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- Header.test.tsx
```

### Writing Tests

```typescript
// Example component test
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders correctly', () => {
    render(<Header />);
    expect(screen.getByText('Gnōseōn')).toBeInTheDocument();
  });
});
```

## 📁 Project Structure

```
src/
├── app/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── hooks/            # Custom React hooks
│   ├── data/             # Data providers and context
│   └── types.ts          # Type definitions
├── database/             # Database layer
├── styles/              # Styling files
├── utils/               # Utility functions
└── tests/               # Test files
```

## 🔧 Development Tools

### Recommended VS Code Extensions

- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- GitLens

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🐛 Bug Reports

### Reporting Bugs

1. Check existing issues
2. Create new issue with:
   - Clear title
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots if applicable

### Bug Fix Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]
```

## 💡 Feature Requests

### Requesting Features

1. Check existing issues and roadmap
2. Create new issue with:
   - Feature description
   - Use case/problem
   - Proposed solution
   - Implementation ideas

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Implementation Ideas
Technical considerations or ideas
```

## 📖 Documentation

### Documentation Guidelines

- Keep documentation up-to-date
- Use clear, concise language
- Include code examples
- Add screenshots where helpful

### Documentation Types

- **README.md**: Project overview and quick start
- **API.md**: API reference documentation
- **CONTRIBUTING.md**: Contribution guidelines
- **DEPLOYMENT.md**: Deployment instructions
- **FAQ.md**: Frequently asked questions

## 🚀 Release Process

### Version Management

- Follow semantic versioning (SemVer)
- Update version in package.json
- Create release notes
- Tag releases in Git

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
- [ ] Release notes written
- [ ] Tag created
- [ ] Release published

## 🤝 Code Review

### Review Guidelines

- Be constructive and respectful
- Focus on code quality and logic
- Check for security vulnerabilities
- Verify test coverage
- Ensure documentation is updated

### Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security issues
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met

## 🎯 Areas to Contribute

### High Priority

- Security improvements
- Performance optimizations
- Bug fixes
- Test coverage

### Medium Priority

- New features
- UI/UX improvements
- Documentation
- Code refactoring

### Low Priority

- Minor enhancements
- Code cleanup
- Tool improvements

## 📞 Getting Help

### Resources

- [Documentation](../../README.md)
- [API Reference](API.md)
- [FAQ](FAQ.md)
- [Issues](../../issues)

### Communication

- GitHub Issues for bugs and features
- Discussions for questions and ideas
- Code reviews for feedback

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Annual contributor report
- Special contributor badges

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Gnōseōn! Your help is greatly appreciated. 🙏
