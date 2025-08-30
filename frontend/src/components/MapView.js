import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MapView = ({ excursions, filters }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindows, setInfoWindows] = useState([]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (map) {
      updateMarkers();
    }
  }, [excursions, map]);

  const initializeMap = async () => {
    console.warn('Google Maps disabled - API key needed');
    // For demo purposes, show a placeholder
  };

  const updateMarkers = async () => {
    if (!map) return;

    // Clear existing markers and info windows
    markers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(infoWindow => infoWindow.close());
    setMarkers([]);
    setInfoWindows([]);

    const geocoder = new window.google.maps.Geocoder();
    const newMarkers = [];
    const newInfoWindows = [];

    for (const excursion of excursions) {
      try {
        const result = await geocodeAddress(geocoder, excursion.address);
        if (result) {
          const marker = createMarker(excursion, result.location);
          const infoWindow = createInfoWindow(excursion);
          
          marker.addListener('click', () => {
            // Close all other info windows
            newInfoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
          newInfoWindows.push(infoWindow);
        }
      } catch (error) {
        console.warn(`Failed to geocode address for ${excursion.title}:`, error);
      }
    }

    setMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // Adjust map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
    }
  };

  const geocodeAddress = (geocoder, address) => {
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: address + ', Switzerland' }, (results, status) => {
        if (status === 'OK') {
          resolve({
            location: results[0].geometry.location
          });
        } else {
          reject(status);
        }
      });
    });
  };

  const createMarker = (excursion, location) => {
    const marker = new window.google.maps.Marker({
      position: location,
      map: map,
      title: excursion.title,
      icon: {
        url: getMarkerIcon(excursion.category),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40)
      }
    });

    return marker;
  };

  const getMarkerIcon = (category) => {
    const iconMap = {
      'HIKING': 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      'AMUSEMENT_PARK': 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      'PUBLIC_POOL': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      'MUSEUM': 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
      'RESTAURANT': 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
    };

    return iconMap[category] || 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
  };

  const createInfoWindow = (excursion) => {
    const imageUrl = excursion.photos && excursion.photos.length > 0
      ? `${BACKEND_URL}/uploads/photos/${excursion.photos[0]}`
      : null;

    const contentString = `
      <div style="max-width: 300px; font-family: 'Inter', sans-serif;">
        ${imageUrl ? `
          <img 
            src="${imageUrl}" 
            alt="${excursion.title}"
            style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
          />
        ` : ''}
        
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">
          ${excursion.title}
        </h3>
        
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6B7280; line-height: 1.4;">
          ${excursion.description.substring(0, 100)}${excursion.description.length > 100 ? '...' : ''}
        </p>
        
        <div style="display: flex; flex-wrap: gap; margin-bottom: 12px;">
          <span style="background: #ECFDF5; color: #047857; padding: 4px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px;">
            ${excursion.canton}
          </span>
          ${excursion.is_free ? '<span style="background: #F0FDF4; color: #166534; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Gratis</span>' : ''}
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            ${renderStars(excursion.average_rating)}
            <span style="margin-left: 8px; font-size: 14px; color: #6B7280;">
              (${excursion.review_count})
            </span>
          </div>
          
          <a 
            href="/ausflug/${excursion.id}" 
            style="background: #10B981; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;"
          >
            Details
          </a>
        </div>
      </div>
    `;

    return new window.google.maps.InfoWindow({
      content: contentString,
      maxWidth: 300
    });
  };

  const renderStars = (rating) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span style="color: ${i <= rating ? '#FBBF24' : '#D1D5DB'};">★</span>`;
    }
    return stars;
  };

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-200 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
      <div className="text-center p-8">
        <MapPin className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          🗺️ Kartenansicht
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">
          Die interaktive Kartenansicht wird bald verfügbar sein. 
          Momentan zeigen wir {excursions.length} Ausflüge in der Listenansicht.
        </p>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-gray-900 mb-2">Verfügbare Ausflüge:</h4>
          {excursions.length === 0 ? (
            <p className="text-gray-500">Keine Ausflüge gefunden</p>
          ) : (
            <div className="space-y-2">
              {excursions.slice(0, 5).map((excursion) => (
                <div key={excursion.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{excursion.title}</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                    {excursion.region || excursion.canton}
                  </Badge>
                </div>
              ))}
              {excursions.length > 5 && (
                <p className="text-gray-500 text-xs">
                  ... und {excursions.length - 5} weitere
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;