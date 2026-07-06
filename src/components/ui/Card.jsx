import { cn } from "../../utils/cn";

export function Card({ children, className }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 p-4", className)}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <Card className={cn("flex flex-col gap-2", colorClass)}>
      <div className="flex items-center justify-between text-gray-700">
        <span className="text-sm font-medium">{title}</span>
        {Icon && <Icon size={20} className="opacity-70" />}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </Card>
  );
}
