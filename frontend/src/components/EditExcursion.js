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
    canton: '',
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
  const [cantons, setCantons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parkingSituations, setParkingSituations] = useState([]);
  const [excursion, setExcursion] = useState(null);

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
      setFormData({
        title: exc.title,
        description: exc.description,
        address: exc.address,
        canton: exc.canton,
        category: exc.category,
        website_url: exc.website_url || '',
        has_grill: exc.has_grill,
        is_outdoor: exc.is_outdoor,
        is_free: exc.is_free,
        parking_situation: exc.parking_situation,
        parking_is_free: exc.parking_is_free
      });
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
    }
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
          !formData.canton || !formData.category || !formData.parking_situation) {
        toast.error('Bitte fülle alle Pflichtfelder aus');
        setLoading(false);
        return;
      }

      await axios.put(`${API}/excursions/${id}`, formData, {
        withCredentials: true
      });

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
                        <SelectItem key={canton.value} value={canton.label}>
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
                        <SelectItem key={category.value} value={category.label}>
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