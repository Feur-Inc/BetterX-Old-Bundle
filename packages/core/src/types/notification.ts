// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType = "info" | "success" | "warning" | "error";

export type NotificationAction = {
  label: string;
  callback: () => void;
  autoClose?: boolean;
};

export type NotificationOptions = {
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  progress?: boolean;
  actions?: NotificationAction[];
  icon?: string | null;
  plugin?: string | null;
  html?: boolean;
};
