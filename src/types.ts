export type GardenLocation = 
  | 'Tube Feeder' 
  | 'Birdbath' 
  | 'Berry Bush' 
  | 'Suet Station' 
  | 'Lawn & Patio' 
  | 'Oak Branch' 
  | 'Nest Box';

export type BehaviorType = 
  | 'Feeder Snack' 
  | 'Water Bathing' 
  | 'Perched & Singing' 
  | 'Foraging on Ground' 
  | 'Preening Feathers' 
  | 'Nesting Material' 
  | 'Territory Patrol';

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

export interface BirdSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  favoriteFood: string;
  callDescription: string;
  funFact: string;
  size: string;
  rarityInBackyard: 'Common Visitor' | 'Seasonal Guest' | 'Rare Delight' | 'Daily Resident';
  badgeColor: string;
  primaryColor: string;
}

export interface BirdfyDevice {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'syncing' | 'offline';
  batteryPercent: number;
  isSolarCharging: boolean;
  wifiSignal: 'Excellent' | 'Good' | 'Fair';
  firmwareVersion: string;
  lastSyncTime: string;
  aiModelVersion: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  webhookEndpoint?: string;
  highlightUuid?: string;
  recapUuid?: string;
  dateRange?: string;
  storageUsedMB: number;
  storageTotalMB: number;
}

export interface BirdfyCaptureMetadata {
  isBirdfyCapture: boolean;
  feederName?: string;
  feederModel?: string;
  aiConfidence?: number; // 0 - 100 percentage
  aiDetectedSpecies?: string;
  triggerType?: 'PIR Motion' | 'AI Bird Detected' | 'Continuous Stream' | 'Manual Snapshot';
  resolution?: string; // e.g. "1080p Full HD" or "2K Ultra"
  clipDurationSeconds?: number;
  videoUrl?: string;
  batteryLevel?: number;
  isSolarCharging?: boolean;
  wifiSignal?: 'Excellent' | 'Good' | 'Fair';
  rawPIRTimestamp?: string;
}

export interface BirdSighting {
  id: string;
  speciesId: string;
  speciesName: string;
  imageUrl: string;
  videoUrl?: string;
  date: string;
  time: string;
  location: GardenLocation;
  behavior: BehaviorType;
  weather: string;
  count: number;
  notes: string;
  isFavorite: boolean;
  spottedBy: string;
  temperature?: string;
  birdfy?: BirdfyCaptureMetadata;
}

export interface GardenFeedingStation {
  id: string;
  name: string;
  type: GardenLocation;
  description: string;
  favoriteFood: string;
  frequentVisitors: string[];
  icon: string;
  coordinates: { x: number; y: number }; // Percentage for garden map
}

