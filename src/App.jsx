import React, { useState, useEffect } from 'react';
import {
  Calculator, TrendingUp, Calendar, RefreshCw,
  ArrowDownCircle, Wallet, Activity, Award, Sparkles, Zap
} from 'lucide-react';

// --- Animated Number Component with Glow Effect ---
const CountUp = ({ value, prefix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    let end = value;
    if (start === end) return;

    let duration = 900;
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
    <span className={`number-display ${className}`}>
      {prefix}{new Intl.NumberFormat('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(displayValue)}
    </span>
  );
};

// --- Floating Particles Component ---
const FloatingParticles = () => {
  return (
    <div className="particles">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            background: i % 3 === 0
              ? 'rgba(139, 92, 246, 0.4)'
              : i % 3 === 1
                ? 'rgba(99, 102, 241, 0.3)'
                : 'rgba(59, 130, 246, 0.3)'
          }}
        />
      ))}
    </div>
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
  const [hoveredYear, setHoveredYear] = useState(null);

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

  // Input fields configuration
  const inputFields = [
    { label: "Initial Savings", icon: "RM", val: initialAmount, set: setInitialAmount, placeholder: "1000", color: "indigo", sub: "Starting Amount", gradient: "from-indigo-500 to-purple-600" },
    { label: "Annual Dividend (%)", icon: <TrendingUp className="w-5 h-5" />, val: dividendRate, set: setDividendRate, step: "0.1", placeholder: "6.0", color: "blue", gradient: "from-blue-500 to-cyan-500" },
    { label: "Monthly Contribution", icon: <Wallet className="w-5 h-5" />, val: monthlyContribution, set: setMonthlyContribution, placeholder: "0", color: "emerald", gradient: "from-emerald-500 to-teal-500" }
  ];

  return (
    <div className="pb-16 overflow-x-hidden min-h-screen bg-animated font-sans selection:bg-violet-500/30">
      <FloatingParticles />

      {/* Header */}
      <header className={`relative z-10 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/90 via-indigo-900/90 to-purple-900/90 backdrop-blur-sm shadow-2xl shadow-indigo-950/50 transform -skew-y-2 origin-top-left h-56 sm:h-64">
          <div className="absolute inset-0 header-pattern opacity-30"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
            <div className="flex items-center space-x-5">
              <div className="relative p-4 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 rounded-2xl backdrop-blur-xl shadow-2xl border border-white/10 animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-2xl opacity-20 blur-lg"></div>
                <Calculator className="relative w-10 h-10 text-yellow-300 drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
                  <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                    EPF Simulator
                  </span>
                </h1>
                <div className="flex items-center mt-2 space-x-3">
                  <span className="h-1 w-8 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"></span>
                  <p className="text-violet-200/80 text-sm font-medium tracking-wide uppercase">Premium Financial Projection</p>
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Inflation Toggle */}
              <div className="flex items-center bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                <span className={`text-xs font-bold mr-4 transition-colors duration-300 ${inflationAdjusted ? 'text-yellow-300' : 'text-white/50'}`}>
                  Inflation Mode (2.5%)
                </span>
                <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                  <input
                    type="checkbox"
                    name="toggle"
                    id="toggle"
                    checked={inflationAdjusted}
                    onChange={() => setInflationAdjusted(!inflationAdjusted)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 right-6 shadow-lg"
                  />
                  <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-all duration-500 ${inflationAdjusted ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-slate-600'}`}></label>
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-2 text-sm bg-gradient-to-r from-emerald-500/10 to-green-500/10 px-5 py-2.5 rounded-full border border-emerald-500/30 backdrop-blur-sm shadow-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                </span>
                <span className="text-emerald-300 font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-4 -mt-10 sm:-mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT COLUMN --- */}
        <div className={`lg:col-span-4 space-y-6 opacity-0 ${loaded ? 'animate-slide-up stagger-1' : ''}`}>

          {/* Input Card */}
          <div className="glass-panel rounded-3xl overflow-hidden card-3d">
            <div className="bg-gradient-to-r from-slate-900/80 to-indigo-950/80 px-8 py-5 border-b border-white/5 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center text-lg">
                <button
                  onClick={handleReset}
                  className="group focus:outline-none flex items-center"
                  title="Reset all inputs to 0"
                >
                  <RefreshCw className={`w-5 h-5 mr-3 text-violet-400 transition-all duration-700 ease-in-out ${isResetting ? 'rotate-180 text-fuchsia-400' : 'group-hover:rotate-45 group-hover:text-violet-300'}`} />
                </button>
                Parameters
              </h2>
              <Zap className="w-5 h-5 text-yellow-400/60" />
            </div>

            <div className="p-8 space-y-7">
              {inputFields.map((field, i) => (
                <div key={i} className="group">
                  <label className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 group-focus-within:text-violet-400 transition-colors">
                    <span>{field.label}</span>
                    {field.sub && <span className="text-slate-500 font-normal normal-case">{field.sub}</span>}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-${field.color}-400 font-bold`}>
                      {typeof field.icon === 'string' ? (
                        <span className={`text-lg bg-gradient-to-r ${field.gradient} bg-clip-text text-transparent font-bold`}>{field.icon}</span>
                      ) : (
                        field.icon
                      )}
                    </div>
                    <input
                      type="number"
                      value={field.val}
                      onChange={(e) => field.set(Number(e.target.value))}
                      step={field.step || "1"}
                      className="input-premium"
                      placeholder={field.placeholder}
                    />
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${field.gradient} opacity-0 group-focus-within:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
                  </div>
                </div>
              ))}

              {/* Withdrawal Input */}
              <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-red-950/30 to-rose-950/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                <label className="flex justify-between text-xs font-bold text-red-400 uppercase tracking-wider mb-3 group-focus-within:text-red-300 transition-colors">
                  <span>Yearly Withdrawal (%)</span>
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-500/30">Optional</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <ArrowDownCircle className="w-5 h-5 text-red-400 group-focus-within:text-red-300" />
                  </div>
                  <input
                    type="number"
                    value={withdrawalRate}
                    onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                    step="0.5"
                    className="input-premium border-red-500/30 focus:border-red-500/60 text-red-300"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 group-focus-within:text-violet-400 transition-colors">
                  Duration (Years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Calendar className="w-5 h-5 text-indigo-400 group-focus-within:text-violet-300" />
                  </div>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="input-premium"
                    placeholder="50"
                  />
                </div>
                <div className="mt-4 px-1">
                  <input
                    type="range" min="1" max="80" value={years} onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>1 yr</span>
                    <span className="text-violet-400 font-bold">{years} years</span>
                    <span>80 yrs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-violet-950/50 group card-3d">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700"></div>
            <div className="absolute inset-0 summary-pattern opacity-20"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>

            <div className="relative p-8 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-violet-200 uppercase tracking-widest">
                  {inflationAdjusted ? 'Real Value Projection' : 'Final Projection'}
                </h2>
                <Activity className="w-5 h-5 text-violet-300/60" />
              </div>
              <p className="text-violet-100/50 text-xs mb-6">After {years} years</p>

              <div className="mb-8">
                <p className="text-violet-100 text-sm mb-2 opacity-80">Maturity Amount</p>
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
                  <CountUp value={summary.finalAmount} prefix="RM" className="bg-gradient-to-r from-white via-violet-100 to-white bg-clip-text" />
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center hover:bg-white/5 p-3 rounded-xl transition-colors">
                  <span className="text-violet-100 text-sm flex items-center">
                    <span className="w-2 h-2 rounded-full bg-violet-400 mr-3"></span>
                    Total Principal
                  </span>
                  <span className="text-lg font-bold"><CountUp value={summary.totalInvested} prefix="RM" /></span>
                </div>
                <div className="flex justify-between items-center hover:bg-white/5 p-3 rounded-xl transition-colors">
                  <span className="text-violet-100 text-sm flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></span>
                    Total Interest
                  </span>
                  <span className="text-lg font-bold text-emerald-300">+<CountUp value={summary.totalInterest} prefix="RM" /></span>
                </div>
                {summary.totalWithdrawn > 0 && (
                  <div className="flex justify-between items-center bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                    <span className="text-red-100 text-sm flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-400 mr-3"></span>
                      Total Withdrawn
                    </span>
                    <span className="text-lg font-bold text-red-200">-<CountUp value={summary.totalWithdrawn} prefix="RM" /></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Millionaire Badge */}
          {summary.millionaireYear && (
            <div
              className="animate-scale-in relative overflow-hidden bg-gradient-to-r from-amber-900/40 via-yellow-900/40 to-orange-900/40 border border-yellow-500/30 p-6 rounded-3xl shadow-2xl shadow-yellow-900/30 flex items-center space-x-4 card-3d millionaire-glow"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
              <div className="relative p-3 bg-gradient-to-br from-yellow-400 to-amber-500 text-white rounded-2xl shadow-lg shadow-yellow-500/50">
                <Award className="w-8 h-8" />
              </div>
              <div className="relative">
                <h3 className="font-bold text-yellow-300 text-lg flex items-center">
                  Millionaire Milestone!
                  <Sparkles className="w-4 h-4 ml-2 text-yellow-400 animate-pulse" />
                </h3>
                <p className="text-yellow-200/80 text-sm leading-tight">
                  You'll hit <strong className="text-yellow-300">RM 1 Million</strong> in <span className="font-extrabold text-amber-400">Year {summary.millionaireYear}</span>
                </p>
              </div>
            </div>
          )}

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className={`lg:col-span-8 space-y-6 opacity-0 ${loaded ? 'animate-slide-up stagger-2' : ''}`}>

          {/* Chart Section */}
          <div className="glass-panel p-8 rounded-3xl card-3d">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  Growth Projection
                  <TrendingUp className="w-6 h-6 ml-3 text-emerald-400" />
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {inflationAdjusted ? 'Adjusted for 2.5% Annual Inflation' : 'Nominal Value Growth'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-bold">
                <div className="flex items-center bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-300">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 mr-2 shadow-lg shadow-indigo-500/50"></span>
                  Balance
                </div>
                <div className="flex items-center bg-slate-500/10 px-4 py-2 rounded-xl border border-slate-500/30 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-500/50 mr-2"></span>
                  Principal
                </div>
              </div>
            </div>

            <div className="flex items-stretch h-[360px] pb-8">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[10px] sm:text-xs text-slate-500 font-semibold pr-3 text-right w-16 sm:w-24 select-none py-1">
                <span>{formatSimple(graphMaxVal)}</span>
                <span>{formatSimple(graphMaxVal * 0.75)}</span>
                <span>{formatSimple(graphMaxVal * 0.5)}</span>
                <span>{formatSimple(graphMaxVal * 0.25)}</span>
                <span className="text-slate-600">RM 0</span>
              </div>

              {/* Graph Container */}
              <div className="flex-1 relative group cursor-crosshair">
                <div className="absolute inset-0 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
                  {/* Grid lines */}
                  <div className="absolute inset-0">
                    {[0.25, 0.5, 0.75].map((pos) => (
                      <div key={pos} className="absolute w-full border-t border-slate-700/30" style={{ top: `${pos * 100}%` }}></div>
                    ))}
                  </div>

                  {results.length > 0 && (
                    <svg className="w-full h-full chart-glow" preserveAspectRatio="none" viewBox={`0 0 ${results.length} 100`}>
                      <defs>
                        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
                          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#818CF8" />
                          <stop offset="50%" stopColor="#A78BFA" />
                          <stop offset="100%" stopColor="#C084FC" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
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
                        fill="rgba(100, 116, 139, 0.15)"
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
                        M 0 ${100 - (results[0]?.closingBalance / graphMaxVal * 100 || 100)}
                        ${results.map((r, i) => {
                          const y = 100 - (r.closingBalance / graphMaxVal * 100);
                          return `L ${i} ${y}`;
                        }).join(' ')}
                        `}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="transition-all duration-700 ease-in-out"
                      />

                      {/* Data points on hover */}
                      {results.map((r, i) => {
                        const y = 100 - (r.closingBalance / graphMaxVal * 100);
                        return (
                          <circle
                            key={i}
                            cx={i}
                            cy={y}
                            r="0.8"
                            fill="#A78BFA"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>

                {/* X-Axis Labels */}
                <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] sm:text-xs font-semibold text-slate-500 select-none px-1">
                  <span>Year 1</span>
                  <span>Year {Math.round(years / 2)}</span>
                  <span>Year {years}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-[600px] card-3d">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-slate-900/80 to-indigo-950/80 backdrop-blur-xl sticky top-0 z-20">
              <h3 className="font-bold text-white text-lg flex items-center">
                Detailed Breakdown
                <Activity className="w-5 h-5 ml-3 text-violet-400" />
              </h3>
              <span className="text-xs font-bold bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 py-2 px-5 rounded-full border border-violet-500/30 shadow-lg shadow-violet-500/10">
                {years} Years
              </span>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse table-premium">
                <thead className="text-xs text-slate-400 uppercase bg-gradient-to-r from-slate-900/95 to-indigo-950/95 sticky top-0 z-10 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-5 font-bold tracking-wider">Year</th>
                    <th className="px-6 py-5 font-bold tracking-wider">Opening</th>
                    <th className="px-6 py-5 font-bold tracking-wider text-right">Added</th>
                    <th className="px-6 py-5 font-bold tracking-wider text-right text-emerald-500">Dividend</th>
                    {withdrawalRate > 0 && <th className="px-6 py-5 font-bold tracking-wider text-right text-red-400">Withdrawn</th>}
                    <th className="px-6 py-5 font-bold tracking-wider text-right text-violet-400">
                      {inflationAdjusted ? 'Real Value' : 'Closing'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {results.map((item, index) => (
                    <tr
                      key={item.year}
                      className={`transition-all duration-200 group ${item.year === summary.millionaireYear
                          ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 hover:from-yellow-500/20 hover:to-amber-500/10'
                          : 'hover:bg-violet-500/5'
                        }`}
                      onMouseEnter={() => setHoveredYear(item.year)}
                      onMouseLeave={() => setHoveredYear(null)}
                    >
                      <td className="px-6 py-4 font-bold text-slate-500 group-hover:text-violet-400 transition-colors">
                        <span className="flex items-center">
                          #{item.year}
                          {item.year === summary.millionaireYear && (
                            <span className="ml-2 text-[10px] bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1 rounded-full font-bold shadow-lg shadow-yellow-500/30">
                              🎉 1M!
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{formatSimple(item.openingBalance)}</td>
                      <td className="px-6 py-4 text-right text-slate-500 group-hover:text-slate-300">
                        {item.contribution > 0 ? `+${formatSimple(item.contribution)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-block px-3 py-1 rounded-lg text-emerald-400 font-bold bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-all">
                          +{formatSimple(item.interest)}
                        </span>
                      </td>
                      {withdrawalRate > 0 && (
                        <td className="px-6 py-4 text-right text-red-400 font-medium">
                          {item.withdrawal > 0 ? `-${formatSimple(item.withdrawal)}` : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right font-extrabold text-slate-200 group-hover:text-white transition-colors text-base">
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

      {/* Footer */}
      <footer className="relative z-10 mt-16 text-center text-slate-500 text-sm">
        <p className="flex items-center justify-center gap-2">
          Built with <span className="text-red-400">♥</span> for financial freedom
          <Sparkles className="w-4 h-4 text-violet-400" />
        </p>
      </footer>
    </div>
  );
}