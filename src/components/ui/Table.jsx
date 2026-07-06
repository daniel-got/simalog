import { cn } from "../../utils/cn";

export function Table({ headers, children, className }) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-gray-100", className)}>
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  );
}
