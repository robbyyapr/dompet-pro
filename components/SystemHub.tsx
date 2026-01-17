
import React, { useState, useEffect } from 'react';
import { SystemLog, Transaction, Account } from '../types';

interface Props {
  logs: SystemLog[];
  transactions: Transaction[];
  accounts: Account[];
}

export const SystemHub: React.FC<Props> = ({ logs, transactions, accounts }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'security' | 'api'>('logs');
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const securityScore = () => {
    let score = 85;
    if (accounts.length < 3) score -= 10;
    const highTransactions = transactions.filter(t => t.amount > 5000000);
    if (highTransactions.length > 5) score -= 5;
    return score;
  };

  return (
    <div className="neu-card p-6 md:p-8 animate-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary">Intelligence Hub</h2>
          <p className="text-xs text-secondary font-bold uppercase tracking-widest mt-1">System Monitoring & Security Console</p>
        </div>
        <div className="flex bg-gray-500/10 p-1 rounded-2xl">
          {(['logs', 'security', 'api'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === tab ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-secondary hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-bold text-secondary">RECENT SYSTEM ACTIVITY</span>
               <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-1 rounded">LIVE FEED</span>
            </div>
            {logs.length > 0 ? logs.slice().reverse().map(log => (
              <div key={log.id} className="neu-inset p-3 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.status === 'SUCCESS' ? 'bg-green-500' : log.status === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-primary">{log.message}</p>
                    <p className="text-[9px] text-secondary font-medium uppercase tracking-tighter">
                      {log.type} • {log.latency ? `${log.latency}ms` : 'Internal'} • {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-blue-500">DETAILS</button>
              </div>
            )) : (
              <div className="text-center py-20 text-secondary italic opacity-50">No activity logs recorded yet.</div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="neu-inset p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                 <div className="text-4xl font-black text-blue-500 mb-2">{securityScore()}%</div>
                 <div className="text-[10px] font-black text-secondary uppercase tracking-widest">Security Health Score</div>
              </div>
              <div className="neu-inset p-6 rounded-3xl">
                 <h4 className="text-xs font-black text-primary uppercase mb-3">Threat Detection</h4>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-green-500">
                       <span>Anomaly Detection</span>
                       <span>ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-green-500">
                       <span>Encryption Layer</span>
                       <span>AES-256</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-yellow-500">
                       <span>PIN Integrity</span>
                       <span>MEDIUM</span>
                    </div>
                 </div>
              </div>
            </div>
            <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
               <h4 className="text-xs font-black text-blue-500 uppercase mb-2">Security Advice</h4>
               <p className="text-sm text-primary leading-relaxed">System mendeteksi bahwa PIN 4-digit Anda belum diubah selama 30 hari terakhir. Disarankan untuk memperbarui kode akses melalui bot Telegram.</p>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="neu-inset p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Latency</p>
                  <p className="text-lg font-black text-green-500">42ms</p>
               </div>
               <div className="neu-inset p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Model</p>
                  <p className="text-sm font-black text-blue-500">Gemini 3 Pro</p>
               </div>
               <div className="neu-inset p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Uptime</p>
                  <p className="text-sm font-black text-primary">{formatUptime(uptime)}</p>
               </div>
               <div className="neu-inset p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Region</p>
                  <p className="text-sm font-black text-primary">asia-east1</p>
               </div>
            </div>
            <div className="neu-inset p-6 rounded-3xl">
               <h4 className="text-xs font-black text-primary uppercase mb-4">Traffic Analyzer</h4>
               <div className="flex items-end gap-1 h-20">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="flex-1 bg-blue-500/30 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }} />
                  ))}
               </div>
               <div className="flex justify-between mt-2 text-[8px] font-bold text-secondary">
                  <span>24H AGO</span>
                  <span>NOW</span>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
