import '@testing-library/jest-dom';

// Mock window.location
const locationMock = {
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  _href: 'http://localhost/',
  get href() {
    return this._href;
  },
  set href(val: string) {
    if (val.startsWith('/')) {
      this._href = 'http://localhost' + val;
    } else {
      this._href = val;
    }
  },
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost',
  hostname: 'localhost',
  port: '',
  protocol: 'http:',
  host: 'localhost',
  toString: jest.fn(function(this: any) { return this.href; }),
};

delete (window as any).location;
(window as any).location = locationMock;

// Environment variable injection helper
const initialEnv = {
  VITE_API_BASE_URL: 'http://localhost:3001/api',
  DEV: false,
  MODE: 'test',
};

(globalThis as any).importMetaEnv = { ...initialEnv };

export const setEnv = (key: string, value: any) => {
  (globalThis as any).importMetaEnv[key] = value;
};

export const resetEnv = () => {
  (globalThis as any).importMetaEnv = { ...initialEnv };
};

// Mock uuid
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `test-uuid-${uuidCounter++}`),
}));

// Mock localStorage with actual storage behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  (fetch as jest.Mock).mockClear();

  // Reset environment variables
  resetEnv();
});

// Helper function to mock successful API responses
export const mockSuccessResponse = (data: any) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    status: 200,
  });
};

// Helper function to mock failed API responses
export const mockErrorResponse = (error: string, status: number = 400) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error }),
    status,
  });
};

// Helper function to mock network error
export const mockNetworkError = () => {
  (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
};
