# UI Mockup: 3. Onboarding Wizard (Start Here)

> Generated: 2026-02-18T13:47:15.973Z
> Agent: ui_designer | Correlation: 8b5668a1-ee2e-423d-afae-e0ebe0899f09

---

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const jetbrains_mono = JetBrains_Mono({ subsets: ['latin'] });

const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string | null>(null);
  const [stack, setStack] = useState<string | null>(null);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
    nextStep();
  };

  const handleStackSelection = (selectedStack: string) => {
    setStack(selectedStack);
    nextStep();
  };


  const Step1 = () => (
    <motion.div
      className="flex flex-col items-center space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className={`text-2xl font-semibold text-slate-200 ${inter.className}`}>How do you want to contribute?</h2>
      <div className="flex space-x-4">
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleRoleSelection('explorer')}
        >
          🐣 Explorer: Browse Ideas
        </button>
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleRoleSelection('builder')}
        >
          🔨 Builder: Write Code
        </button>
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleRoleSelection('architect')}
        >
          🧠 Architect: Share Rules
        </button>
      </div>
    </motion.div>
  );

  const Step2 = () => (
    <motion.div
      className="flex flex-col items-center space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className={`text-2xl font-semibold text-slate-200 ${inter.className}`}>What's your weapon of choice?</h2>
      <div className="flex space-x-4">
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleStackSelection('windsurf')}
        >
          <i className="fas fa-windsurf mr-2"></i>Windsurf
        </button>
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleStackSelection('cursor')}
        >
          <i className="fas fa-mouse-pointer mr-2"></i>Cursor
        </button>
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleStackSelection('vscode')}
        >
          <i className="fas fa-code mr-2"></i>VS Code
        </button>
        <button
          className={`rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 py-4 px-6 transition-colors duration-200 ${inter.className}`}
          onClick={() => handleStackSelection('none')}
        >
          <i className="fas fa-ban mr-2"></i>None
        </button>
      </div>
    </motion.div>
  );

  const Step3 = () => (
    <motion.div
      className="flex flex-col items-center space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className={`text-2xl font-semibold text-slate-200 ${inter.className}`}>Setup</h2>
      {stack === 'windsurf' && (
        <div className="flex flex-col items-center space-y-4">
          <p className={`text-slate-400 ${inter.className}`}>Download this .windsurfrules file.</p>
          <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
            Download .windsurfrules
          </a>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">
            Magic Setup
          </button>
        </div>
      )}
      {stack === 'none' && (
        <div className="flex flex-col items-center space-y-4">
          <p className={`text-slate-400 ${inter.className}`}>Launch GitHub Codespaces (Browser).</p>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">
            Launch Codespaces
          </button>
        </div>
      )}
      {stack !== 'windsurf' && stack !== 'none' && (
        <div className="flex flex-col items-center space-y-4">
          <p className={`text-slate-400 ${inter.className}`}>Configure your {stack}.</p>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">
            Magic Setup
          </button>
        </div>
      )}
      <button onClick={nextStep} className="bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">Next: First Mission</button>

    </motion.div>
  );

  const Step4 = () => (
    <motion.div
      className="flex flex-col items-center space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className={`text-2xl font-semibold text-slate-200 ${inter.className}`}>Ready? Here is your first mission.</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 w-full max-w-md">
        <p className={`text-lg text-slate-300 ${inter.className}`}>Task #42: Fix typo in README.</p>
      </div>
      <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl transition-colors duration-200">
        Start Mission
      </button>
    </motion.div>
  );


  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-800">

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4/>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingWizard;
```