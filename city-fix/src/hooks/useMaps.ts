import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../api/axios';

// ─── Types ───────────────────────────────────────────────

export interface GeocodeResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
}

export interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface AutocompleteResult {
  predictions: AutocompletePrediction[];
  status: string;
}

export interface PlaceDetailsResult {
  result: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    name: string;
  };
  status: string;
}

// ─── Hooks ───────────────────────────────────────────────

/**
 * Geocode an address string to coordinates.
 * GET /api/maps/geocode?address=...
 */
export const useGeocode = (address: string) => {
  return useQuery({
    queryKey: ['maps', 'geocode', address],
    queryFn: async () => {
      const response = await apiClient.get<GeocodeResult>('/maps/geocode', {
        params: { address },
      });
      return response.data;
    },
    enabled: !!address && address.length > 3,
  });
};

/**
 * Reverse geocode coordinates to an address.
 * GET /api/maps/reverse-geocode?lat=...&lng=...
 */
export const useReverseGeocode = (lat: number | null, lng: number | null) => {
  return useQuery({
    queryKey: ['maps', 'reverse-geocode', lat, lng],
    queryFn: async () => {
      const response = await apiClient.get<GeocodeResult>('/maps/reverse-geocode', {
        params: { lat, lng },
      });
      return response.data;
    },
    enabled: lat !== null && lng !== null,
  });
};

/**
 * Mutation version of reverse geocode for on-demand use.
 */
export const useReverseGeocodeMutation = () => {
  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const response = await apiClient.get<GeocodeResult>('/maps/reverse-geocode', {
        params: { lat, lng },
      });
      return response.data;
    },
  });
};

/**
 * Search places with autocomplete.
 * GET /api/maps/places/autocomplete?input=...&country=bo
 */
export const usePlacesAutocomplete = (input: string, country: string = 'bo') => {
  return useQuery({
    queryKey: ['maps', 'autocomplete', input, country],
    queryFn: async () => {
      const response = await apiClient.get<AutocompleteResult>('/maps/places/autocomplete', {
        params: { input, country },
      });
      return response.data;
    },
    enabled: !!input && input.length > 2,
  });
};

/**
 * Get details for a specific place by place_id.
 * GET /api/maps/places/details?place_id=...&fields=...
 */
export const usePlaceDetails = (placeId: string | null) => {
  return useQuery({
    queryKey: ['maps', 'place-details', placeId],
    queryFn: async () => {
      const response = await apiClient.get<PlaceDetailsResult>('/maps/places/details', {
        params: {
          place_id: placeId,
          fields: 'formatted_address,geometry,name',
        },
      });
      return response.data;
    },
    enabled: !!placeId,
  });
};
