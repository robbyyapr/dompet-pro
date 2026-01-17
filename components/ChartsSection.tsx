
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  isDarkMode?: boolean;
}

export const ChartsSection: React.FC<Props> = ({ transactions, isDarkMode }) => {
  const [drillDown, setDrillDown] = useState<string | null>(null);

  const axisColor = isDarkMode ? '#718096' : '#a0aec0';
  const tooltipBg = isDarkMode ? '#1a1c1e' : '#ffffff';
  const tooltipText = isDarkMode ? '#f7fafc' : '#1a202c';

  // Cashflow Data (Area)
  const chartData = transactions.slice().reverse().reduce((acc: any[], curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const existing = acc.find(a => a.name === dateStr);
    const isIncome = curr.type === 'Income';
    
    if (existing) {
      if (isIncome) existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({ 
        name: dateStr, 
        income: isIncome ? curr.amount : 0, 
        expense: isIncome ? 0 : curr.amount 
      });
    }
    return acc;
  }, []);

  // Category Data (Pie)
  const categoryData = transactions.reduce((acc: any[], curr) => {
    if (curr.type !== 'Expense') return acc;
    const existing = acc.find(a => a.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  const totalExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Weekly Comparison (Bar)
  const weeklyData = transactions.reduce((acc: any[], curr) => {
    const d = new Date(curr.date);
    const day = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const existing = acc.find(a => a.name === day);
    if (existing) {
      if (curr.type === 'Income') existing.income += curr.amount;
      else existing.expense += curr.amount;
    } else {
      acc.push({ name: day, income: curr.type === 'Income' ? curr.amount : 0, expense: curr.type === 'Expense' ? curr.amount : 0 });
    }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: tooltipBg, color: tooltipText }} className="p-4 rounded-2xl shadow-xl border-none text-xs font-semibold">
          <p className="opacity-60 mb-1">{label || payload[0].name}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || p.fill }}>
              {p.name}: Rp {p.value.toLocaleString('id-ID')} 
              {p.name === 'value' && totalExpense > 0 && ` (${((p.value / totalExpense) * 100).toFixed(1)}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    if (percent < 0.05) return null; 

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8 mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="neu-card p-6 min-h-[420px]">
          <h3 className="text-lg font-bold mb-6 text-primary flex justify-between items-center">
            Daily Cash Flow
            <span className="text-[10px] text-secondary font-normal uppercase tracking-wider">Trend Arus Kas</span>
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData.slice(-7)}>
              <defs>
                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" fill="url(#colorInc)" strokeWidth={3} />
              <Area type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="neu-card p-6 min-h-[420px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Proporsi Pengeluaran</h3>
              <p className="text-[10px] text-secondary uppercase font-bold tracking-widest mt-1">Berdasarkan Kategori</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-secondary uppercase font-bold tracking-widest mb-1">Total Terpakai</p>
              <p className="text-sm font-black text-red-500">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="w-full h-[280px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 8)}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    onClick={(data) => setDrillDown(data.name)}
                    className="cursor-pointer"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-64 text-[10px] space-y-2 mt-2 md:mt-0 max-h-[200px] md:max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
              {categoryData.map((entry, i) => {
                const percentage = totalExpense > 0 ? ((entry.value / totalExpense) * 100).toFixed(1) : 0;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <div className="flex flex-col">
                        <span className="text-primary font-bold truncate max-w-[90px]">{entry.name}</span>
                        <span className="text-[9px] text-secondary">{percentage}%</span>
                      </div>
                    </div>
                    <span className="font-bold text-primary">Rp {entry.value.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="neu-card p-8">
          <h3 className="text-lg font-bold mb-6 text-primary flex justify-between items-center">
            Analisa Mingguan
            <span className="text-[10px] text-secondary font-normal uppercase tracking-wider">Perbandingan Hari</span>
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip cursor={{fill: isDarkMode ? '#222' : '#e2e8f0'}} content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
              <Bar name="Pemasukan" dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
              <Bar name="Pengeluaran" dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {drillDown && (
        <div className="neu-card p-6 bg-blue-500/5 border-2 border-blue-200/20 animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <span className="text-8xl font-black text-primary">DETAIL</span>
           </div>
           <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-black text-xl text-blue-500">Detail Kategori: {drillDown}</h4>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Daftar Transaksi Terakhir</p>
              </div>
              <button 
                onClick={() => setDrillDown(null)} 
                className="neu-button px-4 py-2 text-red-500 font-bold text-[10px] uppercase rounded-xl"
              >
                Tutup Panel
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions.filter(t => t.category === drillDown).slice(0, 10).map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 neu-inset rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-primary font-bold text-sm">"{t.note}"</span>
                    <span className="text-[10px] text-secondary">{new Date(t.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <span className="font-black text-red-500 text-sm">Rp {t.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
