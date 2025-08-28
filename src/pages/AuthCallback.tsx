import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/use-toast';
import { authApi } from '../services/api';

export function AuthCallback() {
  const ranRef = useRef(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthData } = useAuthStore();

  useEffect(() => {
    if (ranRef.current) return;  // ⬅️ bloque la 2ᵉ exécution (StrictMode)
    ranRef.current = true;
    const handleCallback = async () => {
      try {
        // Récupérer le code d'autorisation depuis l'URL pour déclencher le callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('Code d\'autorisation manquant');
        }
        
        // Appeler l'API callback pour déclencher la création des cookies
        await authApi.callback(code, state || undefined);
        
        // Récupérer les informations utilisateur (l'API utilise maintenant les cookies)
        const userData = await authApi.getUserInfo();
        
        // Vérifier que nous avons reçu les données utilisateur
        if (!userData) {
          throw new Error('Données utilisateur manquantes dans la réponse');
        }
        
        setAuthData({
          id: userData.sub || userData.id,
          email: userData.email,
          fullName: userData.name || userData.given_name && userData.family_name 
            ? `${userData.given_name} ${userData.family_name}` 
            : userData.email
        }, ''); // Plus besoin de stocker l'access_token côté client

        // Rediriger vers la page prévisionnel
        navigate('/forecast', { replace: true });
        
        toast({
          title: 'Connexion réussie',
          description: `Bienvenue ${userData.name || userData.email}`,
        });
        
      } catch (error) {
        console.error('Erreur lors du traitement du callback Cognito:', error);
        
        toast({
          title: 'Erreur de connexion',
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
          variant: 'destructive',
        });
        
        // En cas d'erreur, rediriger vers la page de login après un délai
        setTimeout(() => {
          //navigate('/auth/login', { replace: true });
        }, 3000);
      }
    };
    
    handleCallback();
  }, [navigate, setAuthData, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authentification en cours...</p>
      </div>
    </div>
  );
}