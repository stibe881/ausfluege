import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { Upload, Plus, MapPin, Link as LinkIcon, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { Loader } from '@googlemaps/js-api-loader';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddExcursion = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    canton: '',
    category: '',
    website_url: '',
    has_grill: false,
    is_outdoor: true,
    is_free: true,
    parking_situation: '',
    parking_is_free: true
  });
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cantons, setCantons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parkingSituations, setParkingSituations] = useState([]);
  
  // Google Places states
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesService, setPlacesService] = useState(null);
  const [autocompleteService, setAutocompleteService] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    loadOptions();
    initializeGoogleMaps();
  }, [isAuthenticated, navigate]);

  const initializeGoogleMaps = async () => {
    try {
      const loader = new Loader({
        apiKey: "AIzaSyBdVl-cGnaq0C59GJ2aHWKRcYzxTsNjo7A", // Demo key - should be replaced
        version: "weekly",
        libraries: ["places"]
      });

      const google = await loader.load();
      
      // Create a dummy map element for services
      const mapElement = document.createElement('div');
      const map = new google.maps.Map(mapElement, {
        center: { lat: 46.8182, lng: 8.2275 }, // Switzerland center
        zoom: 8
      });

      const placesService = new google.maps.places.PlacesService(map);
      const autocompleteService = new google.maps.places.AutocompleteService();
      
      setPlacesService(placesService);
      setAutocompleteService(autocompleteService);
    } catch (error) {
      console.warn('Google Maps failed to load:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const [cantonsRes, categoriesRes, parkingRes] = await Promise.all([
        axios.get(`${API}/cantons`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/parking-situations`)
      ]);
      
      setCantons(cantonsRes.data);
      setCategories(categoriesRes.data);
      setParkingSituations(parkingRes.data);
    } catch (error) {
      console.error('Error loading options:', error);
      toast.error('Fehler beim Laden der Optionen');
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Handle title changes for place suggestions
    if (name === 'title' && value.length > 2 && autocompleteService) {
      searchPlaces(value);
    } else if (name === 'title') {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const searchPlaces = (query) => {
    if (!autocompleteService) return;
    
    autocompleteService.getPlacePredictions({
      input: query,
      componentRestrictions: { country: 'ch' }, // Restrict to Switzerland
      types: ['tourist_attraction', 'amusement_park', 'park', 'point_of_interest']
    }, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setPlaceSuggestions(predictions.slice(0, 5)); // Show top 5 suggestions
        setShowSuggestions(true);
      } else {
        setPlaceSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const selectPlace = (placeId, description) => {
    if (!placesService) return;
    
    placesService.getDetails({
      placeId: placeId,
      fields: ['name', 'formatted_address', 'website', 'photos', 'types', 'geometry']
    }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        // Auto-fill form with place data
        setFormData(prev => ({
          ...prev,
          title: place.name,
          address: place.formatted_address,
          website_url: place.website || '',
          // Try to determine category based on place types
          category: determineCategory(place.types)
        }));
        
        // Try to determine canton from address
        const canton = extractCantonFromAddress(place.formatted_address);
        if (canton) {
          setFormData(prev => ({ ...prev, canton }));
        }
        
        setShowSuggestions(false);
        toast.success('Informationen automatisch ausgefüllt!');
      }
    });
  };

  const determineCategory = (types) => {
    const typeMapping = {
      'amusement_park': 'AMUSEMENT_PARK',
      'zoo': 'ZOO',
      'museum': 'MUSEUM',
      'restaurant': 'RESTAURANT',
      'tourist_attraction': 'OTHER',
      'natural_feature': 'HIKING',
      'park': 'HIKING'
    };
    
    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }
    return 'OTHER';
  };

  const extractCantonFromAddress = (address) => {
    const cantonMapping = {
      'Zürich': 'ZH', 'Bern': 'BE', 'Luzern': 'LU', 'Basel': 'BS', 
      'St. Gallen': 'SG', 'Aargau': 'AG', 'Thurgau': 'TG', 'Genève': 'GE', 
      'Vaud': 'VD', 'Valais': 'VS', 'Graubünden': 'GR', 'Ticino': 'TI',
      'Fribourg': 'FR', 'Solothurn': 'SO', 'Schaffhausen': 'SH', 'Zug': 'ZG'
    };
    
    for (const [name, code] of Object.entries(cantonMapping)) {
      if (address.includes(name)) {
        return code;
      }
    }
    return '';
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.address || 
          !formData.canton || !formData.category || !formData.parking_situation) {
        toast.error('Bitte fülle alle Pflichtfelder aus');
        setLoading(false);
        return;
      }

      // Create excursion
      const response = await axios.post(`${API}/excursions`, formData, {
        withCredentials: true
      });

      const excursionId = response.data.id;

      // Upload photos if any
      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach((photo) => {
          photoFormData.append('files', photo);
        });

        await axios.post(`${API}/excursions/${excursionId}/photos`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        });
      }

      toast.success('Ausflug erfolgreich hinzugefügt!');
      navigate(`/ausflug/${excursionId}`);
    } catch (error) {
      console.error('Error creating excursion:', error);
      if (error.response?.status === 401) {
        toast.error('Du musst angemeldet sein, um einen Ausflug hinzuzufügen');
        navigate('/');
      } else {
        toast.error('Fehler beim Hinzufügen des Ausflugs');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-8 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Neuen Ausflug hinzufügen</h1>
          <p className="text-gray-600">
            Teile dein Lieblings-Ausflugsziel mit der Community und hilf anderen, neue Orte zu entdecken.
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>Ausflugsinformationen</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="z.B. Wanderung zum Matterhorn"
                    className="mt-1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Beschreibung *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Beschreibe deinen Ausflug detailliert..."
                    rows={4}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Strasse, PLZ Ort"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="canton">Kanton *</Label>
                  <Select 
                    value={formData.canton} 
                    onValueChange={(value) => handleInputChange('canton', value)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Kanton wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {cantons.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>
                          {canton.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Kategorie *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <div className="relative mt-1">
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="website_url"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Eigenschaften */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Eigenschaften</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="has_grill"
                        checked={formData.has_grill}
                        onCheckedChange={(checked) => handleInputChange('has_grill', checked)}
                      />
                      <Label htmlFor="has_grill">Hat Grillstelle</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_outdoor"
                        checked={formData.is_outdoor}
                        onCheckedChange={(checked) => handleInputChange('is_outdoor', checked)}
                      />
                      <Label htmlFor="is_outdoor">Outdoor-Aktivität</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_free"
                        checked={formData.is_free}
                        onCheckedChange={(checked) => handleInputChange('is_free', checked)}
                      />
                      <Label htmlFor="is_free">Kostenlos</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parkplatz Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parkplatz Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="parking_situation">Parkplatzsituation *</Label>
                    <Select 
                      value={formData.parking_situation} 
                      onValueChange={(value) => handleInputChange('parking_situation', value)}
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Parkplatzsituation wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingSituations.map((parking) => (
                          <SelectItem key={parking.value} value={parking.value}>
                            {parking.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 mt-8">
                    <Checkbox 
                      id="parking_is_free"
                      checked={formData.parking_is_free}
                      onCheckedChange={(checked) => handleInputChange('parking_is_free', checked)}
                    />
                    <Label htmlFor="parking_is_free">Parkplätze kostenlos</Label>
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos</h3>
                
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 upload-area">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <div className="mb-4">
                      <Label htmlFor="photos" className="cursor-pointer">
                        <span className="text-emerald-600 hover:text-emerald-700 font-medium">
                          Fotos auswählen
                        </span>
                        <span className="text-gray-600"> oder hierhin ziehen</span>
                      </Label>
                      <Input
                        id="photos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      PNG, JPG bis zu 10MB pro Foto
                    </p>
                  </div>
                </div>

                {photos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {photos.length} Foto{photos.length !== 1 ? 's' : ''} ausgewählt:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(photos).map((photo, index) => (
                        <span key={index} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                          {photo.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/ausfluge')}
                  className="border-gray-300"
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 btn-hover"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Ausflug hinzufügen
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddExcursion;