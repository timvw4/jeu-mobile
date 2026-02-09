type Props = {
  label: string;
  tone?: "info" | "success" | "warning";
};

export default function Badge({ label, tone = "info" }: Props) {
  const colors = {
    info: "bg-sky-500/20 text-sky-100 border border-sky-500/40",
    success: "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40",
    warning: "bg-amber-500/20 text-amber-100 border border-amber-500/40",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors[tone]}`}
    >
      {label}
    </span>
  );
}
