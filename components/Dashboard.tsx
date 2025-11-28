
import React, { useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, Category } from '../types';
import { Users, TrendingUp, UserCheck, UserMinus } from 'lucide-react';

interface DashboardProps {
  currentCompanyId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentCompanyId }) => {
  const employees = StorageService.getEmployees(currentCompanyId);
  const departments = StorageService.getCategories('DEPARTMENT');

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'OnLeave').length;
    const terminated = employees.filter(e => e.status === 'Terminated').length;
    return { total: employees.length, active, onLeave, terminated };
  }, [employees]);

  // --- Pie Chart Data (Employees by Department) ---
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(e => {
       counts[e.departmentCode] = (counts[e.departmentCode] || 0) + 1;
    });
    
    return Object.entries(counts).map(([code, count]) => {
        const deptName = departments.find(d => d.code === code)?.name || code;
        return { name: deptName, value: count };
    }).sort((a, b) => b.value - a.value); // Sort descending
  }, [employees, departments]);

  // --- Line Chart Data (Cumulative Growth over Time) ---
  const growthData = useMemo(() => {
    const sorted = [...employees].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const points: {date: string, count: number}[] = [];
    let currentCount = 0;
    
    // Group by month for simplicity
    const processedMonths = new Set<string>();

    sorted.forEach(e => {
        const d = new Date(e.startDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        currentCount++;
        
        if (!processedMonths.has(key)) {
            points.push({ date: key, count: currentCount });
            processedMonths.add(key);
        } else {
            // Update last point if same month
            points[points.length - 1].count = currentCount;
        }
    });
    
    // Take last 6 months or all if less
    return points.slice(-6);
  }, [employees]);


  // --- Helper for Pie Chart SVG Path ---
  const getPieCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const PieChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (total === 0) return <div className="text-center text-gray-400 py-10">No data available</div>;

    return (
      <div className="flex items-center justify-center gap-8">
        <svg viewBox="-1 -1 2 2" className="w-48 h-48 transform -rotate-90">
          {data.map((slice, i) => {
            const startPercent = cumulativePercent;
            const slicePercent = slice.value / total;
            cumulativePercent += slicePercent;
            
            const [startX, startY] = getPieCoordinatesForPercent(startPercent);
            const [endX, endY] = getPieCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
            
            // If it's a full circle
            if (slicePercent === 1) {
                return <circle key={i} cx="0" cy="0" r="1" fill={colors[i % colors.length]} />;
            }

            const pathData = [
              `M 0 0`,
              `L ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`
            ].join(' ');

            return <path key={i} d={pathData} fill={colors[i % colors.length]} stroke="white" strokeWidth="0.05" />;
          })}
        </svg>
        <div className="space-y-2">
            {data.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors[i % colors.length]}}></div>
                    <span className="text-slate-600 w-24 truncate" title={item.name}>{item.name}</span>
                    <span className="font-bold text-slate-800">{Math.round((item.value/total)*100)}%</span>
                </div>
            ))}
        </div>
      </div>
    );
  };

  // --- Helper for Line Chart ---
  const LineChart = ({ data }: { data: { date: string; count: number }[] }) => {
      if (data.length < 2) return <div className="text-center text-gray-400 py-10">Not enough data for timeline</div>;

      const maxCount = Math.max(...data.map(d => d.count)) * 1.1; // Add 10% padding
      const width = 500;
      const height = 200;
      const padding = 20;
      
      const points = data.map((d, i) => {
          const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
          const y = height - (d.count / maxCount) * (height - padding * 2) - padding;
          return `${x},${y}`;
      }).join(' ');

      return (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
              {/* Grid Lines */}
              <line x1={padding} y1={height - padding} x2={width-padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
              
              {/* The Line */}
              <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} />
              
              {/* Dots */}
              {data.map((d, i) => {
                   const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
                   const y = height - (d.count / maxCount) * (height - padding * 2) - padding;
                   return (
                       <g key={i} className="group">
                           <circle cx={x} cy={y} r="4" fill="#3b82f6" className="group-hover:r-6 transition-all" />
                           {/* Tooltip text */}
                           <text x={x} y={y - 10} textAnchor="middle" fontSize="12" fill="#1e293b" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                               {d.count}
                           </text>
                           {/* X Axis Label */}
                           <text x={x} y={height - 5} textAnchor="middle" fontSize="10" fill="#64748b">
                               {d.date.split('-')[1]}/{d.date.split('-')[0].slice(2)}
                           </text>
                       </g>
                   );
              })}
          </svg>
      );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">HR Analytics Dashboard</h2>
        <p className="text-slate-500">Overview of workforce metrics and trends.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Employees</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users className="w-6 h-6"/></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-green-600"><UserCheck className="w-6 h-6"/></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">On Leave</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.onLeave}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg text-amber-600"><TrendingUp className="w-6 h-6"/></div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Terminated</p>
                    <p className="text-2xl font-bold text-slate-400">{stats.terminated}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-500"><UserMinus className="w-6 h-6"/></div>
            </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Department Distribution</h3>
              <PieChart data={deptData} />
          </div>

          {/* Line Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Employee Growth (Last 6 Months)</h3>
               <LineChart data={growthData} />
               <p className="text-xs text-center text-slate-400 mt-4">Cumulative Count by Start Date</p>
          </div>
      </div>
    </div>
  );
};
