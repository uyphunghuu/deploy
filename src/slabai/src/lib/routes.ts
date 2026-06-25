import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Gauge,
  HelpCircle,
  Home,
  MessageCircle,
  Settings2,
  User,
  Watch
} from "lucide-react";

export const routes = {
  register: "/register",
  registerEmail: "/register/email",
  registerVerify: "/register/verify",
  login: "/login",
  loginVerify: "/login/verify",
  dashboard: "/dashboard",
  calendar: "/calendar",
  community: "/community",
  roadmap: "/roadmap",
  importData: "/import-data",
  planSport: "/plan-builder/sport",
  planGoals: "/plan-builder/goals",
  planSchedule: "/plan-builder/schedule",
  planAdvanced: "/plan-builder/advanced",
  planReview: "/plan-builder/review",
  insightsProfilesZones: "/insights/profiles-zones",
  profile: "/profile",
  aiCoachSettings: "/settings/ai-coach",
  preferences: "/settings/preferences",
  devicesApps: "/settings/devices-apps",
  billing: "/settings/billing",
  help: "/help"
} as const;

export type RouteHref = (typeof routes)[keyof typeof routes];

export interface NavItem {
  href: RouteHref;
  label: string;
  icon: typeof Home;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    items: [{ href: routes.dashboard, label: "Dashboard", icon: Home }]
  },
  {
    label: "Training",
    items: [
      { href: routes.calendar, label: "Calendar", icon: CalendarDays },
      { href: routes.planSport, label: "Plan Builder", icon: Gauge }
    ]
  },
  {
    label: "Insights",
    items: [{ href: routes.insightsProfilesZones, label: "Profiles & Zones", icon: BarChart3 }]
  },
  {
    label: "Community",
    items: [{ href: routes.community, label: "Community Feed", icon: MessageCircle }]
  },
  {
    label: "Account",
    items: [
      { href: routes.profile, label: "Profile", icon: User },
      { href: routes.aiCoachSettings, label: "AI Coach Settings", icon: Settings2 },
      { href: routes.devicesApps, label: "Devices & Apps", icon: Watch },
      { href: routes.billing, label: "Billing & Subscription", icon: CreditCard }
    ]
  },
  {
    label: "Support",
    items: [{ href: routes.help, label: "Help Center", icon: HelpCircle }]
  }
];

export const planSteps = [
  { label: "Sport", href: routes.planSport },
  { label: "Goals", href: routes.planGoals },
  { label: "Schedule", href: routes.planSchedule },
  { label: "Advanced", href: routes.planAdvanced },
  { label: "Review", href: routes.planReview }
] as const;
