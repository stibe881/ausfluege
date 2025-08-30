import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { Menu, X, MapPin, Plus, List, Home, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import LoginModal from './LoginModal';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Startseite', icon: Home },
    { path: '/ausfluge', label: 'Ausflüge', icon: List },
    ...(isAuthenticated ? [{ path: '/hinzufuegen', label: 'Hinzufügen', icon: Plus }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-emerald-700 font-bold text-xl">
            <MapPin className="w-6 h-6" />
            <span>AusflugFinder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'nav-active shadow-lg'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/profile')
                      ? 'nav-active shadow-lg'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{user.name}</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Abmelden
                </Button>
              </div>
            ) : (
              <Button
                onClick={login}
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-hover"
              >
                <User className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-emerald-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-white/20">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'nav-active shadow-lg'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            <hr className="border-white/20 my-3" />
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/profile')
                      ? 'nav-active shadow-lg'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-4 h-4 rounded-full"
                  />
                  <span>Profil</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-100 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Abmelden</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  login();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white w-full"
              >
                <User className="w-4 h-4" />
                <span>Anmelden</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;