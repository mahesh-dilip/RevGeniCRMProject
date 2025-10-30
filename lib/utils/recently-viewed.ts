const STORAGE_KEY = 'crm_recently_viewed';
const MAX_ITEMS = {
  companies: 5,
  deals: 3,
  people: 3
};

interface RecentItem {
  id: string;
  name: string;
  type: 'company' | 'deal' | 'person';
  timestamp: number;
}

interface RecentlyViewed {
  companies: RecentItem[];
  deals: RecentItem[];
  people: RecentItem[];
}

export function addRecentlyViewed(item: Omit<RecentItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: RecentlyViewed = stored ? JSON.parse(stored) : {
      companies: [],
      deals: [],
      people: []
    };

    const category = item.type === 'company' ? 'companies' : item.type === 'deal' ? 'deals' : 'people';
    
    // Remove if already exists
    data[category] = data[category].filter(i => i.id !== item.id);
    
    // Add to front
    data[category].unshift({
      ...item,
      timestamp: Date.now()
    });

    // Trim to max
    data[category] = data[category].slice(0, MAX_ITEMS[category]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving recently viewed:', error);
  }
}

export function getRecentlyViewed(): RecentlyViewed {
  if (typeof window === 'undefined') {
    return { companies: [], deals: [], people: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { companies: [], deals: [], people: [] };
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return { companies: [], deals: [], people: [] };
  }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

