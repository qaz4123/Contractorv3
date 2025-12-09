import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { AddressComponents } from './AddressAutocomplete';
import api from '../services/api';

interface QuickLeadInputProps {
  onLeadCreated: (lead: any) => void;
  autoFocus?: boolean;
}

export function QuickLeadInput({ onLeadCreated, autoFocus = false }: QuickLeadInputProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapsAvailable, setIsMapsAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const checkMapsAvailability = () => {
      if (window.isMapsApiBlocked) {
        setIsMapsAvailable(false);
        return;
      }

      if (
        typeof window.google !== 'undefined' &&
        window.google.maps &&
        window.google.maps.places &&
        inputRef.current
      ) {
        setIsMapsAvailable(true);
        initAutocomplete();
      } else {
        setTimeout(checkMapsAvailability, 500);
      }
    };

    const initAutocomplete = () => {
      if (!inputRef.current || autocompleteRef.current) return;

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['formatted_address', 'address_components', 'geometry'],
          componentRestrictions: { country: 'us' },
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            handleAddressSelect(place);
          }
        });
      } catch (err) {
        setIsMapsAvailable(false);
      }
    };

    checkMapsAvailability();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  const parseAddressComponents = (place: any): AddressComponents => {
    const components: AddressComponents = {
      fullAddress: place.formatted_address || '',
    };

    if (place.geometry?.location) {
      components.lat = place.geometry.location.lat();
      components.lng = place.geometry.location.lng();
    }

    place.address_components?.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        components.street = component.long_name;
      }
      if (types.includes('locality')) {
        components.city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        components.state = component.short_name;
      }
      if (types.includes('postal_code')) {
        components.zipCode = component.long_name;
      }
      if (types.includes('country')) {
        components.country = component.short_name;
      }
    });

    if (components.streetNumber && components.street) {
      components.street = `${components.streetNumber} ${components.street}`;
    }

    return components;
  };

  const handleAddressSelect = async (place: any) => {
    const components = parseAddressComponents(place);
    setAddress(components.fullAddress);
    
    const payload = {
      fullAddress: components.fullAddress,
      street: components.street || components.fullAddress,
      city: components.city || '',
      state: components.state || '',
      zipCode: components.zipCode || '',
    };
    console.log('Sending lead payload:', payload);

    setIsLoading(true);
    try {
      const response = await api.post('/leads', payload);

      // Check for API error response (since axios doesn't throw on 4xx)
      if (response.data && response.data.success === false) {
        const errorMessage = response.data.error || 'Failed to create lead';
        const details = response.data.details ? 
          response.data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ') : '';
        throw new Error(details ? `${errorMessage}: ${details}` : errorMessage);
      }

      // Extract lead data from response - backend returns {success, data}
      const leadData = response.data?.data || response.data;
      
      if (!leadData || !leadData.id) {
        throw new Error('Invalid response from server - no lead data received');
      }
      
      onLeadCreated(leadData);
      setAddress('');
      
      // Blur input to close autocomplete
      inputRef.current?.blur();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create lead. Please try again.';
      const toast = await import('../utils/toast');
      toast.showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !autocompleteRef.current && address.trim()) {
      handleManualSubmit();
    }
  };

  const handleManualSubmit = async () => {
    if (!address.trim() || isLoading) return;

    const payload = {
      fullAddress: address.trim(),
    };
    console.log('Sending manual lead payload:', payload);

    setIsLoading(true);
    try {
      const response = await api.post('/leads', payload);

      // Check for API error response (since axios doesn't throw on 4xx)
      if (response.data && response.data.success === false) {
        const errorMessage = response.data.error || 'Failed to create lead';
        const details = response.data.details ? 
          response.data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ') : '';
        throw new Error(details ? `${errorMessage}: ${details}` : errorMessage);
      }

      // Extract lead data from response - backend returns {success, data}
      const leadData = response.data?.data || response.data;
      
      if (!leadData || !leadData.id) {
        throw new Error('Invalid response from server - no lead data received');
      }
      
      onLeadCreated(leadData);
      setAddress('');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create lead. Please try again.';
      const toast = await import('../utils/toast');
      toast.showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type property address to add lead..."
          autoFocus={autoFocus}
          disabled={isLoading}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                   dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed
                   text-base"
        />
        {isLoading && (
          <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 animate-spin" />
        )}
      </div>
      {!isMapsAvailable && (
        <p className="text-xs text-gray-500 mt-1">
          Google Maps autocomplete unavailable. You can still enter addresses manually.
        </p>
      )}
    </div>
  );
}

declare global {
  interface Window {
    google: any;
    isMapsApiBlocked?: boolean;
  }
}
