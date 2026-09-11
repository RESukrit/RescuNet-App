export interface AppProfile {
  name: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  githubUrl: string;
  websiteUrl?: string;
  email?: string;
  location?: string;
  statusText?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  stars?: number;
  forks?: number;
  liveUrl?: string;
  repoUrl?: string;
  category: string;
  featured?: boolean;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface HighlightItem {
  year: string;
  title: string;
  organization: string;
  description: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon: string;
}

export interface WebsiteConfig {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    ctaSecondaryLink: string;
  };
  about: {
    summary: string;
    bullets: string[];
    stats: Array<{ label: string; value: string }>;
  };
  projects: ProjectItem[];
  skills: SkillCategory[];
  highlights: HighlightItem[];
  contact: {
    message: string;
    links: SocialLink[];
  };
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
  icon: string;
}

export interface TrafficPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
}

export interface RepoActivityPoint {
  month: string;
  commits: number;
  prs: number;
  stars: number;
}

export interface SourceShare {
  name: string;
  value: number;
  color: string;
}

export interface DeploymentRecord {
  id: string;
  project: string;
  environment: string;
  status: 'Success' | 'Building' | 'Failed';
  branch: string;
  commit: string;
  time: string;
  url: string;
}

export interface ActivityEvent {
  id: string;
  type: 'commit' | 'deploy' | 'release' | 'star';
  title: string;
  description: string;
  timestamp: string;
  author: string;
}

export interface DashboardConfig {
  kpis: DashboardKpi[];
  trafficData: TrafficPoint[];
  repoActivityData: RepoActivityPoint[];
  trafficSources: SourceShare[];
  deployments: DeploymentRecord[];
  recentActivities: ActivityEvent[];
  systemHealth: {
    uptime: string;
    responseTime: string;
    sslStatus: string;
    buildStatus: string;
    lighthouseScore: number;
  };
}

export interface SosSignal {
  id: number;
  name: string;
  condition: string;
  battery: number;
  lat: number;
  lng: number;
  priority: number;
  time: string;
  status?: 'active' | 'assigned' | 'rescued';
  notes?: string;
  meshHops?: number;
}

export interface HazardZone {
  id: string;
  title: string;
  type: 'flood' | 'fire' | 'landslide' | 'debris';
  severity: 'critical' | 'high' | 'moderate';
  center: [number, number];
  radius: number;
  description: string;
  active: boolean;
}

export interface MeshNode {
  id: string;
  name: string;
  type: 'victim' | 'relay_phone' | 'gateway' | 'command_base';
  lat: number;
  lng: number;
  battery: number;
  signalStrength: number; // dBm or percentage
  status: 'online' | 'hopping' | 'offline';
  connectedTo: string[];
}

export interface AppConfig {
  source: {
    url: string;
    type: 'github_page' | 'repo' | 'custom';
    lastSynced?: string;
  };
  profile: AppProfile;
  theme: 'slate' | 'indigo' | 'emerald';
  website: WebsiteConfig;
  dashboard: DashboardConfig;
  rescuNet?: {
    activeBeaconCount: number;
    defaultCoordinates: { lat: number; lng: number };
    sampleSignals: SosSignal[];
    hazardZones: HazardZone[];
  };
}
