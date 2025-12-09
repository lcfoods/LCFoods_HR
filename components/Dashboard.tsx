import React, { useMemo, useState } from 'react';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, TrendingUp, UserCheck, UserMinus, Calendar, Briefcase, Activity } from 'lucide-react';

interface DashboardProps {
  currentCompanyId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentCompanyId }) => {
  const employees = StorageService.getEmployees(currentCompanyId);
  const departments = StorageService.getCategories('DEPARTMENT');
  const { t } = useLanguage();

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'OnLeave').length;
    const terminated = employees.filter(e => e.status === 'Terminated').length;
    
    // Mock trends for "enhancement" visual
    return { 
        total: employees.length, 
        active, 
        onLeave, 
        terminated,
        trendTotal: '+5%',
        trendActive: '+2%',
        trendLeave: '-1%'
    };
  }, [employees]);

  // --- Pie Chart Data (Employees by Department) ---
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(e => {
       const code = e.departmentCode || 'Unknown';
       counts[code] = (counts[code] || 0) + 1;
    });
    
    return Object.entries(counts).map(([code, count]) => {
        const deptName = departments.find(d => d.code === code)?.name || code;
        return { name: deptName, value: count };
    }).sort((a, b) => b.value - a.value);
  }, [employees, departments]);

  // --- Line Chart Data (Cumulative Growth) ---
  const growthData = useMemo(() => {
    const sorted = [...employees].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const points: {date: string, count: number, label: string}[] = [];
    let currentCount = 0;
    
    // Create a map of last 6 months
    const today = new Date();
    const months = [];
    for(let i=5; i>=0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Calculate count at the end of each month
    months.forEach(monthKey => {
        const [y, m] = monthKey.split('-').map(Number);
        const monthEnd = new Date(y, m, 0); // Last day of month
        
        const count = employees.filter(e => new Date(e.startDate) <= monthEnd).length;
        
        points.push({ 
            date: monthKey, 
            count,
            label: `${m}/${y}`
        });
    });
    
    return points;
  }, [employees]);


  // --- Interactive Pie Chart Component ---
  const InteractivePieChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

    if (total === 0) return <div className="text-center text-gray-400 py-12 flex flex-col items-center"><Activity className="w-10 h-10 mb-2 opacity-20"/>{t.dashboard.noData}</div>;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-full">
        <div className="relative w-64 h-64 shrink-0">
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full transform -rotate-90">
            {data.map((slice, i) => {
                const startPercent = cumulativePercent;
                const slicePercent = slice.value / total;
                cumulativePercent += slicePercent;
                
                const [startX, startY] = [Math.cos(2 * Math.PI * startPercent), Math.sin(2 * Math.PI * startPercent)];
                const [endX, endY] = [Math.cos(2 * Math.PI * cumulativePercent), Math.sin(2 * Math.PI * cumulativePercent)];
                const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                
                const pathData = slicePercent === 1 
                    ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0` // Full circle
                    : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                const isHovered = hoveredIndex === i;
                
                return (
                <path 
                    key={i} 
                    d={pathData} 
                    fill={colors[i % colors.length]} 
                    stroke="white" 
                    strokeWidth="0.02"
                    className="transition-all duration-300 ease-out cursor-pointer"
                    style={{ 
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: '0 0',
                        opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                />
                );
            })}
            {/* Center Label (Donut style) */}
            <circle cx="0" cy="0" r="0.6" fill="white" />
            </svg>
            
            {/* Central Info Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">
                    {hoveredIndex !== null ? data[hoveredIndex].value : total}
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide max-w-[100px] text-center truncate px-2">
                    {hoveredIndex !== null ? data[hoveredIndex].name : 'Total Staff'}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto w-full pr-2 custom-scrollbar">
            {data.map((item, i) => (
                <div 
                    key={i} 
                    className={`flex items-center gap-3 text-sm p-2 rounded-lg cursor-pointer transition-colors ${hoveredIndex === i ? 'bg-slate-100' : ''}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: colors[i % colors.length]}}></div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-slate-700 truncate" title={item.name}>{item.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{item.value}</span>
                            <span className="text-[10px] text-slate-500">({Math.round((item.value/total)*100)}%)</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  // --- Interactive Area Chart Component ---
  const InteractiveAreaChart = ({ data }: { data: { date: string; count: number; label: string }[] }) => {
      const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
      
      if (data.length < 2) return <div className="text-center text-gray-400 py-12 flex flex-col items-center"><TrendingUp className="w-10 h-10 mb-2 opacity-20"/>Not enough data</div>;

      const maxCount = Math.max(...data.map(d => d.count)) * 1.2 || 10; 
      const width = 100; // viewBox units
      const height = 50; // viewBox units
      const paddingX = 10;
      const paddingY = 10;
      
      const plotWidth = width - paddingX * 2;
      const plotHeight = height - paddingY * 2;

      const getX = (index: number) => (index / (data.length - 1)) * plotWidth + paddingX;
      const getY = (val: number) => height - paddingY - (val / maxCount) * plotHeight;

      const points = data.map((d, i) => `${getX(i)},${getY(d.count)}`).join(' ');
      const areaPoints = `${getX(0)},${height-paddingY} ${points} ${getX(data.length-1)},${height-paddingY}`;

      return (
          <div className="w-full h-64 relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
                <defs>
                    <linearGradient id="gradientArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines (Horizontal) */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = height - paddingY - t * plotHeight;
                    return <line key={t} x1={paddingX} y1={y} x2={width-paddingX} y2={y} stroke="#e2e8f0" strokeWidth="0.2" strokeDasharray="1 1" />;
                })}

                {/* Area */}
                <path d={areaPoints} fill="url(#gradientArea)" className="transition-all duration-500 ease-in-out" />
                
                {/* Line */}
                <polyline fill="none" stroke="#3b82f6" strokeWidth="0.8" points={points} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm" />
                
                {/* Interactive Points */}
                {data.map((d, i) => {
                    const x = getX(i);
                    const y = getY(d.count);
                    const isHovered = hoveredPoint === i;
                    
                    return (
                        <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                            {/* Invisible hit area */}
                            <rect x={x - 2} y={paddingY} width={4} height={plotHeight} fill="transparent" />
                            
                            {/* Visible Dot */}
                            <circle 
                                cx={x} cy={y} 
                                r={isHovered ? 2 : 1.2} 
                                fill={isHovered ? "#2563eb" : "white"} 
                                stroke="#3b82f6" 
                                strokeWidth={0.5}
                                className="transition-all duration-200"
                            />
                            
                            {/* X Axis Label */}
                            <text x={x} y={height - 2} textAnchor="middle" fontSize="3" fill={isHovered ? "#3b82f6" : "#94a3b8"} className="font-medium">
                                {d.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Floating Tooltip */}
            {hoveredPoint !== null && (
                <div 
                    className="absolute bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150 z-10"
                    style={{ 
                        left: `${(hoveredPoint / (data.length - 1)) * 80 + 10}%`, 
                        top: `${(1 - data[hoveredPoint].count / maxCount) * 60 + 10}%` // Approximate top position based on CSS logic
                    }}
                >
                    <div className="font-bold text-sm mb-0.5">{data[hoveredPoint].count} Employees</div>
                    <div className="text-slate-400 text-[10px]">{data[hoveredPoint].date}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                </div>
            )}
          </div>
      );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.dashboard.title}</h2>
            <p className="text-slate-500 mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex gap-1 shadow-sm">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">This Month</div>
            <div className="px-3 py-1 text-slate-500 hover:bg-slate-50 rounded-md text-xs font-medium cursor-pointer">Last Quarter</div>
            <div className="px-3 py-1 text-slate-500 hover:bg-slate-50 rounded-md text-xs font-medium cursor-pointer">Year to Date</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users className="w-6 h-6"/>
                </div>
                {/* <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{stats.trendTotal}</span> */}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t.dashboard.totalEmployees}</p>
                <p className="text-3xl font-black text-slate-800">{stats.total}</p>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 group hover:border-green-200 transition-all">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <UserCheck className="w-6 h-6"/>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t.dashboard.active}</p>
                <p className="text-3xl font-black text-slate-800">{stats.active}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 group hover:border-amber-200 transition-all">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6"/>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t.dashboard.onLeave}</p>
                <p className="text-3xl font-black text-slate-800">{stats.onLeave}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 group hover:border-red-200 transition-all">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <UserMinus className="w-6 h-6"/>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{t.dashboard.terminated}</p>
                <p className="text-3xl font-black text-slate-800">{stats.terminated}</p>
            </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pie Chart Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-blue-500" />
                          {t.dashboard.deptDist}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Breakdown by current headcount</p>
                  </div>
              </div>
              <div className="flex-1 min-h-[300px]">
                  <InteractivePieChart data={deptData} />
              </div>
          </div>

          {/* Line Chart Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          {t.dashboard.growth}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{t.dashboard.growthSub}</p>
                  </div>
               </div>
               <div className="flex-1 min-h-[300px] flex items-center">
                   <InteractiveAreaChart data={growthData} />
               </div>
          </div>
      </div>
    </div>
  );
};