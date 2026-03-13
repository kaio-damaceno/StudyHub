
import React, { useMemo } from 'react';
import { useFlashcards } from '../../contexts/FlashcardContext';
import { Icon } from '../ui/Icon';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { AdaptEngine } from '../../core/flashcards/AdaptEngine';

const StatisticsView: React.FC = () => {
  const { cards } = useFlashcards();
  const engine = useMemo(() => new AdaptEngine(), []);

  // --- AGREGADORES DE DADOS EM TEMPO REAL ---
  const stats = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    const stabilized = cards.filter(c => c.metrics.stability > 21 && !c.isSuspended);
    const fragile = cards.filter(c => (c.stage === 'S5_LAPSE' || c.stage === 'S1_ACQUISITION') && !c.isSuspended);
    const pending = cards.filter(c => !c.isSuspended && (c.nextReview ? c.nextReview <= now : true));
    
    // Cards revisados hoje (buscando no histórico)
    const completedToday = cards.filter(c => {
        return c.metrics.history.some(log => new Date(log.timestamp).toDateString() === todayStr);
    });

    // Risco Médio Real da Coleção
    const avgRisk = cards.length > 0 
        ? (cards.reduce((acc, c) => acc + engine.calculateCurrentRisk(c, now), 0) / cards.length) * 100
        : 0;

    // Cálculo de Presença (Dias com pelo menos 1 revisão)
    const allLogs = cards.flatMap(c => c.metrics.history);
    const uniqueDays = new Set<string>(allLogs.map(l => new Date(l.timestamp).toDateString()));
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const daysInMonthElapsed = new Date().getDate();
    const activeDaysThisMonth = Array.from(uniqueDays).filter((d: string) => new Date(d) >= startOfMonth).length;
    const presenceRate = daysInMonthElapsed > 0 ? Math.round((activeDaysThisMonth / daysInMonthElapsed) * 100) : 0;

    return {
        total: cards.length,
        stabilized: stabilized.length,
        fragile: fragile.length,
        pending: pending.length,
        completedToday: completedToday.length,
        avgRisk: Math.round(avgRisk),
        activeDaysTotal: uniqueDays.size,
        presenceRate
    };
  }, [cards, engine]);

  // --- GRÁFICO DE TENDÊNCIA (Últimos 7 dias de Histórico) ---
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dStr = d.toDateString();
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });

        // Média de risco registrada nos logs daquele dia
        const logsDoDia = cards.flatMap(c => c.metrics.history)
            .filter(l => new Date(l.timestamp).toDateString() === dStr);
        
        const avgRiskDay = logsDoDia.length > 0 
            ? logsDoDia.reduce((acc, l) => acc + (l.calculatedRisk || 0), 0) / logsDoDia.length
            : 0;

        data.push({ 
            day: label, 
            risco: Math.round(avgRiskDay * 100) || (i === 0 ? stats.avgRisk : 0) 
        });
    }
    return data;
  }, [cards, stats.avgRisk]);

  // --- PREVISÃO DE CARGA (Próximos 7 dias) ---
  const forecastData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
        const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
        const label = i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' });

        const cardsDue = cards.filter(c => 
            !c.isSuspended && 
            c.nextReview && 
            c.nextReview >= dayStart && 
            c.nextReview <= dayEnd
        ).length;

        data.push({ day: label, count: cardsDue });
    }
    return data;
  }, [cards]);

  // --- HEATMAP (365 dias Reais) ---
  const heatmapData = useMemo(() => {
    const days = 365;
    const activityMap: Record<string, number> = {};
    
    // Preenche mapa com histórico real
    cards.flatMap(c => c.metrics.history).forEach(log => {
        const dateKey = new Date(log.timestamp).toDateString();
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });

    return Array.from({ length: days }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const count = activityMap[d.toDateString()] || 0;
        
        let intensity = 0;
        if (count > 0) intensity = 1;
        if (count > 15) intensity = 2;
        if (count > 40) intensity = 3;
        
        return { intensity, count, date: d.toLocaleDateString() };
    });
  }, [cards]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0e27] p-8 animate-[fadeIn_0.4s_ease]">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* HEADER & OVERVIEW */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Resultados</h1>
                <p className="text-sm text-gray-500 max-w-md">Reflexão baseada no seu histórico real de aprendizado.</p>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-blue-400">{100 - stats.avgRisk}%</div>
                    <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-1">Saúde da Memória</div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-gray-200">{stats.stabilized}</div>
                    <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-1">Cards Consolidados</div>
                </div>
            </div>
        </div>

        {/* GRID DE MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title="Sessão de Hoje" 
                metrics={[
                    { label: 'Cards Vistos', value: stats.completedToday, color: 'text-blue-400' },
                    { label: 'Ainda Pendentes', value: stats.pending, color: 'text-gray-400' }
                ]}
                footer="Volume de revisões realizadas nas últimas 24h."
            />
            <StatCard 
                title="Estado da Memória" 
                metrics={[
                    { label: 'Estabilizados', value: stats.stabilized, color: 'text-emerald-400' },
                    { label: 'Frágeis / Novos', value: stats.fragile, color: 'text-orange-400' }
                ]}
                footer="Cards com estabilidade > 21 dias são considerados seguros."
            />
            <StatCard 
                title="Consistência" 
                metrics={[
                    { label: 'Dias Ativos', value: stats.activeDaysTotal, color: 'text-purple-400' },
                    { label: 'Ritmo Mensal', value: `${stats.presenceRate}%`, color: 'text-gray-200' }
                ]}
                footer="Frequência de contato com a plataforma este mês."
            />
        </div>

        {/* GRÁFICOS REAIS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tendência de Risco */}
            <div className="bg-[#14182d] border border-white/5 rounded-[32px] p-8 shadow-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Tendência de Risco (7d)
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                cursor={{stroke: '#3b82f6', strokeWidth: 1}}
                                contentStyle={{backgroundColor: '#0f1223', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px'}}
                                itemStyle={{color: '#60a5fa'}}
                            />
                            <Area type="monotone" dataKey="risco" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Carga de Trabalho Real */}
            <div className="bg-[#14182d] border border-white/5 rounded-[32px] p-8 shadow-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Próximas Revisões (Projeção)
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                contentStyle={{backgroundColor: '#0f1223', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px'}}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                {forecastData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#1e293b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* HEATMAP REAL */}
        <div className="bg-[#14182d] border border-white/5 rounded-[32px] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Mapa de Consistência (365d)</h3>
                <div className="text-[10px] text-gray-600 font-mono">Total: {stats.activeDaysTotal} dias de estudo</div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                {heatmapData.map((day, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-3 rounded-sm transition-all hover:scale-150 cursor-help ${
                            day.intensity === 0 ? 'bg-[#0a0e27]' :
                            day.intensity === 1 ? 'bg-blue-900/40' :
                            day.intensity === 2 ? 'bg-blue-600/60' :
                            'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.3)]'
                        }`}
                        title={`${day.date}: ${day.count} revisões`}
                    />
                ))}
            </div>
            <div className="flex justify-between items-center mt-8">
                <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase font-bold">
                    <span>Inativo</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#0a0e27]"></div>
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-900/40"></div>
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-600/60"></div>
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div>
                    </div>
                    <span>Intenso</span>
                </div>
                <div className="text-[9px] text-gray-600 italic">Cada quadrado representa um dia de esforço cognitivo.</div>
            </div>
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  );
};

const StatCard = ({ title, metrics, footer }: { title: string, metrics: {label: string, value: any, color: string}[], footer: string }) => (
    <div className="bg-[#14182d] border border-white/5 rounded-[32px] p-6 shadow-lg group hover:border-blue-500/20 transition-all">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">{title}</h4>
        <div className="space-y-4 mb-6">
            {metrics.map((m, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/[0.03] pb-2">
                    <span className="text-xs text-gray-400">{m.label}</span>
                    <span className={`text-xl font-mono font-bold ${m.color}`}>{m.value}</span>
                </div>
            ))}
        </div>
        <p className="text-[9px] text-gray-600 leading-relaxed italic">{footer}</p>
    </div>
);

export default StatisticsView;
