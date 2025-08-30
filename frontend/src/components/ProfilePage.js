import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { Navigate, Link } from 'react-router-dom';
import { User, MapPin, Star, Calendar, Edit, Eye, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const [userExcursions, setUserExcursions] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserActivities();
    }
  }, [isAuthenticated, user]);

  const loadUserActivities = async () => {
    try {
      // Load user's excursions
      const excursionsResponse = await axios.get(`${API}/excursions`, {
        withCredentials: true
      });
      const userExcs = excursionsResponse.data.filter(exc => exc.author_id === user.id);
      setUserExcursions(userExcs);

      // Load user's reviews (we'll need to get all reviews and filter)
      // For now, we'll implement a simple solution
      const reviewsResponse = await axios.get(`${API}/user/reviews`, {
        withCredentials: true
      });
      setUserReviews(reviewsResponse.data || []);
      
    } catch (error) {
      console.error('Error loading user activities:', error);
      // If reviews endpoint doesn't exist yet, we'll work around it
      setUserReviews([]);
    } finally {
      setLoadingData(false);
    }
  };

  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{userExcursions.length}</h3>
              <p className="text-gray-600">Ausflüge hinzugefügt</p>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{userReviews.length}</h3>
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

        {/* User Activities */}
        {loadingData ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Lade deine Aktivitäten...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* User's Excursions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Deine Ausflüge ({userExcursions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userExcursions.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Noch keine Ausflüge hinzugefügt
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Füge deinen ersten Ausflug hinzu und teile ihn mit der Community!
                    </p>
                    <Link to="/hinzufuegen">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        Ersten Ausflug hinzufügen
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userExcursions.map((excursion) => (
                      <Card key={excursion.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                              {excursion.title}
                            </h3>
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              {excursion.canton}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {excursion.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-4">
                            {renderRating(excursion.average_rating)}
                            <span className="text-sm text-gray-600">
                              {excursion.review_count} Bewertung{excursion.review_count !== 1 ? 'en' : ''}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link to={`/ausflug/${excursion.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="w-4 h-4 mr-1" />
                                Ansehen
                              </Button>
                            </Link>
                            <Link to={`/ausflug/${excursion.id}/bearbeiten`} className="flex-1">
                              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                <Edit className="w-4 h-4 mr-1" />
                                Bearbeiten
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User's Reviews */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <span>Deine Bewertungen ({userReviews.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Noch keine Bewertungen geschrieben
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Besuche Ausflüge und teile deine Erfahrungen mit anderen!
                    </p>
                    <Link to="/ausfluge">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        Ausflüge entdecken
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userReviews.map((review) => (
                      <Card key={review.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {renderRating(review.rating)}
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('de-CH')}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                          <Link to={`/ausflug/${review.excursion_id}`} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                            Ausflug ansehen →
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;