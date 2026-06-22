import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('OAuth token not found.');
      return;
    }

    loginWithToken(token).then((result) => {
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.message || 'OAuth login failed.');
      }
    });
  }, [loginWithToken, navigate, params]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 text-center">
      {error ? (
        <div>
          <p className="text-sm text-destructive font-body">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 px-5 py-2 border border-foreground text-foreground text-xs font-bold tracking-widest uppercase hover:bg-muted transition-colors"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Signing you in...</p>
      )}
    </div>
  );
};

export default OAuthSuccess;
