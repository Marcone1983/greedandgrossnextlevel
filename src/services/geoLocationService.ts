import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface LocationData {
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  zipCode?: string;
  timezone?: string;
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
      parser: this.parseIPAPIResponse.bind(this),
    },
    {
      name: 'ipinfo',
      url: 'https://ipinfo.io/json',
      fields: '',
      parser: this.parseIPInfoResponse.bind(this),
    },
    {
      name: 'ipgeolocation',
      url: 'https://api.ipgeolocation.io/ipgeo?apiKey=fallback',
      fields: '',
      parser: this.parseIPGeolocationResponse.bind(this),
    },
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
      // Silent error - location services initialization failed
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
      // Silent error - location fetch failed
      return this.getTimezoneOnlyLocation();
    }
  }

  // GPS LOCATION
  private async getGPSLocation(): Promise<LocationData | null> {
    return new Promise(resolve => {
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
              timestamp: new Date(),
            };
          }
        }
      } catch (error) {
        // Silent warning - IP service failed
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
      isp: data.isp,
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
      isp: data.org,
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
      isp: data.isp,
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
      timestamp: new Date(),
    };
  }

  // LOCATION WATCHING
  async startLocationDetection(): Promise<void> {
    const preferences = await this.getLocationPreferences();
    if (!preferences.enableLocationServices) return;

    // Update location every 15 minutes when app is active
    setInterval(
      async () => {
        try {
          await this.getCurrentLocation(true);
        } catch (error) {
          // Silent error - location watch failed
        }
      },
      15 * 60 * 1000
    );
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
      const firestore = getFirestore();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query Firebase for user analytics by region
      const analyticsRef = collection(firestore, 'user_analytics');
      const q = query(
        analyticsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const regionData = new Map<string, any>();

      // Aggregate data by region
      snapshot.forEach((doc) => {
        const data = doc.data();
        const region = data.location?.region || 'Unknown';
        
        if (!regionData.has(region)) {
          regionData.set(region, {
            userCount: 0,
            strains: new Map<string, number>(),
            totalSessionDuration: 0,
            sessionCount: 0,
            conversions: 0,
            useCases: new Map<string, number>(),
            seasonalData: { spring: 0, summer: 0, autumn: 0, winter: 0 },
          });
        }

        const regionStats = regionData.get(region);
        regionStats.userCount++;
        regionStats.totalSessionDuration += data.sessionDuration || 0;
        regionStats.sessionCount++;
        
        if (data.converted) regionStats.conversions++;
        
        // Track strains
        if (data.strains) {
          data.strains.forEach((strain: string) => {
            regionStats.strains.set(strain, (regionStats.strains.get(strain) || 0) + 1);
          });
        }
        
        // Track use cases
        if (data.useCase) {
          regionStats.useCases.set(data.useCase, (regionStats.useCases.get(data.useCase) || 0) + 1);
        }
        
        // Track seasonal data
        const month = new Date(data.timestamp).getMonth();
        const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'autumn';
        regionStats.seasonalData[season]++;
      });

      // Convert to GeographicInsight array
      const insights: GeographicInsight[] = [];
      regionData.forEach((stats, region) => {
        const popularStrains = Array.from(stats.strains.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([strain]) => strain);
          
        const topUseCases = Array.from(stats.useCases.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([useCase]) => useCase);
          
        insights.push({
          region,
          userCount: stats.userCount,
          popularStrains,
          averageSessionDuration: stats.sessionCount > 0 ? stats.totalSessionDuration / stats.sessionCount : 0,
          conversionRate: stats.userCount > 0 ? (stats.conversions / stats.userCount) * 100 : 0,
          topUseCases,
          seasonalTrends: stats.seasonalData,
        });
      });

      return insights.sort((a, b) => b.userCount - a.userCount);
    } catch (error) {
      // Silent fail - return empty array
      return [];
    }
  }

  async getCountryPopularity(): Promise<
    {
      country: string;
      countryCode: string;
      userCount: number;
      growthRate: number;
      averageRevenue: number;
      topStrains: string[];
    }[]
  > {
    try {
      const firestore = getFirestore();
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(now.getDate() - 60);

      // Get current period data
      const currentPeriodRef = collection(firestore, 'user_analytics');
      const currentQ = query(
        currentPeriodRef,
        where('timestamp', '>=', thirtyDaysAgo),
        where('timestamp', '<=', now),
        orderBy('timestamp', 'desc')
      );
      
      // Get previous period data for growth calculation
      const previousQ = query(
        currentPeriodRef,
        where('timestamp', '>=', sixtyDaysAgo),
        where('timestamp', '<', thirtyDaysAgo),
        orderBy('timestamp', 'desc')
      );

      const [currentSnapshot, previousSnapshot] = await Promise.all([
        getDocs(currentQ),
        getDocs(previousQ)
      ]);

      const countryData = new Map<string, any>();
      const previousCountryData = new Map<string, any>();

      // Process current period
      currentSnapshot.forEach((doc) => {
        const data = doc.data();
        const country = data.location?.country || 'Unknown';
        const countryCode = data.location?.countryCode || 'XX';
        
        if (!countryData.has(country)) {
          countryData.set(country, {
            country,
            countryCode,
            userCount: 0,
            revenue: 0,
            strains: new Map<string, number>(),
          });
        }
        
        const stats = countryData.get(country);
        stats.userCount++;
        stats.revenue += data.revenue || 0;
        
        if (data.strains) {
          data.strains.forEach((strain: string) => {
            stats.strains.set(strain, (stats.strains.get(strain) || 0) + 1);
          });
        }
      });

      // Process previous period for growth rate
      previousSnapshot.forEach((doc) => {
        const data = doc.data();
        const country = data.location?.country || 'Unknown';
        
        if (!previousCountryData.has(country)) {
          previousCountryData.set(country, { userCount: 0 });
        }
        
        previousCountryData.get(country).userCount++;
      });

      // Convert to array and calculate growth rates
      const popularityData: any[] = [];
      countryData.forEach((stats, country) => {
        const previousCount = previousCountryData.get(country)?.userCount || 0;
        const growthRate = previousCount > 0 
          ? ((stats.userCount - previousCount) / previousCount) * 100 
          : 100;
          
        const topStrains = Array.from(stats.strains.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([strain]) => strain);
          
        popularityData.push({
          country: stats.country,
          countryCode: stats.countryCode,
          userCount: stats.userCount,
          growthRate: Math.round(growthRate * 10) / 10,
          averageRevenue: stats.userCount > 0 ? stats.revenue / stats.userCount : 0,
          topStrains,
        });
      });

      return popularityData.sort((a, b) => b.userCount - a.userCount).slice(0, 20);
    } catch (error) {
      // Silent fail - return empty array
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
      autoDetectTimezone: true,
    };
  }

  async updateLocationPreferences(preferences: Partial<LocationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getLocationPreferences();
      const newPrefs = { ...currentPrefs, ...preferences };

      await AsyncStorage.setItem('@greedgross:location-preferences', JSON.stringify(newPrefs));

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
        await AsyncStorage.setItem('@greedgross:cached-location', JSON.stringify(location));
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
      case 'high':
        return ageInHours < 1; // GPS data valid for 1 hour
      case 'medium':
        return ageInHours < 24; // IP data valid for 24 hours
      case 'low':
        return ageInHours < 168; // Timezone data valid for 1 week
      default:
        return false;
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
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const location = await this.getCurrentLocation();
    if (!location) {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    return {
      country: location.countryCode || 'Unknown',
      region: location.regionCode || 'Unknown',
      timezone: location.timezone || 'UTC',
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
      'AD',
      'AL',
      'AT',
      'BA',
      'BE',
      'BG',
      'BY',
      'CH',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GB',
      'GE',
      'GR',
      'HR',
      'HU',
      'IE',
      'IS',
      'IT',
      'LI',
      'LT',
      'LU',
      'LV',
      'MC',
      'MD',
      'ME',
      'MK',
      'MT',
      'NL',
      'NO',
      'PL',
      'PT',
      'RO',
      'RS',
      'RU',
      'SE',
      'SI',
      'SK',
      'SM',
      'UA',
      'VA',
    ];

    return location ? europeanCountries.includes(location.countryCode || '') : false;
  }

  // GDPR COMPLIANCE
  async exportLocationData(): Promise<any> {
    const preferences = await this.getLocationPreferences();
    const cachedLocation = await AsyncStorage.getItem('@greedgross:cached-location');

    return {
      preferences,
      cachedLocation: cachedLocation ? JSON.parse(cachedLocation) : null,
      exportDate: new Date().toISOString(),
    };
  }

  async deleteAllLocationData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('@greedgross:location-preferences'),
        AsyncStorage.removeItem('@greedgross:cached-location'),
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
