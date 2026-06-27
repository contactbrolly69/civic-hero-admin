// ── Shared domain types for the Trust & Operations Console ────────────────

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'needs_verification'
  | 'on_hold'
  | 'rejected';

export type IssueSeverity  = 'critical' | 'moderate' | 'low';
export type IssueStatus    = 'open' | 'in-progress' | 'resolved';
export type IssueCategory  =
  | 'pothole' | 'garbage' | 'streetlight' | 'water_leak'
  | 'drainage' | 'footpath' | 'traffic_signal' | 'illegal_dumping';

// ── Moderation flags returned by the AI pipeline ─────────────────────────

export interface ImageFlags {
  quality_pass:     boolean;
  quality_issue:    string | null;
  is_screenshot:    boolean;
  is_selfie:        boolean;
  is_civic_related: boolean;
  has_explicit:     boolean;
  confidence:       number;
}

export interface TextFlags {
  has_profanity:        boolean;
  has_hate_speech:      boolean;
  has_personal_attack:  boolean;
  has_death_claim:      boolean;
  has_celebrity:        boolean;
  has_political_slogan: boolean;
  is_relevant:          boolean;
  is_spam:              boolean;
  confidence:           number;
  reason:               string;
}

export interface GeminiFlags {
  isRelevant:              boolean;
  categoryMatch:           number;
  titleMatch:              number;
  descriptionMatch:        number;
  spamProbability:         number;
  manualReviewRecommended: boolean;
  reasoningConfidence:     number;
  explanation:             string;
  flags:                   string[];
}

export interface SpamFlags {
  is_spam:            boolean;
  recent_submissions: number;
  reason:             string;
}

export interface ModerationFlags {
  image?:  Partial<ImageFlags>;
  text?:   Partial<TextFlags>;
  gemini?: Partial<GeminiFlags>;
  spam?:   Partial<SpamFlags>;
}

// ── Core entities ─────────────────────────────────────────────────────────

export interface ConsoleIssue {
  id:               string;
  title:            string;
  description:      string;
  category:         IssueCategory;
  severity:         IssueSeverity;
  status:           IssueStatus;
  location:         string;
  lat:              number | null;
  lng:              number | null;
  affectedCount:    number;
  supportCount:     number;
  hidden:           boolean;
  moderationStatus: ModerationStatus;
  createdAt:        string;
  updatedAt:        string;
  userId:           string | null;

  // Joined
  imageUrl:         string | null;
  afterImageUrl:    string | null;
  moderation:       ConsoleModerationRecord | null;
  user:             ConsoleUserSummary | null;
}

export interface ConsoleModerationRecord {
  id:             string;
  issueId:        string;
  status:         ModerationStatus;
  confidence:     number;
  reason:         string | null;
  flags:          ModerationFlags;
  aiModel:        string;
  moderatedAt:    string;
  reviewedBy:     string | null;
  reviewedAt:     string | null;
  overrideReason: string | null;
}

export interface ConsoleUserSummary {
  id:          string;
  name:        string;
  handle:      string;
  ward:        string;
  joinedAt:    string;
  isAdmin:     boolean;
}

export interface ConsoleUser extends ConsoleUserSummary {
  xp:              number;
  level:           string;
  reportCount:     number;
  approvedCount:   number;
  rejectedCount:   number;
  supportGiven:    number;
  email:           string | null;
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalIssues:       number;
  pendingReview:     number;
  onHold:            number;
  approvedToday:     number;
  rejectedToday:     number;
  needsVerification: number;
  totalUsers:        number;
  activeToday:       number;
  hiddenIssues:      number;
}

export interface TrendPoint {
  date:       string;
  submitted:  number;
  approved:   number;
  rejected:   number;
  onHold:     number;
}

export interface CategoryBreakdown {
  category: IssueCategory;
  count:    number;
  pct:      number;
}

// ── RBAC ──────────────────────────────────────────────────────────────────

export type ConsoleRole = 'super_admin' | 'moderator' | 'analyst';

export interface ConsoleSession {
  userId:  string;
  email:   string;
  name:    string;
  role:    ConsoleRole;
  isAdmin: boolean;
}

// ── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data:    T[];
  total:   number;
  page:    number;
  perPage: number;
  hasMore: boolean;
}

export interface IssueFilters {
  status?:           ModerationStatus | 'all';
  category?:         IssueCategory | 'all';
  severity?:         IssueSeverity | 'all';
  search?:           string;
  dateFrom?:         string;
  dateTo?:           string;
  hasImage?:         boolean;
  page?:             number;
  perPage?:          number;
}
