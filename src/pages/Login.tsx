import React, { useEffect } from 'react';
import { Euro } from 'lucide-react';
import { Loading } from '../components/ui/loading';

export function Login() {
  useEffect(() => {
    const cognitoUrl = import.meta.env.VITE_AWS_LOGIN_URL;
    
    if (cognitoUrl) {
      // Redirection automatique vers Cognito
      window.location.href = cognitoUrl;
    } else {
      console.error('VITE_AWS_LOGIN_URL environment variable is not defined');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <Euro className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Budget App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connexion en cours...
          </p>
        </div>
        
        <div className="flex justify-center">
          <Loading size="lg" text="Redirection vers la page de connexion" />
        </div>
      </div>
    </div>
  );
}