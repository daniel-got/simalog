import { cn } from "../../utils/cn";

export default function Button({ children, className, variant = 'primary', ...props }) {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
    secondary: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    danger: "bg-red-100 text-red-700 hover:bg-red-200",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button className={cn(baseStyle, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
