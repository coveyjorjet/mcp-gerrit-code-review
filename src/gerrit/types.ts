export interface GerritAccount {
  _account_id: number;
  name?: string;
  display_name?: string;
  email?: string;
  username?: string;
  avatars?: { url: string; height: number }[];
}

export interface GerritChange {
  id: string;
  project: string;
  branch: string;
  topic?: string;
  change_id: string;
  subject: string;
  status: "NEW" | "MERGED" | "ABANDONED";
  created: string;
  updated: string;
  submitted?: string;
  submit_type?: string;
  mergeable?: boolean;
  submittable?: boolean;
  insertions: number;
  deletions: number;
  total_comment_count?: number;
  unresolved_comment_count?: number;
  _number: number;
  owner: GerritAccount;
  revisions?: Record<string, GerritRevision>;
  current_revision?: string;
  messages?: GerritMessage[];
  labels?: Record<string, GerritLabelInfo>;
  permitted_labels?: Record<string, string[]>;
  removable_reviewers?: GerritAccount[];
  reviewers?: Record<"REVIEWER" | "CC" | "REMOVED", GerritAccount[]>;
  pending_reviewers?: Record<string, unknown>;
}

export interface GerritRevision {
  kind: number;
  _number: number;
  created: string;
  uploader: GerritAccount;
  ref: string;
  fetch?: Record<string, GerritFetchInfo>;
  commit?: GerritCommit;
  files?: Record<string, GerritFileInfo>;
  description?: string;
}

export interface GerritFetchInfo {
  url: string;
  ref: string;
  commands?: Record<string, string>;
}

export interface GerritCommit {
  commit: string;
  parents: { commit: string; subject: string }[];
  author: GerritCommitUser;
  committer: GerritCommitUser;
  subject: string;
  message: string;
  web_links?: { name: string; url: string }[];
}

export interface GerritCommitUser {
  name: string;
  email: string;
  date: string;
  tz: number;
}

export interface GerritFileInfo {
  status?: "A" | "D" | "R" | "W" | "M";
  binary?: boolean;
  old_path?: string;
  lines_inserted?: number;
  lines_deleted?: number;
  size_delta?: number;
  size?: number;
}

export interface GerritDiffInfo {
  meta_a?: unknown;
  meta_b?: unknown;
  change_type: "ADDED" | "MODIFIED" | "DELETED" | "RENAMED" | "COPIED" | "REWRITE";
  intraline_status?: string;
  diff_header?: string[];
  content: GerritDiffContent[];
  web_links?: { name: string; url: string }[];
}

export interface GerritDiffContent {
  a?: string[];
  b?: string[];
  ab?: string[];
  common?: boolean;
  edit_a?: (string | number)[][];
  edit_b?: (string | number)[][];
  due_to_rebase?: boolean;
  skip?: number;
}

export interface GerritMessage {
  id: string;
  tag?: string;
  author?: GerritAccount;
  real_author?: GerritAccount;
  date: string;
  message: string;
  _revision_number?: number;
}

export interface GerritComment {
  id: string;
  path?: string;
  side?: "REVISION" | "PARENT";
  parent?: number;
  line?: number;
  range?: GerritCommentRange;
  in_reply_to?: string;
  updated: string;
  message: string;
  unresolved?: boolean;
  author?: GerritAccount;
  tag?: string;
  commit_id?: string;
  patch_set?: number;
}

export interface GerritCommentRange {
  start_line: number;
  start_character: number;
  end_line: number;
  end_character: number;
}

export interface GerritLabelInfo {
  all?: GerritApproval[];
  values?: Record<string, string>;
  default_value?: number;
  value?: number;
  approved?: GerritAccount;
  recommended?: GerritAccount;
  disliked?: GerritAccount;
  rejected?: GerritAccount;
  blocking?: boolean;
}

export interface GerritApproval {
  value?: number;
  permitted_voting_range?: { min: number; max: number };
  date?: string;
  tag?: string;
  real_author?: GerritAccount;
  _account_id?: number;
  name?: string;
  username?: string;
  email?: string;
}

export interface GerritReviewerInfo {
  _account_id: number;
  name?: string;
  display_name?: string;
  email?: string;
  username?: string;
  approvals?: Record<string, string>;
  _more_accounts?: boolean;
}

export interface GerritReviewInput {
  message?: string;
  labels?: Record<string, number>;
  tag?: string;
  comments?: Record<string, GerritCommentInput[]>;
  reviewers?: GerritReviewerInput[];
  omit_duplicate_comments?: boolean;
  notify?: "NONE" | "OWNER" | "OWNER_REVIEWERS" | "ALL";
  ready?: boolean;
  work_in_progress?: boolean;
}

export interface GerritCommentInput {
  id?: string;
  path?: string;
  side?: "REVISION" | "PARENT";
  parent?: number;
  line?: number;
  range?: GerritCommentRange;
  in_reply_to?: string;
  updated?: string;
  message?: string;
  tag?: string;
  unresolved?: boolean;
}

export interface GerritReviewerInput {
  reviewer: string;
  state?: "REVIEWER" | "CC";
  confirmed?: boolean;
  notify?: "NONE" | "OWNER" | "OWNER_REVIEWERS" | "ALL";
}

export interface GerritProjectInfo {
  id: string;
  name?: string;
  parent?: string;
  description?: string;
  state?: "ACTIVE" | "READ_ONLY" | "HIDDEN";
  branches?: Record<string, GerritBranchInfo>;
  labels?: Record<string, GerritLabelTypeInfo>;
  web_links?: { name: string; url: string }[];
}

export interface GerritBranchInfo {
  ref: string;
  revision: string;
  can_delete?: boolean;
  web_links?: { name: string; url: string }[];
}

export interface GerritLabelTypeInfo {
  values: Record<string, string>;
  default_value: number;
  branches?: string[];
  can_override?: boolean;
  copy_any_score?: boolean;
  copy_min_score?: boolean;
  copy_all_scores_if_list_of_files_did_not_change?: boolean;
  copy_all_scores_on_trivial_rebase?: boolean;
  description?: string;
}

export interface GerritServerInfo {
  accounts: Record<string, unknown>;
  auth: Record<string, unknown>;
  change: Record<string, unknown>;
  download: Record<string, unknown>;
  gerrit: GerritGerritInfo;
  note_db_enabled?: boolean;
  plugin: Record<string, unknown>;
  sshd?: Record<string, unknown>;
  suggest: Record<string, unknown>;
  user: Record<string, unknown>;
  receive?: Record<string, unknown>;
}

export interface GerritGerritInfo {
  all_projects: string;
  all_users: string;
  doc_url?: string;
  edit_gpg_keys?: boolean;
  report_bug_url?: string;
  web_uis?: { name: string; url: string }[];
}

export interface GerritQueryResult {
  id: string;
  project: string;
  branch: string;
  topic?: string;
  change_id: string;
  subject: string;
  status: "NEW" | "MERGED" | "ABANDONED";
  created: string;
  updated: string;
  submit_type?: string;
  mergeable?: boolean;
  submittable?: boolean;
  insertions: number;
  deletions: number;
  _number: number;
  owner: GerritAccount;
  _more_changes?: boolean;
}
