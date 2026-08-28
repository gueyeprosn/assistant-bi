type Tone = "info" | "success" | "warning" | "money" | "danger" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  money: "bg-money-bg text-money",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-soft text-navy",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return <span className={`badge ${TONE_CLASS[tone]}`}>{children}</span>;
}
