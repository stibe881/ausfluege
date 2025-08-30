import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { 
  MapPin, Star, User, Calendar, ExternalLink, Car, 
  Mountain, TreePine, Waves, ArrowLeft, MessageCircle,
  Flame, Home, DollarSign, ParkingCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExcursionDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const [excursion, setExcursion] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    loadExcursion();
    loadReviews();
  }, [id]);

  const loadExcursion = async () => {
    try {
      const response = await axios.get(`${API}/excursions/${id}`);
      setExcursion(response.data);
    } catch (error) {
      console.error('Error loading excursion:', error);
      toast.error('Ausflug nicht gefunden');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${API}/excursions/${id}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Du musst angemeldet sein, um eine Bewertung zu schreiben');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Bitte schreibe einen Kommentar');
      return;
    }

    setReviewLoading(true);

    try {
      await axios.post(`${API}/excursions/${id}/reviews`, newReview, {
        withCredentials: true
      });

      toast.success('Bewertung erfolgreich hinzugefügt!');
      setNewReview({ rating: 5, comment: '' });
      setShowReviewForm(false);
      
      // Reload data
      await Promise.all([loadExcursion(), loadReviews()]);
    } catch (error) {
      console.error('Error creating review:', error);
      if (error.response?.status === 400) {
        toast.error('Du hast diesen Ausflug bereits bewertet');
      } else {
        toast.error('Fehler beim Hinzufügen der Bewertung');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const renderRating = (rating, reviewCount) => {
    if (reviewCount === 0) return <span className="text-gray-500">Keine Bewertungen</span>;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-gray-600">
          ({reviewCount} Bewertung{reviewCount !== 1 ? 'en' : ''})
        </span>
      </div>
    );
  };

  const renderStarRating = (rating, onRatingChange, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'
            }`}
            onClick={() => interactive && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  const getIcon = (category) => {
    switch (category) {
      case 'HIKING':
        return <Mountain className="w-8 h-8 text-emerald-600" />;
      case 'PUBLIC_POOL':
      case 'ADVENTURE_PARK':
        return <Waves className="w-8 h-8 text-emerald-600" />;
      default:
        return <TreePine className="w-8 h-8 text-emerald-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ausflug nicht gefunden</h2>
          <p className="text-gray-600 mb-4">Der gewünschte Ausflug existiert nicht oder wurde entfernt.</p>
          <Link to="/ausfluge">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Zurück zu allen Ausflügen
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/ausfluge">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zu allen Ausflügen
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-emerald-400 to-teal-500">
                {excursion.photos && excursion.photos.length > 0 ? (
                  <img
                    src={`${BACKEND_URL}/uploads/photos/${excursion.photos[0]}`}
                    alt={excursion.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getIcon(excursion.category)}
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-emerald-700 hover:bg-white">
                    {excursion.canton}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{excursion.title}</h1>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-sm">
                    {excursion.category.replace('_', ' ')}
                  </Badge>
                  {renderRating(excursion.average_rating, excursion.review_count)}
                </div>

                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {excursion.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {excursion.is_free && (
                    <Badge className="bg-green-100 text-green-800">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Gratis
                    </Badge>
                  )}
                  {excursion.has_grill && (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Flame className="w-3 h-3 mr-1" />
                      Grillstelle
                    </Badge>
                  )}
                  {excursion.is_outdoor ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <TreePine className="w-3 h-3 mr-1" />
                      Outdoor
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Home className="w-3 h-3 mr-1" />
                      Indoor
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photo Gallery */}
            {excursion.photos && excursion.photos.length > 1 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Weitere Fotos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {excursion.photos.slice(1).map((photo, index) => (
                      <img
                        key={index}
                        src={`${BACKEND_URL}/uploads/photos/${photo}`}
                        alt={`${excursion.title} Foto ${index + 2}`}
                        className="w-full h-32 object-cover rounded-lg gallery-image"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Bewertungen ({reviews.length})</span>
                </CardTitle>
                
                {isAuthenticated && !reviews.find(r => r.user_id === user.id) && (
                  <Button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Bewertung schreiben
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Review Form */}
                {showReviewForm && (
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-4">
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Bewertung</Label>
                          {renderStarRating(
                            newReview.rating, 
                            (rating) => setNewReview(prev => ({ ...prev, rating })),
                            true
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
                            Kommentar
                          </Label>
                          <Textarea
                            id="comment"
                            value={newReview.comment}
                            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Teile deine Erfahrungen mit diesem Ausflug..."
                            rows={3}
                            required
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            type="submit" 
                            disabled={reviewLoading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {reviewLoading ? 'Wird gespeichert...' : 'Bewertung hinzufügen'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setShowReviewForm(false)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Noch keine Bewertungen
                    </h3>
                    <p className="text-gray-600">
                      Sei der Erste, der diesen Ausflug bewertet!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{review.user_name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString('de-CH')}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Adresse</p>
                    <p className="text-gray-600">{excursion.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Car className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Parkplätze</p>
                    <p className="text-gray-600">
                      {excursion.parking_situation.replace('_', ' ')}
                      {excursion.parking_is_free && ' (kostenlos)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Hinzugefügt von</p>
                    <p className="text-gray-600">{excursion.author_name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Hinzugefügt am</p>
                    <p className="text-gray-600">
                      {new Date(excursion.created_at).toLocaleDateString('de-CH')}
                    </p>
                  </div>
                </div>

                {excursion.website_url && (
                  <div className="pt-2 border-t">
                    <a
                      href={excursion.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Website besuchen</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isAuthenticated ? (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => window.location.href = 'https://auth.emergentagent.com/?redirect=' + encodeURIComponent(window.location.origin + '/profile')}
                  >
                    Anmelden um zu bewerten
                  </Button>
                ) : (
                  reviews.find(r => r.user_id === user.id) ? (
                    <div className="text-center py-4 text-gray-600">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm">Du hast diesen Ausflug bereits bewertet</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Bewertung schreiben
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcursionDetail;