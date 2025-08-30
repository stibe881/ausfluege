import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { Navigate } from 'react-router-dom';
import { User, MapPin, Star, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ProfilePage = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-8 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-emerald-200"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <p className="text-gray-600 mb-3">{user.email}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Mitglied seit {new Date(user.created_at).toLocaleDateString('de-CH')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
              <p className="text-gray-600">Ausflüge hinzugefügt</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
              <p className="text-gray-600">Bewertungen geschrieben</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Aktiv</h3>
              <p className="text-gray-600">Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Deine Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Noch keine Aktivitäten
            </h3>
            <p className="text-gray-600 mb-6">
              Beginne damit, Ausflüge hinzuzufügen oder zu bewerten, um deine Aktivitäten hier zu sehen.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Bald verfügbar:
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Liste deiner hinzugefügten Ausflüge</li>
                <li>• Übersicht deiner Bewertungen</li>
                <li>• Favoriten und Merkliste</li>
                <li>• Besuchte Ausflüge</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;