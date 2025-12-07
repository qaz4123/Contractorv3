import { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

// Extend window to include Google Maps types
declare global {
  interface Window {
    google: any;
    isMapsApiBlocked?: boolean;
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, components?: AddressComponents) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export interface AddressComponents {
  streetNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing property address...',
  label,
  required = false,
  className = '',
  error,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isMapsAvailable, setIsMapsAvailable] = useState(false);

  useEffect(() => {
    // Check if Google Maps is available
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
        // Retry after a short delay (API might still be loading)
        setTimeout(checkMapsAvailability, 500);
      }
    };

    const initAutocomplete = () => {
      if (!inputRef.current || autocompleteRef.current) return;

      try {
        // Initialize Google Maps Places Autocomplete with US Restriction
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['formatted_address', 'address_components', 'geometry'],
          componentRestrictions: { country: 'us' }, // Restrict to US only
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            const components = parseAddressComponents(place);
            onChange(place.formatted_address, components);
          }
        });
      } catch (err) {
        console.error('Failed to initialize Google Maps Autocomplete:', err);
        setIsMapsAvailable(false);
      }
    };

    checkMapsAvailability();

    // Handle maps-api-blocked event
    const handleMapsBlocked = () => setIsMapsAvailable(false);
    window.addEventListener('maps-api-blocked', handleMapsBlocked);

    return () => {
      window.removeEventListener('maps-api-blocked', handleMapsBlocked);
      // Cleanup autocomplete
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [onChange]);

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

    // Combine street number and street
    if (components.streetNumber && components.street) {
      components.street = `${components.streetNumber} ${components.street}`;
    }

    return components;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isMapsAvailable ? placeholder : 'Enter address manually...'}
          required={required}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            dark:bg-gray-800 dark:text-white
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
        />
        {isMapsAvailable && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            🇺🇸 US
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {!isMapsAvailable && (
        <p className="mt-1 text-xs text-gray-400">
          Address autocomplete unavailable. Enter address manually.
        </p>
      )}
    </div>
  );
}
