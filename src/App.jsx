import React, { useState, useEffect } from 'react';
import { 
  Calculator, TrendingUp, Calendar, RefreshCw, 
  ArrowDownCircle, Wallet, Activity, Award 
} from 'lucide-react';

// --- Animated Number Component ---
const CountUp = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = displayValue;
    let end = value;
    if (start === end) return;

    let duration = 800;
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}{new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(displayValue)}
    </span>
  );
};

export default function App() {
  const [initialAmount, setInitialAmount] = useState(1000);
  const [dividendRate, setDividendRate] = useState(6.0);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [withdrawalRate, setWithdrawalRate] = useState(0); 
  const [years, setYears] = useState(50);
  const [inflationAdjusted, setInflationAdjusted] = useState(false); 
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ totalInvested: 0, totalInterest: 0, totalWithdrawn: 0, finalAmount: 0, millionaireYear: null });
  const [loaded, setLoaded] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // --- RESET FUNCTION ---
  const handleReset = () => {
    setIsResetting(true);
    setInitialAmount(0);
    setDividendRate(0);
    setMonthlyContribution(0);
    setWithdrawalRate(0);
    setYears(50); 
    
    setTimeout(() => setIsResetting(false), 700);
  };

  useEffect(() => {
    const calculateEPF = () => {
      let currentBalance = parseFloat(initialAmount) || 0;
      let rate = parseFloat(dividendRate) || 0;
      let monthly = parseFloat(monthlyContribution) || 0;
      let wRate = parseFloat(withdrawalRate) || 0;
      let duration = parseInt(years) || 0;
      let inflationRate = inflationAdjusted ? 0.025 : 0; 

      let yearlyData = [];
      let totalContributed = currentBalance;
      let totalWithdrawnAccumulated = 0;
      let millionaireYear = null;

      let discountFactor = 1;

      for (let year = 1; year <= duration; year++) {
        let openingBalance = currentBalance;
        
        if (openingBalance <= 0 && monthly === 0) {
          yearlyData.push({ year, openingBalance: 0, contribution: 0, interest: 0, withdrawal: 0, closingBalance: 0 });
          continue;
        }

        let annualContribution = monthly * 12;
        let interestOnOpening = openingBalance * (rate / 100);
        let interestOnContribution = annualContribution * (rate / 100) * 0.5; 
        let totalInterest = interestOnOpening + (monthly > 0 ? interestOnContribution : 0);

        let preWithdrawalBalance = openingBalance + annualContribution + totalInterest;

        let withdrawalAmount = 0;
        if (wRate > 0) {
          withdrawalAmount = preWithdrawalBalance * (wRate / 100);
        }
        if (withdrawalAmount > preWithdrawalBalance) withdrawalAmount = preWithdrawalBalance;

        let closingBalance = preWithdrawalBalance - withdrawalAmount;
        
        if (inflationAdjusted) {
          discountFactor = Math.pow(1 / (1 + inflationRate), year);
        } else {
          discountFactor = 1;
        }
        
        let displayBalance = closingBalance * discountFactor;
        
        if (displayBalance >= 1000000 && millionaireYear === null) {
          millionaireYear = year;
        }

        yearlyData.push({
          year,
          openingBalance: openingBalance * (inflationAdjusted ? Math.pow(1 / (1 + inflationRate), year - 1) : 1), 
          contribution: annualContribution,
          interest: totalInterest,
          withdrawal: withdrawalAmount,
          closingBalance: displayBalance, 
          rawBalance: closingBalance 
        });

        currentBalance = closingBalance; 
        totalContributed += annualContribution;
        totalWithdrawnAccumulated += withdrawalAmount;
      }

      setResults(yearlyData);
      setSummary({
        totalInvested: totalContributed,
        totalInterest: (currentBalance + totalWithdrawnAccumulated) - totalContributed,
        totalWithdrawn: totalWithdrawnAccumulated,
        finalAmount: currentBalance * discountFactor, 
        millionaireYear
      });
    };

    calculateEPF();
  }, [initialAmount, dividendRate, monthlyContribution, withdrawalRate, years, inflationAdjusted]);

  const formatSimple = (val) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 0 }).format(val);

  // Calculation for Graph Scaling
  const rawMax = results.length > 0 ? Math.max(summary.finalAmount, summary.totalInvested * 1.5, ...results.map(x => x.closingBalance)) : 0;
  const graphMaxVal = rawMax * 1.2;

  return (
    <div className="pb-12 overflow-x-hidden min-h-screen bg-animated font-sans text-slate-800 selection:bg-indigo-200">
      
      {/* Header */}
      <header className={`relative z-10 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-900 shadow-xl transform -skew-y-2 origin-top-left h-48 sm:h-56"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
            <div className="flex items-center space-x-5">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md shadow-2xl border border-white/20 animate-[float_6s_ease-in-out_infinite]">
                <Calculator className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  EPF Simulator
                </h1>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="h-1 w-8 bg-blue-400 rounded-full"></span>
                  <p className="text-blue-100 text-sm font-medium tracking-wide uppercase">Financial Projection Tool</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Inflation Toggle */}
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                <span className={`text-xs font-bold mr-3 ${inflationAdjusted ? 'text-yellow-300' : 'text-white/60'}`}>
                  Inflation Mode (2.5%)
                </span>
                <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={inflationAdjusted} 
                    onChange={() => setInflationAdjusted(!inflationAdjusted)}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 right-5"
                  />
                  <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 ${inflationAdjusted ? 'bg-indigo-500' : 'bg-slate-400'}`}></label>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center space-x-2 text-sm bg-white/10 px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-sm shadow-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-white font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-4 -mt-8 sm:-mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN --- */}
        <div className={`lg:col-span-4 space-y-6 opacity-0 ${loaded ? 'animate-slide-up stagger-1' : ''}`}>
          
          {/* Input Card */}
          <div className="glass-panel rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 flex items-center text-lg">
                <button 
                  onClick={handleReset} 
                  className="group focus:outline-none flex items-center"
                  title="Reset all inputs to 0"
                >
                  <RefreshCw className={`w-5 h-5 mr-3 text-indigo-600 transition-transform duration-700 ease-in-out ${isResetting ? 'rotate-180' : 'group-hover:rotate-45'}`} />
                </button>
                Parameters
              </h2>
            </div>
            
            <div className="p-8 space-y-7">
              {[
                { label: "Initial Savings", icon: "RM", val: initialAmount, set: setInitialAmount, placeholder: "1000", color: "blue", sub: "Starting Amount" },
                { label: "Est. Annual Dividend (%)", icon: <TrendingUp className="w-5 h-5" />, val: dividendRate, set: setDividendRate, step: "0.1", placeholder: "6.0", color: "blue" },
                { label: "Monthly Contribution", icon: <Wallet className="w-5 h-5" />, val: monthlyContribution, set: setMonthlyContribution, placeholder: "0", color: "emerald" }
              ].map((field, i) => (
                <div key={i} className="group">
                  <label className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                    <span>{field.label}</span>
                    {field.sub && <span className="text-slate-300 font-normal">{field.sub}</span>}
                  </label>
                  <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-${field.color}-500 font-bold`}>
                      {field.icon}
                    </div>
                    <input
                      type="number"
                      value={field.val}
                      onChange={(e) => field.set(Number(e.target.value))}
                      step={field.step || "1"}
                      className={`block w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-${field.color}-500/20 focus:border-${field.color}-500 focus:bg-white transition-all font-bold text-slate-700 text-lg shadow-inner`}
                      placeholder={field.placeholder}
                    />
                  </div>
                </div>
              ))}

              {/* Withdrawal Input */}
              <div className="group relative p-4 rounded-2xl bg-red-50/50 border border-red-100 transition-colors hover:bg-red-50">
                <label className="flex justify-between text-xs font-bold text-red-400 uppercase tracking-wider mb-2 group-focus-within:text-red-600 transition-colors">
                  <span>Yearly Withdrawal (%)</span>
                  <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded text-[10px]">Optional</span>
                </label>
                <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ArrowDownCircle className="w-5 h-5 text-red-400 group-focus-within:text-red-600" />
                  </div>
                  <input
                    type="number"
                    value={withdrawalRate}
                    onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                    step="0.5"
                    className="block w-full pl-14 pr-4 py-3.5 bg-white border border-red-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-red-700 text-lg shadow-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                  Duration (Years)
                </label>
                <div className="relative transform transition-all duration-300 group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-indigo-400 group-focus-within:text-indigo-600" />
                  </div>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="block w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 text-lg shadow-inner"
                    placeholder="50"
                  />
                </div>
                <input 
                  type="range" min="1" max="80" value={years} onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full mt-3 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/30 group transform transition-transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700"></div>
            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-[shine_1.5s_infinite]"></div>
            
            <div className="relative p-8 text-white">
              <h2 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">
                {inflationAdjusted ? 'Real Value Projection (Adj.)' : 'Final Projection (Nominal)'}
              </h2>
              <p className="text-indigo-100/60 text-[10px] mb-6">After {years} years</p>
              
              <div className="mb-8">
                <p className="text-indigo-100 text-sm mb-1 opacity-80">Maturity Amount</p>
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white drop-shadow-md">
                  <CountUp value={summary.finalAmount} prefix="RM" />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <span className="text-indigo-100 text-sm">Total Principal</span>
                  <span className="text-lg font-bold"><CountUp value={summary.totalInvested} prefix="RM" /></span>
                </div>
                <div className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <span className="text-indigo-100 text-sm">Total Interest</span>
                  <span className="text-lg font-bold text-emerald-300">+<CountUp value={summary.totalInterest} prefix="RM" /></span>
                </div>
                {summary.totalWithdrawn > 0 && (
                  <div className="flex justify-between items-center bg-red-500/20 p-2 rounded-lg border border-red-500/30">
                    <span className="text-red-100 text-sm">Total Withdrawn</span>
                    <span className="text-lg font-bold text-red-200">-<CountUp value={summary.totalWithdrawn} prefix="RM" /></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Millionaire Badge */}
          {summary.millionaireYear && (
            <div className="animate-scale-in bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 p-6 rounded-3xl shadow-xl flex items-center space-x-4 relative overflow-hidden" style={{animation: 'pulse-gold 3s infinite'}}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400 opacity-20 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <div className="p-3 bg-yellow-400 text-white rounded-full shadow-lg">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-800 text-lg">Millionaire Milestone!</h3>
                <p className="text-yellow-700 text-sm leading-tight">
                  You will hit your first <strong>RM 1 Million</strong> in <span className="font-extrabold text-amber-600">Year {summary.millionaireYear}</span>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className={`lg:col-span-8 space-y-6 opacity-0 ${loaded ? 'animate-slide-up stagger-2' : ''}`}>
          
          {/* Chart Section */}
          <div className="glass-panel p-8 rounded-3xl transition-all hover:shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Growth Projection</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {inflationAdjusted ? 'Adjusted for 2.5% Annual Inflation' : 'Nominal Value Growth'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-bold">
                <div className="flex items-center bg-blue-50/80 px-4 py-2 rounded-xl border border-blue-100 text-blue-700">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>Balance
                </div>
              </div>
            </div>
            
            <div className="flex items-stretch h-[360px] pb-6">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[10px] sm:text-xs text-slate-400 font-bold pr-3 text-right w-16 sm:w-20 select-none py-1">
                <span>{formatSimple(graphMaxVal)}</span>
                <span>{formatSimple(graphMaxVal * 0.75)}</span>
                <span>{formatSimple(graphMaxVal * 0.5)}</span>
                <span>{formatSimple(graphMaxVal * 0.25)}</span>
                <span>RM 0</span>
              </div>

              {/* Graph Container */}
              <div className="flex-1 relative group cursor-crosshair">
                <div className="absolute inset-0 overflow-hidden rounded-xl border-l border-b border-slate-200">
                  {results.length > 0 && (
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${results.length} 100`}>
                      <defs>
                        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/>
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Principal Area */}
                      <path
                        d={`
                        M 0 100
                        ${results.map((r, i) => {
                          const y = 100 - ((r.openingBalance + r.contribution) / graphMaxVal * 100);
                          return `L ${i} ${y}`;
                        }).join(' ')}
                        L ${results.length - 1} 100
                        Z
                        `}
                        fill="#F1F5F9"
                        className="transition-all duration-700 ease-in-out"
                      />

                      {/* Balance Area */}
                      <path
                        d={`
                        M 0 100
                        ${results.map((r, i) => {
                          const y = 100 - (r.closingBalance / graphMaxVal * 100);
                          return `L ${i} ${y}`;
                        }).join(' ')}
                        L ${results.length - 1} 100
                        Z
                        `}
                        fill="url(#chartFill)"
                        className="transition-all duration-700 ease-in-out"
                      />
                      
                      {/* Glow Line */}
                      <path
                        d={`
                        M 0 ${100 - (results[0].closingBalance / graphMaxVal * 100)}
                        ${results.map((r, i) => {
                          const y = 100 - (r.closingBalance / graphMaxVal * 100);
                          return `L ${i} ${y}`;
                        }).join(' ')}
                        `}
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="drop-shadow-lg transition-all duration-700 ease-in-out"
                      />
                    </svg>
                  )}
                </div>
                
                {/* X-Axis Labels */}
                <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] sm:text-xs font-bold text-slate-400 select-none px-1">
                  <span>Year 1</span>
                  <span>Year {Math.round(years/2)}</span>
                  <span>Year {years}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-lg">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-20">
              <h3 className="font-bold text-slate-700 text-lg">Detailed Breakdown</h3>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 py-2 px-5 rounded-full border border-indigo-200 shadow-sm">{years} Years</span>
            </div>
            
            <div className="overflow-auto flex-1 custom-scrollbar bg-white/30">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/90 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Year</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Opening</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Added</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right text-emerald-600">Dividend</th>
                    {withdrawalRate > 0 && <th className="px-6 py-4 font-bold tracking-wider text-right text-red-500">Withdrawn</th>}
                    <th className="px-6 py-4 font-bold tracking-wider text-right text-slate-800">
                      {inflationAdjusted ? 'Real Value' : 'Closing'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {results.map((item, index) => (
                    <tr key={item.year} className={`transition-colors duration-200 group ${item.year === summary.millionaireYear ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-indigo-50/60'}`}>
                      <td className="px-6 py-4 font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        #{item.year}
                        {item.year === summary.millionaireYear && <span className="ml-2 text-xs bg-yellow-400 text-white px-1.5 py-0.5 rounded">1M!</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{formatSimple(item.openingBalance)}</td>
                      <td className="px-6 py-4 text-right text-slate-400 group-hover:text-slate-600">
                        {item.contribution > 0 ? `+${formatSimple(item.contribution)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-block px-2 py-1 rounded-md text-emerald-600 font-bold bg-emerald-50/0 group-hover:bg-emerald-100/50 transition-all">
                          +{formatSimple(item.interest)}
                        </span>
                      </td>
                      {withdrawalRate > 0 && (
                        <td className="px-6 py-4 text-right text-red-500 font-medium">
                          {item.withdrawal > 0 ? `-${formatSimple(item.withdrawal)}` : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right font-extrabold text-slate-700 group-hover:text-indigo-700 transition-colors text-base">
                        {formatSimple(item.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}