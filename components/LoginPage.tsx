import React, { useState } from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
import { loginService } from '../services/firebase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);

    try {
        await loginService(email, password);
        // Auth state listener in App.tsx will handle the redirect
    } catch (err: any) {
        console.error("Login failed", err);
        let errorMessage = "Failed to sign in. Please check your credentials.";
        
        // Handle standard firebase error codes if they bubble up, or generic errors
        const code = err.code || '';

        if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
            errorMessage = "Invalid email or password.";
        } else if (code === 'auth/too-many-requests') {
            errorMessage = "Too many failed attempts. Please try again later.";
        } else if (code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }

        setError(errorMessage);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8">
            <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Terminal className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Vernacular Ops</h1>
                <p className="text-slate-400 text-sm mt-1">Enterprise Login</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-200">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                        Email Address
                    </label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="admin@vernacular.ops"
                    />
                </div>

                <div>
                     <label className="block text-sm font-medium text-slate-300 mb-1">
                        Password
                    </label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
            </form>
            
            <div className="mt-4 text-center">
                 <p className="text-[10px] text-slate-500">
                    Enter any email/password to login (Mock Mode Active)
                 </p>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;