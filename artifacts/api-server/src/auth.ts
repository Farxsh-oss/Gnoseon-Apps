import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ServerDatabaseService } from './server-database';

interface SocketWithUser extends Socket {
  data: {
    user: any;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'gnoseon-secret-key-change-in-production';

export function authenticateSocket(socket: any, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // For now, we'll use a simple token validation
    // In production, you'd want proper JWT validation
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return next(new Error('Invalid authentication token'));
    }

    // Initialize database and verify user exists
    const db = new ServerDatabaseService();
    const user = db.getUserById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.data.user = user;
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export type { SocketWithUser };
