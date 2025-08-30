import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginModal = ({ isOpen, onClose }) => {
  const { checkAuth } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload, {
        withCredentials: true
      });

      toast.success(isLogin ? 'Erfolgreich angemeldet!' : 'Konto erfolgreich erstellt!');
      
      // Refresh auth state
      await checkAuth();
      
      // Close modal and reset form
      onClose();
      setFormData({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Auth error:', error);
      const message = error.response?.data?.detail || 'Ein Fehler ist aufgetreten';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '' });
  };

  const handleOAuthLogin = () => {
    const redirectUrl = encodeURIComponent(window.location.origin + '/profile');
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 flex items-center justify-center p-4"
      style={{ 
        zIndex: 99999, 
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
        <div className="relative bg-white rounded-lg">
          {/* Header */}
          <div className="relative p-6 bg-white border-b rounded-t-lg">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              style={{ zIndex: 1000 }}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
            
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? '🔐 Anmelden' : '✨ Registrieren'}
            </h2>
            <p className="text-center text-gray-600">
              {isLogin 
                ? 'Wähle deine bevorzugte Anmelde-Methode'
                : 'Erstelle dein Konto mit einer der folgenden Optionen'
              }
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6 bg-white space-y-5 rounded-b-lg">
          {/* OAuth Login Button - Option 1 */}
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-emerald-800 mb-2 text-center">
              🚀 Schnell & Einfach
            </h3>
            <Button
              onClick={handleOAuthLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              size="lg"
            >
              <User className="w-5 h-5 mr-2" />
              Mit Emergent {isLogin ? 'anmelden' : 'registrieren'}
            </Button>
          </div>

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-4 text-gray-600 font-semibold">ODER</span>
            </div>
          </div>

          {/* Traditional Login Form - Option 2 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">
              📧 Email & Passwort
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Dein vollständiger Name"
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-Mail
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="deine@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Passwort
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={isLogin ? "Dein Passwort" : "Mindestens 8 Zeichen"}
                  className="pl-10 pr-10"
                  minLength={isLogin ? 1 : 8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Das Passwort muss mindestens 8 Zeichen lang sein
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white shadow-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="loading-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {isLogin ? 'Anmelden...' : 'Registrieren...'}
                </>
              ) : (
                isLogin ? 'Anmelden' : 'Registrieren'
              )}
            </Button>
          </form>
          </div>

          {/* Switch Mode */}
          <div className="text-center pt-4 border-t mt-6 bg-white">
            <p className="text-base text-gray-700">
              {isLogin ? 'Noch kein Konto?' : 'Bereits ein Konto?'}
              <button
                onClick={switchMode}
                className="ml-2 text-emerald-600 hover:text-emerald-700 font-bold underline"
              >
                {isLogin ? 'Hier registrieren' : 'Hier anmelden'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default LoginModal;