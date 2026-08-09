# AGENTS.md - AI Assistant Configuration

## Overview
This document provides guidelines for AI assistants (like GitHub Copilot, Claude, etc.) working with the PTP Website Frontend codebase.

## Project Structure
```
PTP-website-frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── tests/               # Test files
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Tech Stack
- **Frontend Framework**: React with TypeScript
- **Package Manager**: npm/yarn
- **Build Tool**: Vite/Webpack
- **Testing**: Jest/Vitest
- **Styling**: CSS-in-JS or Tailwind CSS
- **State Management**: React Context API or Redux

## Key Guidelines for Assistants

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic

### Component Development
- Create reusable, single-responsibility components
- Use proper prop typing with TypeScript interfaces
- Implement proper loading/error states
- Follow React best practices

### API Integration
- Use services folder for API calls
- Implement proper error handling and retry logic
- Add request/response interceptors where needed
- Cache responses appropriately

### Testing
- Write unit tests for utilities and hooks
- Add integration tests for components
- Maintain minimum 80% code coverage

### Performance
- Optimize component re-renders with React.memo and useMemo
- Use code splitting for routes
- Optimize images and assets
- Monitor bundle size

## Common Tasks

### Adding a New Component
1. Create component in `src/components/`
2. Define TypeScript interfaces for props
3. Add unit tests in `tests/components/`
4. Export from component index if needed

### Adding an API Endpoint
1. Create service in `src/services/`
2. Define request/response types
3. Handle errors appropriately
4. Add tests for the service

### Fixing Bugs
1. Reproduce the bug with a test case
2. Implement the fix
3. Add regression test
4. Update documentation if needed

## Resources
- Documentation: Check README.md
- Configuration: Review tsconfig.json, .eslintrc, prettier.config.js
- Dependencies: See package.json for available libraries
