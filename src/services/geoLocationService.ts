import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  zipCode?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  accuracy: 'high' | 'medium' | 'low';
  source: 'gps' | 'network' | 'ip' | 'cached';
  timestamp: Date;
}

export interface LocationPreferences {
  enableLocationServices: boolean;
  precisionLevel: 'high' | 'medium' | 'low';
  cacheLocationData: boolean;
  shareLocationForAnalytics: boolean;
  autoDetectTimezone: boolean;
}

export interface GeographicInsight {
  region: string;
  userCount: number;
  popularStrains: string[];
  averageSessionDuration: number;
  conversionRate: number;
  topUseCases: string[];
  seasonalTrends?: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
}

class GeoLocationService {
  private cachedLocation: LocationData | null = null;
  private locationWatchId: number | null = null;
  private isLocationEnabled: boolean = false;

  // IP GEOLOCATION SERVICES
  private readonly IP_SERVICES = [
    {
      name: 'ipapi',
      url: 'http://ip-api.com/json/',
      fields: 'status,message,country,countryCode,region,regionName,city,zip,timezone,lat,lon,isp',
      parser: this.parseIPAPIResponse.bind(this)
    },
    {
      name: 'ipinfo',
      url: 'https://ipinfo.io/json',
      fields: '',
      parser: this.parseIPInfoResponse.bind(this)
    },
    {
      name: 'ipgeolocation',
      url: 'https://api.ipgeolocation.io/ipgeo?apiKey=fallback',
      fields: '',
      parser: this.parseIPGeolocationResponse.bind(this)
    }
  ];

  constructor() {
    this.initializeLocationServices();
  }

  // INITIALIZATION
  private async initializeLocationServices(): Promise<void> {
    try {
      const preferences = await this.getLocationPreferences();
      this.isLocationEnabled = preferences.enableLocationServices;
      
      if (this.isLocationEnabled) {
        await this.loadCachedLocation();
        this.startLocationDetection();
      }
    } catch (error) {
      console.error('Error initializing location services:', error);
    }
  }

  // LOCATION DETECTION
  async getCurrentLocation(forceRefresh: boolean = false): Promise<LocationData | null> {
    try {
      if (!forceRefresh && this.cachedLocation && this.isLocationFresh(this.cachedLocation)) {
        return this.cachedLocation;
      }

      const preferences = await this.getLocationPreferences();
      if (!preferences.enableLocationServices) {
        return this.getTimezoneOnlyLocation();
      }

      // Try GPS first for high precision
      if (preferences.precisionLevel === 'high') {
        const gpsLocation = await this.getGPSLocation();
        if (gpsLocation) {
          this.cachedLocation = gpsLocation;
          await this.saveLocationCache(gpsLocation);
          return gpsLocation;
        }
      }

      // Fallback to IP geolocation
      const ipLocation = await this.getIPLocation();
      if (ipLocation) {
        this.cachedLocation = ipLocation;
        await this.saveLocationCache(ipLocation);
        return ipLocation;
      }

      // Final fallback to timezone only
      return this.getTimezoneOnlyLocation();
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.getTimezoneOnlyLocation();
    }
  }

  // GPS LOCATION
  private async getGPSLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      // React Native Geolocation would be used here
      // For now, we'll simulate GPS unavailable in most environments
      resolve(null);
    });
  }

  // IP GEOLOCATION
  private async getIPLocation(): Promise<LocationData | null> {
    for (const service of this.IP_SERVICES) {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        
        if (response.ok) {
          const locationData = service.parser(data);
          if (locationData) {
            return {
              ...locationData,
              accuracy: 'medium',
              source: 'ip',
              timestamp: new Date()
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to get location from ${service.name}:`, error);
        continue;
      }
    }
    
    return null;
  }

  // IP SERVICE PARSERS
  private parseIPAPIResponse(data: any): Partial<LocationData> | null {
    if (data.status === 'fail') return null;
    
    return {
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      regionCode: data.region,
      city: data.city,
      zipCode: data.zip,
      timezone: data.timezone,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp
    };
  }

  private parseIPInfoResponse(data: any): Partial<LocationData> | null {
    if (!data.country) return null;
    
    const [city, region] = (data.region || '').split(', ');
    
    return {
      country: data.country,
      countryCode: data.country,
      region: region || '',
      regionCode: '',
      city: city || data.city || '',
      zipCode: data.postal,
      timezone: data.timezone,
      latitude: data.loc ? parseFloat(data.loc.split(',')[0]) : undefined,
      longitude: data.loc ? parseFloat(data.loc.split(',')[1]) : undefined,
      isp: data.org
    };
  }

  private parseIPGeolocationResponse(data: any): Partial<LocationData> | null {
    if (!data.country_name) return null;
    
    return {
      country: data.country_name,
      countryCode: data.country_code2,
      region: data.state_prov,
      regionCode: data.state_code,
      city: data.city,
      zipCode: data.zipcode,
      timezone: data.time_zone?.name,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      isp: data.isp
    };
  }

  // FALLBACK LOCATION
  private getTimezoneOnlyLocation(): LocationData {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneParts = timezone.split('/');
    
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: timezoneParts[0] || 'Unknown',
      regionCode: '',
      city: timezoneParts[1] || 'Unknown',
      timezone,
      accuracy: 'low',
      source: 'cached',
      timestamp: new Date()
    };
  }

  // LOCATION WATCHING
  async startLocationDetection(): Promise<void> {
    const preferences = await this.getLocationPreferences();
    if (!preferences.enableLocationServices) return;

    // Update location every 15 minutes when app is active
    setInterval(async () => {
      try {
        await this.getCurrentLocation(true);
      } catch (error) {
        console.error('Error in location watch:', error);
      }
    }, 15 * 60 * 1000);
  }

  stopLocationDetection(): void {
    if (this.locationWatchId !== null) {
      clearInterval(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  // GEOGRAPHIC ANALYTICS
  async getGeographicInsights(days: number = 30): Promise<GeographicInsight[]> {
    try {
      // This would query Firebase for geographic data
      // For now, we'll return mock data that demonstrates the structure
      
      const mockInsights: GeographicInsight[] = [
        {
          region: 'Europe',
          userCount: 1250,
          popularStrains: ['Blue Dream', 'White Widow', 'Northern Lights'],
          averageSessionDuration: 8.5,
          conversionRate: 4.2,
          topUseCases: ['creativity', 'relaxation', 'medical'],
          seasonalTrends: { spring: 85, summer: 120, autumn: 95, winter: 110 }
        },
        {
          region: 'North America',
          userCount: 2100,
          popularStrains: ['OG Kush', 'Sour Diesel', 'Girl Scout Cookies'],
          averageSessionDuration: 12.3,
          conversionRate: 6.8,
          topUseCases: ['recreational', 'medical', 'breeding'],
          seasonalTrends: { spring: 180, summer: 220, autumn: 195, winter: 205 }
        },
        {
          region: 'Asia Pacific',
          userCount: 450,
          popularStrains: ['Jack Herer', 'Granddaddy Purple', 'AK-47'],
          averageSessionDuration: 6.2,
          conversionRate: 2.1,
          topUseCases: ['education', 'medical', 'research']
        }
      ];
      
      return mockInsights;
    } catch (error) {
      console.error('Error getting geographic insights:', error);
      return [];
    }
  }

  async getCountryPopularity(): Promise<Array<{
    country: string;
    countryCode: string;
    userCount: number;
    growthRate: number;
    averageRevenue: number;
    topStrains: string[];
  }>> {
    try {
      // Mock data for country popularity
      return [
        {
          country: 'United States',
          countryCode: 'US',
          userCount: 1850,
          growthRate: 15.3,
          averageRevenue: 12.50,
          topStrains: ['OG Kush', 'Sour Diesel', 'Girl Scout Cookies']
        },
        {
          country: 'Canada',
          countryCode: 'CA',
          userCount: 890,
          growthRate: 22.1,
          averageRevenue: 18.75,
          topStrains: ['Blue Dream', 'White Widow', 'Purple Haze']
        },
        {
          country: 'Germany',
          countryCode: 'DE',
          userCount: 456,
          growthRate: 8.7,
          averageRevenue: 9.80,
          topStrains: ['Northern Lights', 'Skunk #1', 'Amnesia Haze']
        },
        {
          country: 'Netherlands',
          countryCode: 'NL',
          userCount: 234,
          growthRate: 5.2,
          averageRevenue: 14.25,
          topStrains: ['White Widow', 'Super Silver Haze', 'Jack Herer']
        }
      ];
    } catch (error) {
      console.error('Error getting country popularity:', error);
      return [];
    }
  }

  // LOCATION PREFERENCES
  async getLocationPreferences(): Promise<LocationPreferences> {
    try {
      const prefs = await AsyncStorage.getItem('@greedgross:location-preferences');
      if (prefs) {
        return JSON.parse(prefs);
      }
    } catch (error) {
      console.error('Error getting location preferences:', error);
    }
    
    return {
      enableLocationServices: false, // Default to disabled for privacy
      precisionLevel: 'medium',
      cacheLocationData: true,
      shareLocationForAnalytics: false,
      autoDetectTimezone: true
    };
  }

  async updateLocationPreferences(preferences: Partial<LocationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getLocationPreferences();
      const newPrefs = { ...currentPrefs, ...preferences };
      
      await AsyncStorage.setItem(
        '@greedgross:location-preferences',
        JSON.stringify(newPrefs)
      );
      
      this.isLocationEnabled = newPrefs.enableLocationServices;
      
      if (this.isLocationEnabled) {
        this.startLocationDetection();
      } else {
        this.stopLocationDetection();
        await this.clearLocationCache();
      }
    } catch (error) {
      console.error('Error updating location preferences:', error);
    }
  }

  // PRIVACY & CACHING
  private async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('@greedgross:cached-location');
      if (cached) {
        const locationData = JSON.parse(cached);
        locationData.timestamp = new Date(locationData.timestamp);
        
        if (this.isLocationFresh(locationData)) {
          this.cachedLocation = locationData;
        }
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  }

  private async saveLocationCache(location: LocationData): Promise<void> {
    try {
      const preferences = await this.getLocationPreferences();
      if (preferences.cacheLocationData) {
        await AsyncStorage.setItem(
          '@greedgross:cached-location',
          JSON.stringify(location)
        );
      }
    } catch (error) {
      console.error('Error saving location cache:', error);
    }
  }

  private async clearLocationCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@greedgross:cached-location');
      this.cachedLocation = null;
    } catch (error) {
      console.error('Error clearing location cache:', error);
    }
  }

  private isLocationFresh(location: LocationData): boolean {
    const now = new Date();
    const locationTime = new Date(location.timestamp);
    const ageInHours = (now.getTime() - locationTime.getTime()) / (1000 * 60 * 60);
    
    // Different freshness requirements based on accuracy
    switch (location.accuracy) {
      case 'high': return ageInHours < 1; // GPS data valid for 1 hour
      case 'medium': return ageInHours < 24; // IP data valid for 24 hours
      case 'low': return ageInHours < 168; // Timezone data valid for 1 week
      default: return false;
    }
  }

  // ANALYTICS INTEGRATION
  async getLocationForAnalytics(): Promise<{
    country?: string;
    region?: string;
    timezone: string;
  }> {
    const preferences = await this.getLocationPreferences();
    
    if (!preferences.shareLocationForAnalytics) {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    
    const location = await this.getCurrentLocation();
    if (!location) {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
    
    return {
      country: location.countryCode,
      region: location.regionCode,
      timezone: location.timezone
    };
  }

  // UTILITY METHODS
  async getTimezone(): Promise<string> {
    const location = await this.getCurrentLocation();
    return location?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  async getCountryCode(): Promise<string | null> {
    const location = await this.getCurrentLocation();
    return location?.countryCode || null;
  }

  async isInEurope(): Promise<boolean> {
    const location = await this.getCurrentLocation();
    const europeanCountries = [
      'AD', 'AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CY', 'CZ', 'DE', 'DK',
      'EE', 'ES', 'FI', 'FR', 'GB', 'GE', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT',
      'LI', 'LT', 'LU', 'LV', 'MC', 'MD', 'ME', 'MK', 'MT', 'NL', 'NO', 'PL',
      'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SK', 'SM', 'UA', 'VA'
    ];
    
    return location ? europeanCountries.includes(location.countryCode) : false;
  }

  // GDPR COMPLIANCE
  async exportLocationData(): Promise<any> {
    const preferences = await this.getLocationPreferences();
    const cachedLocation = await AsyncStorage.getItem('@greedgross:cached-location');
    
    return {
      preferences,
      cachedLocation: cachedLocation ? JSON.parse(cachedLocation) : null,
      exportDate: new Date().toISOString()
    };
  }

  async deleteAllLocationData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('@greedgross:location-preferences'),
        AsyncStorage.removeItem('@greedgross:cached-location')
      ]);
      
      this.cachedLocation = null;
      this.isLocationEnabled = false;
      this.stopLocationDetection();
    } catch (error) {
      console.error('Error deleting location data:', error);
      throw new Error('Failed to delete location data');
    }
  }
}

export const geoLocationService = new GeoLocationService();