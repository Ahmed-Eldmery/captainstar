
import { 
  Role, ProjectStatus, TaskStatus, TaskPriority, TaskType, 
  User, Client, Project, Task, PerformanceSnapshot, ActivityLogEntry,
  ApprovalStatus, Approval, ClientAccount
} from './types';

export const USERS: User[] = [
  // الـ OWNER (أنت) - محمي بالكامل
  {
    id: 'u-admin',
    name: 'أحمد النجم',
    email: 'admin@captainstar.com',
    passwordHash: 'password123',
    role: Role.OWNER,
    teamRole: 'مبرمج ويب',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
  },
  // 2 Admin
  {
    id: 'u-am-1',
    name: 'سلطان القحطاني',
    email: 'sultan@captainstar.com',
    passwordHash: 'password123',
    role: Role.ADMIN,
    teamRole: 'مدير حسابات',
    isActive: true,
    createdAt: '2023-02-01T00:00:00Z',
  },
  {
    id: 'u-am-2',
    name: 'مريم العتيبي',
    email: 'mariam@captainstar.com',
    passwordHash: 'password123',
    role: Role.ADMIN,
    teamRole: 'مدير حسابات',
    isActive: true,
    createdAt: '2023-02-15T00:00:00Z',
  },
  // 5 Team Members
  {
    id: 'u-tm-1',
    name: 'خالد صانع المحتوى',
    email: 'khaled@captainstar.com',
    passwordHash: 'password123',
    role: Role.TEAM_MEMBER,
    teamRole: 'صانع محتوى',
    isActive: true,
    createdAt: '2023-03-01T00:00:00Z',
  },
  {
    id: 'u-tm-2',
    name: 'سارة المصممة',
    email: 'sara@captainstar.com',
    passwordHash: 'password123',
    role: Role.TEAM_MEMBER,
    teamRole: 'مصمم جرافيك',
    isActive: true,
    createdAt: '2023-03-05T00:00:00Z',
  },
  {
    id: 'u-tm-3',
    name: 'فهد المونتير',
    email: 'fahad@captainstar.com',
    passwordHash: 'password123',
    role: Role.TEAM_MEMBER,
    teamRole: 'مونتير فيديو',
    isActive: true,
    createdAt: '2023-03-10T00:00:00Z',
  },
  {
    id: 'u-tm-4',
    name: 'نورة الميديا باير',
    email: 'noura@captainstar.com',
    passwordHash: 'password123',
    role: Role.TEAM_MEMBER,
    teamRole: 'مشتري إعلانات',
    isActive: true,
    createdAt: '2023-03-15T00:00:00Z',
  },
  {
    id: 'u-tm-5',
    name: 'بندر المبرمج',
    email: 'bandar@captainstar.com',
    passwordHash: 'password123',
    role: Role.TEAM_MEMBER,
    teamRole: 'مبرمج ويب',
    isActive: true,
    createdAt: '2023-03-20T00:00:00Z',
  }
];

export const CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'شركة نادك للأغذية',
    industry: 'أغذية ومشروبات',
    country: 'السعودية',
    phoneNumber: '966501234567',
    postsQuota: 20,
    videosQuota: 4,
    numCampaigns: 3,
    numPlatforms: 2,
    hasWebsite: true,
    fileUpload: true,
    hasCampaign: true,
    packageType: 'باقة المحتوى المتقدمة',
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=200&fit=crop',
    campaigns: [
      {
        id: 'camp-1-1',
        name: 'حملة الربيع 2025',
        platform: 'Instagram',
        budget: 25000
      }
    ],
    createdAt: '2023-05-01T00:00:00Z',
  },
  {
    id: 'c-2',
    name: 'مجموعة الفطيم العقارية',
    industry: 'عقارات',
    country: 'السعودية',
    phoneNumber: '966502345678',
    postsQuota: 12,
    videosQuota: 2,
    numCampaigns: 5,
    numPlatforms: 4,
    hasWebsite: true,
    fileUpload: true,
    hasCampaign: true,
    packageType: 'باقة المبيعات العقارية',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=200&fit=crop',
    campaigns: [
      {
        id: 'camp-2-1',
        name: 'حملة الفلل الفاخرة',
        platform: 'Google Ads',
        budget: 75000
      }
    ],
    createdAt: '2023-06-15T00:00:00Z',
  },
  {
    id: 'c-3',
    name: 'مطاعم البيك',
    industry: 'مطاعم',
    country: 'السعودية',
    phoneNumber: '966503456789',
    postsQuota: 30,
    videosQuota: 8,
    numCampaigns: 4,
    numPlatforms: 3,
    hasWebsite: true,
    fileUpload: false,
    hasCampaign: true,
    packageType: 'باقة إدارة كاملة',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561609?w=500&h=200&fit=crop',
    campaigns: [
      {
        id: 'camp-3-1',
        name: 'عرض البيك الصيفي',
        platform: 'TikTok',
        budget: 35000
      }
    ],
    createdAt: '2023-07-01T00:00:00Z',
  }
];

export const CLIENT_ACCOUNTS: ClientAccount[] = [
  {
    id: 'ca-1',
    clientId: 'c-1',
    platform: 'Instagram',
    accountName: 'Nadec Foods Official',
    username: '@nadec_foods',
    accountUrl: 'https://instagram.com/nadec_foods',
    isActive: true
  },
  {
    id: 'ca-2',
    clientId: 'c-1',
    platform: 'Snapchat',
    accountName: 'Nadec Lifestyle',
    username: 'nadec_snap',
    isActive: true
  },
  {
    id: 'ca-3',
    clientId: 'c-2',
    platform: 'TikTok',
    accountName: 'Al Futtaim Properties SA',
    username: '@alfuttaim_properties',
    isActive: true
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'p-1',
    clientId: 'c-1',
    name: 'حملة العودة للمدارس 2024',
    status: ProjectStatus.IN_PROGRESS,
    type: 'Monthly_Management',
    totalBudget: 150000,
    createdByUserId: 'u-am-1',
    createdAt: '2024-07-20T00:00:00Z',
  },
  {
    id: 'p-2',
    clientId: 'c-2',
    name: 'مبيعات فلل الياسمين',
    status: ProjectStatus.IN_PROGRESS,
    type: 'Ad_Campaign',
    totalBudget: 300000,
    createdByUserId: 'u-am-2',
    createdAt: '2024-07-25T00:00:00Z',
  }
];

export const TASKS: Task[] = [
  {
    id: 't-1',
    clientId: 'c-1',
    title: 'كتابة محتوى بوستات نادك - الأسبوع الأول',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    type: TaskType.CONTENT,
    assignedToUserId: 'u-tm-1',
    createdByUserId: 'u-am-1',
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 't-2',
    clientId: 'c-3',
    title: 'سكربت فيديو البيك لرمضان',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.CRITICAL,
    type: TaskType.CONTENT,
    assignedToUserId: 'u-tm-1',
    createdByUserId: 'u-am-2',
    createdAt: '2024-03-02T00:00:00Z',
  }
];

export const PERFORMANCE: PerformanceSnapshot[] = [
  {
    id: 'perf-1',
    clientId: 'c-2',
    campaignName: 'حملة مبيعات العقار - الرياض',
    platform: 'Snapchat',
    date: '2024-07-28',
    spend: 25000,
    impressions: 850000,
    clicks: 12000,
    leads: 320,
    conversions: 45,
    startDate: '2024-07-01',
    endDate: '2024-07-30'
  }
];

export const APPROVALS: Approval[] = [
  {
    id: 'app-1',
    taskId: 't-1',
    clientId: 'c-1',
    requestedByUserId: 'u-tm-1',
    status: ApprovalStatus.APPROVED,
    createdAt: '2024-03-05T12:00:00Z',
  }
];

export const ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    userId: 'u-admin',
    action: 'تغيير حالة المهمة t-1 إلى مكتمل',
    entityType: 'Task',
    entityId: 't-1',
    createdAt: '2024-03-10T10:00:00Z'
  }
];
