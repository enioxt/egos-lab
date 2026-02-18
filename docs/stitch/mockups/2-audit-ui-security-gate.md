# UI Mockup: 2. Audit UI (Security Gate)

> Generated: 2026-02-18T13:47:15.973Z
> Agent: ui_designer | Correlation: 8b5668a1-ee2e-423d-afae-e0ebe0899f09

---

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGithub, FaShieldAlt, FaDatabase, FaSitemap } from 'react-icons/fa';
import { FiScanner } from 'react-icons/fi';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'] });

const terminalLines = [
    '[init] Cloning repository...',
    '[security] Scanning for secrets...',
    '[ssot] Checking single source of truth...',
    '[architecture] Analyzing project structure...',
    '[build] Running static analysis...',
    '[report] Generating security scorecard...',
];

const AuditScanner = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState(null);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const terminalRef = useRef(null);

    const handleInputChange = (e) => {
        setRepoUrl(e.target.value);
    };

    const handleRunAudit = async () => {
        setIsAuditing(true);
        setTerminalOutput([]);
        setCurrentLineIndex(0);

        const simulateAudit = async () => {
            for (let i = 0; i < terminalLines.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 750));
                setTerminalOutput(prev => [...prev, terminalLines[i]]);
                if (terminalRef.current) {
                    terminalRef.current.scrollTop = terminalRef.current.scrollHeight; // Auto-scroll terminal
                }
            }

            // Simulate audit result loading after terminal finishes
            await new Promise(resolve => setTimeout(resolve, 500));
            setAuditResults({
                grade: 'B',
                security: { critical: 0, warnings: 2 },
                ssotCompliance: 85,
                architecture: 'Monorepo detected',
                findings: [
                    { id: 1, severity: 'P0', category: 'Security', description: 'Potential API key leak in .env file.', fixable: true },
                    { id: 2, severity: 'P1', category: 'Type Duplication', description: 'Duplicate type definitions found across multiple files.', fixable: false },
                ],
            });
            setIsAuditing(false);
        };

        // Start the simulation
        simulateAudit();
    };

    useEffect(() => {
        if (terminalRef.current && terminalOutput.length) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalOutput]);


    const gradeColor = {
        'A': 'text-emerald-500',
        'B': 'text-yellow-500',
        'C': 'text-orange-500',
        'F': 'text-rose-600',
    }

    return (
        <div className={`bg-slate-950 min-h-screen text-white flex flex-col items-center justify-start ${inter.className} p-8`}>

            {/* Hero Input Section */}
            <section className="w-full max-w-3xl text-center mb-8 mt-16">
                <h1 className="text-3xl font-bold mb-4">Automated Security & SSOT Audit</h1>
                <div className="relative">
                    <input
                        type="url"
                        placeholder="https://github.com/username/project"
                        value={repoUrl}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${inter.className}`}
                    />
                    <button
                        onClick={handleRunAudit}
                        disabled={isAuditing}
                        className={`absolute top-1/2 right-4 -translate-y-1/2 px-6 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed ${inter.className}`}
                    >
                        <FiScanner className="inline-block mr-2" /> Run Audit
                    </button>
                </div>
                <p className="text-slate-500 mt-2 text-sm">Public repositories only for now. No write access required.</p>
            </section>

            {/* Live Terminal */}
            <AnimatePresence>
                {isAuditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full max-w-3xl mb-8"
                    >
                        <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg ${jetBrainsMono.className}`}>
                            <div className="bg-slate-800 p-3 text-sm text-slate-400">Terminal</div>
                            <div ref={terminalRef} className="p-4 h-64 overflow-y-auto text-sm text-green-400">
                                {terminalOutput.map((line, index) => (
                                    <div key={index}>
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scorecard */}
            <AnimatePresence>
                {auditResults && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full max-w-3xl"
                    >
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            {/* Overall Grade */}
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className={`absolute inset-0 rounded-full border-8 z-0 ${gradeColor[auditResults.grade]}`}
                                    />
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.7 }}
                                        className={`text-6xl font-bold z-10 relative ${gradeColor[auditResults.grade]}`}
                                    >
                                        {auditResults.grade}
                                    </motion.span>
                                </div>
                            </div>

                            {/* Metric Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="flex items-center bg-slate-800 rounded-xl p-3">
                                    <FaShieldAlt className="mr-2 text-xl text-amber-500" />
                                    <span>Security: {auditResults.security.critical} Critical, {auditResults.security.warnings} Warnings</span>
                                </div>
                                <div className="flex items-center bg-slate-800 rounded-xl p-3">
                                    <FaDatabase className="mr-2 text-xl text-emerald-500" />
                                    <span>SSOT Compliance: {auditResults.ssotCompliance}% - Excellent</span>
                                </div>
                                <div className="flex items-center bg-slate-800 rounded-xl p-3">
                                    <FaSitemap className="mr-2 text-xl text-cyan-500" />
                                    <span>Architecture: {auditResults.architecture}</span>
                                </div>
                            </div>

                            {/* Findings List */}
                            <div>
                                <h2 className="text-xl font-semibold mb-3">Findings</h2>
                                {auditResults.findings.map(finding => (
                                    <div key={finding.id} className="mb-2 border-b border-slate-700 pb-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="bg-rose-700 text-white text-xs px-2 py-1 rounded-md mr-2">[P{finding.severity.slice(1)}]</span>
                                                <span className="bg-purple-700 text-white text-xs px-2 py-1 rounded-md mr-2">[{finding.category}]</span>
                                                {finding.description}
                                            </div>
                                            {finding.fixable && (
                                                <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
                                                    Fix
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditScanner;
```