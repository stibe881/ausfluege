import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { Search, MapPin, Star, Users, Plus, ArrowRight, Mountain, Waves, TreePine } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [featuredExcursions, setFeaturedExcursions] = useState([]);
  const [stats, setStats] = useState({ total: 0, categories: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedExcursions();
  }, []);

  const loadFeaturedExcursions = async () => {
    try {
      const response = await axios.get(`${API}/excursions`);
      const excursions = response.data;
      
      // Get top 6 excursions by rating
      const featured = excursions
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 6);
      
      setFeaturedExcursions(featured);
      
      // Calculate stats
      const categories = new Set(excursions.map(e => e.category));
      setStats({
        total: excursions.length,
        categories: categories.size,
        users: new Set(excursions.map(e => e.author_id)).size
      });
    } catch (error) {
      console.error('Error loading featured excursions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (rating, reviewCount) => {
    if (reviewCount === 0) return <span className="text-gray-500">Keine Bewertungen</span>;
    
    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount} Bewertungen)
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 fade-in">
            Entdecke die schönsten Ausflüge der Schweiz
          </h1>
          <p className="text-xl mb-8 text-emerald-100 max-w-3xl mx-auto">
            Finde und teile die besten Ausflugsziele in allen Kantonen. Von Wanderungen bis Freizeitparks - 
            entdecke neue Abenteuer und bewerte deine Erfahrungen.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/ausfluge">
              <Button 
                size="lg" 
                className="bg-white text-emerald-700 hover:bg-emerald-50 btn-hover font-semibold px-8 py-3"
              >
                <Search className="w-5 h-5 mr-2" />
                Ausflüge entdecken
              </Button>
            </Link>
            
            {isAuthenticated && (
              <Link to="/hinzufuegen">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 btn-hover font-semibold px-8 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ausflug hinzufügen
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</h3>
              <p className="text-gray-600">Ausflugsziele</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.categories}</h3>
              <p className="text-gray-600">Kategorien</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.users}</h3>
              <p className="text-gray-600">Beitragende</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Excursions */}
      <section className="py-16 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top bewertete Ausflüge</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Entdecke die beliebtesten Ausflugsziele, die von unserer Community am besten bewertet wurden.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredExcursions.map((excursion) => (
                <Card key={excursion.id} className="card-hover border-0 shadow-lg overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-emerald-400 to-teal-500">
                    {excursion.photos && excursion.photos.length > 0 ? (
                      <img
                        src={`${BACKEND_URL}/uploads/photos/${excursion.photos[0]}`}
                        alt={excursion.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {excursion.category === 'HIKING' ? (
                          <Mountain className="w-16 h-16 text-white/70" />
                        ) : excursion.category === 'PUBLIC_POOL' ? (
                          <Waves className="w-16 h-16 text-white/70" />
                        ) : (
                          <TreePine className="w-16 h-16 text-white/70" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-emerald-700 hover:bg-white">
                        {excursion.canton}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                      {excursion.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {excursion.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-xs">
                        {excursion.category.replace('_', ' ')}
                      </Badge>
                      {renderRating(excursion.average_rating, excursion.review_count)}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      {excursion.is_free && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Gratis
                        </Badge>
                      )}
                      {excursion.has_grill && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Grillstelle
                        </Badge>
                      )}
                      {excursion.is_outdoor && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Outdoor
                        </Badge>
                      )}
                    </div>
                    
                    <Link to={`/ausflug/${excursion.id}`}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 btn-hover">
                        Details ansehen
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/ausfluge">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 btn-hover"
              >
                Alle Ausflüge ansehen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-emerald-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Werde Teil unserer Community
            </h2>
            <p className="text-emerald-100 text-lg mb-8">
              Melde dich an, um eigene Ausflüge hinzuzufügen und zu bewerten.
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = 'https://auth.emergentagent.com/?redirect=' + encodeURIComponent(window.location.origin + '/profile')}
              className="bg-white text-emerald-600 hover:bg-emerald-50 btn-hover font-semibold px-8 py-3"
            >
              <Users className="w-5 h-5 mr-2" />
              Jetzt anmelden
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;