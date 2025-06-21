import { User, UserStats, UserPreferences } from '@/types';
import { generateUserId } from './helpers';

export function generateAnonymousUser(username: string): User {
  const stats: UserStats = {
    totalCrosses: 0,
    strainsCreated: 0,
    xp: 0,
    level: 1,
    badges: [],
    dailyMessagesUsed: 0,
    dailyCrossesUsed: 0,
  };

  const preferences: UserPreferences = {
    theme: 'dark',
    notifications: true,
    language: 'it',
  };

  return {
    id: generateUserId(),
    username,
    tier: 'free',
    joinDate: new Date(),
    lastActive: new Date(),
    stats,
    preferences,
  };
}

export function checkAdminEligibility(username: string): boolean {
  // Hidden admin usernames
  const adminUsernames = ['greedgross', 'admin', 'developer', 'breeder420'];
  return adminUsernames.includes(username.toLowerCase());
}

export function calculateDailyLimits(tier: 'free' | 'premium' | 'admin') {
  switch (tier) {
    case 'free':
      return {
        crosses: 1,
        messages: 5,
        strains: 10,
      };
    case 'premium':
    case 'admin':
      return {
        crosses: Infinity,
        messages: Infinity,
        strains: Infinity,
      };
    default:
      return {
        crosses: 1,
        messages: 5,
        strains: 10,
      };
  }
}

export function checkFeatureAccess(user: User, feature: 'cross' | 'message' | 'strain'): boolean {
  const limits = calculateDailyLimits(user.tier);

  switch (feature) {
    case 'cross':
      return user.stats.dailyCrossesUsed < limits.crosses;
    case 'message':
      return user.stats.dailyMessagesUsed < limits.messages;
    case 'strain':
      return user.stats.strainsCreated < limits.strains;
    default:
      return false;
  }
}

export function getNextBadge(user: User): { name: string; requirement: string } | null {
  const badges = [
    { name: 'Primo Incrocio', requirement: '1 incrocio completato', crosses: 1 },
    { name: 'Breeder Novizio', requirement: '10 incroci completati', crosses: 10 },
    { name: 'Genetista Esperto', requirement: '50 incroci completati', crosses: 50 },
    { name: 'Master Breeder', requirement: '100 incroci completati', crosses: 100 },
    { name: 'Collezionista', requirement: '25 strain salvati', strains: 25 },
    { name: 'Enciclopedia Vivente', requirement: '100 strain salvati', strains: 100 },
  ];

  for (const badge of badges) {
    const hasEarned = user.stats.badges.some(b => b.name === badge.name);
    if (!hasEarned) {
      if (badge.crosses && user.stats.totalCrosses >= badge.crosses) {
        return { name: badge.name, requirement: badge.requirement };
      }
      if (badge.strains && user.stats.strainsCreated >= badge.strains) {
        return { name: badge.name, requirement: badge.requirement };
      }
    }
  }

  return null;
}
