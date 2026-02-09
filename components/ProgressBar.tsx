type Props = {
  value: number;
  max: number;
};

export default function ProgressBar({ value, max }: Props) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
