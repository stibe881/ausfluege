import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { ArrowLeft, Save, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditExcursion = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    country: '',
    region: '',
    category: '',
    website_url: '',
    has_grill: false,
    is_outdoor: true,
    is_free: true,
    parking_situation: '',
    parking_is_free: true
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingExcursion, setLoadingExcursion] = useState(true);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parkingSituations, setParkingSituations] = useState([]);
  const [excursion, setExcursion] = useState(null);
  
  // Photo management
  const [currentPhotos, setCurrentPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    loadExcursion();
    loadOptions();
  }, [isAuthenticated, id, navigate]);

  const loadExcursion = async () => {
    try {
      const response = await axios.get(`${API}/excursions/${id}`);
      const exc = response.data;
      
      // Check if user owns this excursion
      if (exc.author_id !== user?.id) {
        toast.error('Du kannst nur deine eigenen Ausflüge bearbeiten');
        navigate('/profile');
        return;
      }
      
      setExcursion(exc);
      setCurrentPhotos(exc.photos || []);
      setFormData({
        title: exc.title,
        description: exc.description,
        address: exc.address,
        country: exc.country || 'CH',
        region: exc.region || exc.canton, // Backward compatibility
        category: exc.category,
        website_url: exc.website_url || '',
        has_grill: exc.has_grill,
        is_outdoor: exc.is_outdoor,
        is_free: exc.is_free,
        parking_situation: exc.parking_situation,
        parking_is_free: exc.parking_is_free
      });
      
      // Load regions for the country
      if (exc.country) {
        loadRegionsForCountry(exc.country);
      }
    } catch (error) {
      console.error('Error loading excursion:', error);
      toast.error('Ausflug nicht gefunden');
      navigate('/profile');
    } finally {
      setLoadingExcursion(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [countriesRes, categoriesRes, parkingRes] = await Promise.all([
        axios.get(`${API}/countries`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/parking-situations`)
      ]);
      
      setCountries(countriesRes.data);
      setCategories(categoriesRes.data);
      setParkingSituations(parkingRes.data);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const loadRegionsForCountry = async (countryCode) => {
    try {
      const response = await axios.get(`${API}/regions/${countryCode}`);
      setRegions(response.data);
    } catch (error) {
      console.error('Error loading regions:', error);
      setRegions([]);
    }
  };

  const handleCountryChange = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      region: '' // Reset region when country changes
    }));
    loadRegionsForCountry(countryCode);
  };

  const getRegionLabel = (country) => {
    const labels = {
      'CH': 'Kanton',
      'DE': 'Bundesland', 
      'IT': 'Region',
      'FR': 'Région',
      'AT': 'Bundesland'
    };
    return labels[country] || 'Region';
  };

  // Photo management functions
  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(prev => [...prev, ...files]);
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeCurrentPhoto = (photoName) => {
    setPhotosToDelete(prev => [...prev, photoName]);
    setCurrentPhotos(prev => prev.filter(photo => photo !== photoName));
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.title || !formData.description || !formData.address || 
          !formData.country || !formData.region || !formData.category || !formData.parking_situation) {
        toast.error('Bitte fülle alle Pflichtfelder aus');
        setLoading(false);
        return;
      }

      // Update excursion data
      await axios.put(`${API}/excursions/${id}`, formData, {
        withCredentials: true
      });

      // Handle photo deletions
      if (photosToDelete.length > 0) {
        for (const photoName of photosToDelete) {
          try {
            await axios.delete(`${API}/excursions/${id}/photos/${photoName}`, {
              withCredentials: true
            });
          } catch (error) {
            console.warn(`Failed to delete photo ${photoName}:`, error);
          }
        }
      }

      // Upload new photos
      if (newPhotos.length > 0) {
        const photoFormData = new FormData();
        newPhotos.forEach((photo) => {
          photoFormData.append('files', photo);
        });

        await axios.post(`${API}/excursions/${id}/photos`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        });
      }

      toast.success('Ausflug erfolgreich aktualisiert!');
      navigate(`/ausflug/${id}`);
    } catch (error) {
      console.error('Error updating excursion:', error);
      const message = error.response?.data?.detail || 'Fehler beim Aktualisieren des Ausflugs';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Möchtest du diesen Ausflug wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      await axios.delete(`${API}/excursions/${id}`, {
        withCredentials: true
      });

      toast.success('Ausflug erfolgreich gelöscht');
      navigate('/profile');
    } catch (error) {
      console.error('Error deleting excursion:', error);
      toast.error('Fehler beim Löschen des Ausflugs');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loadingExcursion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!excursion) {
    return null;
  }

  return (
    <div className="min-h-screen pt-8 px-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="mb-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Profil
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ausflug bearbeiten</h1>
          <p className="text-gray-600">
            Bearbeite die Details deines Ausflugs "{excursion.title}"
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ausflugsinformationen</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
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
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">Land *</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={handleCountryChange}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Land wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="region">{getRegionLabel(formData.country)} *</Label>
                  <Select 
                    value={formData.region} 
                    onValueChange={(value) => handleInputChange('region', value)}
                    required
                    disabled={!formData.country}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={`${getRegionLabel(formData.country)} wählen`} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
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
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Properties */}
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

              {/* Parking Information */}
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
                          <SelectItem key={parking.value} value={parking.label}>
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

              {/* Photo Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos verwalten</h3>
                
                {/* Current Photos */}
                {currentPhotos.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Aktuelle Fotos
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {currentPhotos.map((photo) => (
                        <div key={photo} className="relative group">
                          <img
                            src={`${BACKEND_URL}/uploads/photos/${photo}`}
                            alt="Ausflug"
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeCurrentPhoto(photo)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Photos */}
                <div className="mb-4">
                  <Label htmlFor="new_photos" className="text-sm font-medium text-gray-700 mb-2 block">
                    Neue Fotos hinzufügen
                  </Label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 upload-area">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                      <Label htmlFor="new_photos" className="cursor-pointer">
                        <span className="text-emerald-600 hover:text-emerald-700 font-medium">
                          Fotos auswählen
                        </span>
                        <span className="text-gray-600"> oder hierhin ziehen</span>
                      </Label>
                      <Input
                        id="new_photos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleNewPhotos}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview New Photos */}
                {newPhotos.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Neue Fotos ({newPhotos.length})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {newPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt="Neues Foto"
                            className="w-full h-24 object-cover rounded-lg border border-emerald-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewPhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-xs px-1 rounded">
                            Neu
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {photosToDelete.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      {photosToDelete.length} Foto{photosToDelete.length !== 1 ? 's' : ''} wird beim Speichern gelöscht
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
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
                      <Save className="w-4 h-4 mr-2" />
                      Änderungen speichern
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

export default EditExcursion;