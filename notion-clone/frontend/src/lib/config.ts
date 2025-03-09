// API and WebSocket URLs
export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api';
export const SOCKET_URL = import.meta.env.PUBLIC_SOCKET_URL || 'http://localhost:5001';

// Block types
export const BLOCK_TYPES = {
  PARAGRAPH: 'paragraph',
  HEADING_1: 'heading-1',
  HEADING_2: 'heading-2',
  HEADING_3: 'heading-3',
  BULLET_LIST: 'bullet-list',
  NUMBERED_LIST: 'numbered-list',
  TODO: 'todo'
} as const;

// Type for block content
export interface BlockContent {
  text: string;
  checked?: boolean;
}

// Default content for new blocks
export function getDefaultContent(type: string): BlockContent {
  switch (type) {
    case BLOCK_TYPES.PARAGRAPH:
    case BLOCK_TYPES.HEADING_1:
    case BLOCK_TYPES.HEADING_2:
    case BLOCK_TYPES.HEADING_3:
    case BLOCK_TYPES.BULLET_LIST:
    case BLOCK_TYPES.NUMBERED_LIST:
      return { text: '' };
    case BLOCK_TYPES.TODO:
      return { text: '', checked: false };
    default:
      return { text: '' };
  }
}

// API request helper
export async function apiRequest<T = any>(endpoint: string, options: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error (${url}):`, error);
    throw error;
  }
} 