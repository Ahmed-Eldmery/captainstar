
export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
}

export type TeamRole =
  | 'مؤسس الوكالة'
  | 'المدير التنفيذي'
  | 'مبيعات'
  | 'مدير مبيعات'
  | 'مدير حسابات'
  | 'صانع محتوى'
  | 'مصمم جرافيك'
  | 'مونتير فيديو'
  | 'مدير منصات'
  | 'مبرمج ويب'
  | 'مصمم واجهات'
  | 'خبير سيو'
  | 'مشتري إعلانات';

export enum ProjectStatus {
  PLANNED = 'مخطط له',
  IN_PROGRESS = 'قيد التنفيذ',
  ON_HOLD = 'متوقف مؤقتاً',
  COMPLETED = 'مكتمل',
  CANCELLED = 'ملغي',
}

export enum TaskStatus {
  BACKLOG = 'الانتظار',
  TODO = 'للتنفيذ',
  IN_PROGRESS = 'قيد العمل',
  WAITING_CLIENT = 'انتظار العميل',
  WAITING_APPROVAL = 'بانتظار الاعتماد',
  DONE = 'مكتمل',
  CANCELLED = 'ملغي',
}

export enum TaskPriority {
  LOW = 'منخفضة',
  MEDIUM = 'متوسطة',
  HIGH = 'عالية',
  CRITICAL = 'حرجة',
}

export enum TaskType {
  CONTENT = 'محتوى',
  DESIGN = 'تصميم',
  VIDEO = 'فيديو',
  MEDIA_BUY = 'ميديا باير',
  WEB = 'برمجة',
  SEO = 'سيو',
  SALES = 'مبيعات',
  MODERATION = 'إدارة منصات',
  UI_UX = 'واجهات',
  OTHER = 'أخرى',
}

export enum ApprovalStatus {
  PENDING_INTERNAL = 'PENDING_INTERNAL',
  PENDING_CLIENT = 'PENDING_CLIENT',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  teamRole: TeamRole | string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  industry?: string;
  country: string;
  packageType?: string;
  phoneNumber?: string;
  postsQuota?: number;
  videosQuota?: number;
  hasWebsite?: boolean;
  fileUpload?: boolean;
  numCampaigns?: number;
  numPlatforms?: number;
  coverImage?: string;
  hasCampaign?: boolean;
  campaigns?: Array<{
    id: string;
    name: string;
    platform: string;
    budget: number;
  }>;
  onboardingNotes?: string;
  assignedTeamIds?: string[];
  createdAt: string;
}

export interface ClientAccount {
  id: string;
  clientId: string;
  platform: string;
  accountName: string;
  accountUrl?: string;
  username?: string;
  accessEmail?: string;
  accessPassword?: string;
  visibleToRoles?: string[];
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  status: ProjectStatus;
  type?: string;
  description?: string;
  niche?: string;
  website?: {
    link?: string;
    username?: string;
    password?: string;
    type?: string;
  };
  receivedDate?: string;
  brief?: string;
  totalBudget?: number;
  platforms?: string[];
  campaignTypes?: string[];
  accounts?: Array<{
    platformId: string;
    platform: string;
    username?: string;
    password?: string;
  }>;
  driveLink?: string;
  productSheetLink?: string;
  copyAndDesign?: string;
  motion?: string;
  campaignDetails?: {
    startDate?: string;
    endDate?: string;
    notes?: string;
  };
  monthlyReport?: string;
  clientStatus?: string;
  startDate?: string;
  endDate?: string;
  objective?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  clientId: string;
  projectId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignedToUserId?: string;
  createdByUserId: string;
  dueDate?: string;
  createdAt: string;
}

export interface FileAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  client: string;
  size: string;
  date: string;
  url?: string;
}

export interface PerformanceSnapshot {
  id: string;
  clientId: string;
  campaignName: string;
  platform: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  clientId: string;
  requestedByUserId: string;
  status: ApprovalStatus;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  department: string;
  content: string;
  type: 'announcement' | 'discussion' | 'help';
  likes: number;
  createdAt: string;
}

export interface AgencySettings {
  [key: string]: string;
}
