export function Table({ headers, children }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {headers.map((h, i) => (
              <th key={i} className="px-13 py-8 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  );
}
