import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Euro, AlertCircle } from 'lucide-react';
import { Loading } from '../components/ui/loading';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/auth';
import { authApi } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Si déjà connecté, rediriger vers l'app
      if (isAuthenticated) {
        navigate('/forecast', { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Vérifier si l'utilisateur est déjà connecté via les cookies
        const userData = await authApi.getUserInfo();
        
        if (userData) {
          // L'utilisateur est connecté, mettre à jour le store
          setAuthData({
            id: userData.sub || userData.id,
            email: userData.email,
            fullName: userData.profile.name || userData.profile.given_name && userData.profile.family_name 
              ? `${userData.profile.given_name} ${userData.profile.family_name}` 
              : userData.profile.email
          }, ''); // Plus besoin de l'access_token côté client
          
          // Rediriger vers l'app
          navigate('/forecast', { replace: true });
          return;
        }
      } catch (error) {
        // L'utilisateur n'est pas connecté, continuer
        console.log('Utilisateur non connecté, redirection vers Cognito');
      }
      
      // Arrêter le loading, l'utilisateur peut maintenant cliquer pour se connecter
      setLoading(false);
    };
    
    checkAuthAndRedirect();
  }, [isAuthenticated, navigate, setAuthData]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      // Rediriger vers Cognito pour l'authentification
      await authApi.login();
    } catch (error) {
      console.error('Erreur lors de la redirection vers la page de login:', error);
      setError('Impossible de se connecter. Veuillez réessayer.');
      setLoading(false);
    }
  };

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
          {loading ? (
            <p className="mt-2 text-sm text-gray-600">
              Vérification de la connexion...
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Connectez-vous pour accéder à votre budget
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          {loading ? (
            <Loading size="lg" text="Vérification..." />
          ) : (
            <>
              {error && (
                <div className="w-full bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}
              <Button 
                onClick={handleLogin}
                className="w-full"
                size="lg"
              >
                Se connecter
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}