import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// =========================================================================
// FIREBASE CONFIGURATION
// =========================================================================

const firebaseConfig = {
  // ⚠️ If these are placeholders, the app will automatically switch to Mock Mode.
  apiKey: "AIzaSyDummyKeyForDemonstration_ReplaceMe",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// =========================================================================
// AUTHENTICATION ABSTRACTION LAYER
// =========================================================================

// Determine if we should use Mock Auth
const isMockMode = firebaseConfig.apiKey.includes("ReplaceMe");

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

// Service Interface
let _auth: any;
let _login: (email: string, pass: string) => Promise<any>;
let _logout: () => Promise<void>;
let _subscribe: (callback: (user: AppUser | null) => void) => () => void;

if (!isMockMode) {
  // REAL FIREBASE BACKEND
  try {
    const app = initializeApp(firebaseConfig);
    _auth = getAuth(app);

    _login = (email, password) => signInWithEmailAndPassword(_auth, email, password);
    _logout = () => signOut(_auth);
    _subscribe = (callback) => onAuthStateChanged(_auth, (user) => {
        // Cast Firebase User to our AppUser interface
        callback(user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null);
    });
  } catch (error) {
    console.error("Firebase Initialization Failed. Falling back to Mock.", error);
    // Fallback logic handled below if variables aren't set
  }
} 

// MOCK BACKEND (Fallback or Default)
if (isMockMode || !_auth) {
  console.log("%c VERNACULAR OPS: RUNNING IN MOCK AUTH MODE ", "background: #6366f1; color: white; padding: 4px; border-radius: 4px;");
  
  _auth = { currentUser: null };
  
  const mockListeners = new Set<(user: AppUser | null) => void>();
  let mockUser: AppUser | null = null;

  _login = async (email, password) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate latency
      if (!email.includes('@')) throw new Error("Invalid Email Format");
      
      mockUser = {
          uid: 'mock-user-' + Math.random().toString(36).substr(2, 9),
          email: email,
          displayName: email.split('@')[0]
      };
      
      mockListeners.forEach(cb => cb(mockUser));
      return { user: mockUser };
  };

  _logout = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      mockUser = null;
      mockListeners.forEach(cb => cb(null));
  };

  _subscribe = (callback) => {
      mockListeners.add(callback);
      callback(mockUser);
      return () => mockListeners.delete(callback);
  };
}

export const auth = _auth;
export const loginService = _login;
export const logoutService = _logout;
export const subscribeToAuth = _subscribe;
