import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, IndianRupee, PieChart, TrendingUp, Calendar, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';

export const EMICalculatorTool: React.FC = () => {
    const { setActiveTool } = useAppStore();

    // Inputs
    const [principal, setPrincipal] = useState<number>(500000);
    const [interestRate, setInterestRate] = useState<number>(8.5);
    const [tenure, setTenure] = useState<number>(5); // years
    const [tenureType, setTenureType] = useState<'years' | 'months'>('years');

    // Results
    const [emi, setEmi] = useState<number>(0);
    const [totalInterest, setTotalInterest] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    useEffect(() => {
        calculateEMI();
    }, [principal, interestRate, tenure, tenureType]);

    const calculateEMI = () => {
        const p = principal;
        const r = interestRate / 12 / 100;
        const n = tenureType === 'years' ? tenure * 12 : tenure;

        if (r === 0) {
            setEmi(p / n);
            setTotalInterest(0);
            setTotalAmount(p);
            return;
        }

        const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalAmt = emiValue * n;
        const totalInt = totalAmt - p;

        setEmi(emiValue);
        setTotalInterest(totalInt);
        setTotalAmount(totalAmt);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const interestPercentage = (totalInterest / totalAmount) * 100;
    const principalPercentage = 100 - interestPercentage;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', sans-serif"
        }}>
            <header style={{
                background: 'white',
                padding: '1rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <button
                    onClick={() => setActiveTool('landing')}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#f59e0b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Calculator size={18} />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>EMI Calculator</h1>
                </div>
            </header>

            <main style={{
                flex: 1,
                padding: '3rem 2rem',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{
                    maxWidth: '1000px',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr',
                    gap: '2.5rem'
                }}>
                    {/* Input Section */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1.5rem',
                        padding: '2.5rem',
                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            Loan Details
                        </h2>

                        {/* Principal */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>Principal Amount</label>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <IndianRupee size={16} color="#64748b" />
                                    <input
                                        type="number"
                                        value={principal}
                                        onChange={(e) => setPrincipal(Number(e.target.value))}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100px', fontSize: '1rem', fontWeight: 700 }}
                                    />
                                </div>
                            </div>
                            <input
                                type="range"
                                min="10000"
                                max="10000000"
                                step="10000"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    background: '#e2e8f0',
                                    borderRadius: '10px',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    accentColor: '#f59e0b'
                                }}
                            />
                        </div>

                        {/* Interest Rate */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>Interest Rate (p.a)</label>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <input
                                        type="number"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '40px', fontSize: '1rem', fontWeight: 700 }}
                                    />%
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    background: '#e2e8f0',
                                    borderRadius: '10px',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    accentColor: '#f59e0b'
                                }}
                            />
                        </div>

                        {/* Tenure */}
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <label style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem' }}>Loan Tenure</label>
                                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                                        <button
                                            onClick={() => setTenureType('years')}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                borderRadius: '4px',
                                                border: 'none',
                                                background: tenureType === 'years' ? 'white' : 'transparent',
                                                color: tenureType === 'years' ? '#0f172a' : '#64748b',
                                                cursor: 'pointer',
                                                boxShadow: tenureType === 'years' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Yrs</button>
                                        <button
                                            onClick={() => setTenureType('months')}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                borderRadius: '4px',
                                                border: 'none',
                                                background: tenureType === 'months' ? 'white' : 'transparent',
                                                color: tenureType === 'months' ? '#0f172a' : '#64748b',
                                                cursor: 'pointer',
                                                boxShadow: tenureType === 'months' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                        >Mo</button>
                                    </div>
                                </div>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <input
                                        type="number"
                                        value={tenure}
                                        onChange={(e) => setTenure(Number(e.target.value))}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '30px', fontSize: '1rem', fontWeight: 700 }}
                                    />
                                    <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: '0.25rem' }}>{tenureType === 'years' ? 'Years' : 'Months'}</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max={tenureType === 'years' ? 30 : 360}
                                step="1"
                                value={tenure}
                                onChange={(e) => setTenure(Number(e.target.value))}
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    background: '#e2e8f0',
                                    borderRadius: '10px',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    accentColor: '#f59e0b'
                                }}
                            />
                        </div>
                    </div>

                    {/* Result Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                                borderRadius: '1.5rem',
                                padding: '2.5rem',
                                color: 'white',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Monthly EMI
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>
                                    {formatCurrency(emi)}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total Interest</div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(totalInterest)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>Total Amount</div>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{formatCurrency(totalAmount)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '150px',
                                height: '150px',
                                background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0) 70%)',
                                borderRadius: '50%'
                            }} />
                        </motion.div>

                        <div style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '2rem' }}>
                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                    {/* Principal Circle */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#f1f5f9"
                                        strokeWidth="4"
                                    />
                                    {/* Principal Segment */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#10b981"
                                        strokeWidth="4"
                                        strokeDasharray={`${principalPercentage} ${interestPercentage}`}
                                        strokeDashoffset="0"
                                        style={{ transition: 'stroke-dasharray 0.3s ease' }}
                                    />
                                    {/* Interest Segment */}
                                    <circle
                                        cx="18" cy="18" r="15.915"
                                        fill="transparent"
                                        stroke="#f59e0b"
                                        strokeWidth="4"
                                        strokeDasharray={`${interestPercentage} ${principalPercentage}`}
                                        strokeDashoffset={-principalPercentage}
                                        style={{ transition: 'stroke-dasharray 0.3s ease' }}
                                    />
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <PieChart size={24} color="#64748b" style={{ marginBottom: '4px' }} />
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>Split Analysis</div>
                                </div>
                            </div>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Principal</span>
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{principalPercentage.toFixed(1)}%</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b' }} />
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Interest</span>
                                    </div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{interestPercentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} />
                        <span>Instant Results</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} />
                        <span>Yearly/Monthly Modes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={16} />
                        <span>Accurate Compounding</span>
                    </div>
                </div>
                <p>© 2026 Utility Suite • Private & Local</p>
            </footer>
        </div>
    );
};
