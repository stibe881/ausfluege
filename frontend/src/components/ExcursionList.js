import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, MapPin, Star, Mountain, Waves, TreePine, List, Map } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import MapView from './MapView';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExcursionList = () => {
  const [excursions, setExcursions] = useState([]);
  const [filteredExcursions, setFilteredExcursions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    canton: '',
    category: '',
    is_free: null,
    is_outdoor: null,
    has_grill: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  // Options for filters
  const [cantons, setCantons] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadExcursions();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [excursions, searchTerm, filters]);

  const loadExcursions = async () => {
    try {
      const response = await axios.get(`${API}/excursions`);
      setExcursions(response.data);
    } catch (error) {
      console.error('Error loading excursions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [cantonsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/cantons`),
        axios.get(`${API}/categories`)
      ]);
      
      setCantons(cantonsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...excursions];

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(excursion =>
        excursion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excursion.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.canton) {
      filtered = filtered.filter(e => e.canton === filters.canton);
    }
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    if (filters.is_free !== null) {
      filtered = filtered.filter(e => e.is_free === filters.is_free);
    }
    if (filters.is_outdoor !== null) {
      filtered = filtered.filter(e => e.is_outdoor === filters.is_outdoor);
    }
    if (filters.has_grill !== null) {
      filtered = filtered.filter(e => e.has_grill === filters.has_grill);
    }

    setFilteredExcursions(filtered);
  };

  const resetFilters = () => {
    setFilters({
      canton: '',
      category: '',
      is_free: null,
      is_outdoor: null,
      has_grill: null
    });
    setSearchTerm('');
  };

  const renderRating = (rating, reviewCount) => {
    if (reviewCount === 0) return <span className="text-gray-500 text-sm">Keine Bewertungen</span>;
    
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
          {rating.toFixed(1)} ({reviewCount})
        </span>
      </div>
    );
  };

  const getIcon = (category) => {
    switch (category) {
      case 'HIKING':
        return <Mountain className="w-16 h-16 text-white/70" />;
      case 'PUBLIC_POOL':
      case 'ADVENTURE_PARK':
        return <Waves className="w-16 h-16 text-white/70" />;
      default:
        return <TreePine className="w-16 h-16 text-white/70" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-gray-200 rounded mb-6 animate-pulse"></div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Alle Ausflüge</h1>
              <p className="text-gray-600">
                Entdecke {excursions.length} Ausflugsziele in der ganzen Schweiz
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Liste</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Karte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Titel, Beschreibung oder Adresse suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mb-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter {showFilters ? 'verbergen' : 'anzeigen'}
          </Button>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Canton Filter */}
                <div>
                  <Label htmlFor="canton-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Kanton
                  </Label>
                  <Select 
                    value={filters.canton} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, canton: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Kantone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle Kantone</SelectItem>
                      {cantons.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>
                          {canton.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Label htmlFor="category-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Kategorie
                  </Label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle Kategorien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle Kategorien</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkbox Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_free" 
                    checked={filters.is_free === true}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, is_free: checked ? true : null }))
                    }
                  />
                  <Label htmlFor="is_free" className="text-sm font-medium">
                    Nur kostenlose Ausflüge
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_outdoor" 
                    checked={filters.is_outdoor === true}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, is_outdoor: checked ? true : null }))
                    }
                  />
                  <Label htmlFor="is_outdoor" className="text-sm font-medium">
                    Nur Outdoor-Aktivitäten
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="has_grill" 
                    checked={filters.has_grill === true}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, has_grill: checked ? true : null }))
                    }
                  />
                  <Label htmlFor="has_grill" className="text-sm font-medium">
                    Mit Grillstelle
                  </Label>
                </div>
              </div>

              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="text-emerald-700 hover:bg-emerald-50"
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredExcursions.length} Ausflug{filteredExcursions.length !== 1 ? 'e' : ''} gefunden
          </p>
        </div>

        {/* Excursions Grid */}
        {filteredExcursions.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Ausflüge gefunden
            </h3>
            <p className="text-gray-600">
              Versuche deine Suchkriterien zu ändern oder{' '}
              <button onClick={resetFilters} className="text-emerald-600 hover:underline">
                alle Filter zurücksetzen
              </button>
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExcursions.map((excursion) => (
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
                      {getIcon(excursion.category)}
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
                  
                  <div className="flex flex-wrap gap-2 mb-4">
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
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">Von:</span> {excursion.author_name}
                  </div>
                  
                  <Link to={`/ausflug/${excursion.id}`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 btn-hover">
                      Details ansehen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcursionList;