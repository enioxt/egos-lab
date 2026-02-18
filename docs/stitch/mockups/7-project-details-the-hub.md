# UI Mockup: 7. Project Details (The Hub)

> Generated: 2026-02-18T13:47:15.973Z
> Agent: ui_designer | Correlation: 8b5668a1-ee2e-423d-afae-e0ebe0899f09

---

```tsx
import React from 'react';
import {
  Sparklines,
  SparklinesLine,
  SparklinesReferenceLine,
} from 'react-sparklines';

const ProjectDetails = () => {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="p-8 border-b border-slate-800">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold">Eagle Eye</h1>
            <p className="text-slate-400">
              OSINT gazette monitor for public procurement.
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="bg-emerald-700 text-emerald-100 rounded-full px-3 py-1 text-sm font-medium">
                Live
              </span>
              <span className="bg-purple-700 text-purple-100 rounded-full px-3 py-1 text-sm font-medium">
                SaaS
              </span>
              <span className="bg-green-700 text-green-100 rounded-full px-3 py-1 text-sm font-medium">
                Security: A
              </span>
            </div>
          </div>

          <div className="space-x-4">
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-xl transition duration-200">
              Star
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-xl transition duration-200">
              Fork
            </button>
            <button className="bg-cyan-500 hover:bg-cyan-400 text-white font-medium py-2 px-6 rounded-xl transition duration-200">
              Run in Lab
            </button>
          </div>
        </div>
      </header>

      {/* Main Content + Sidebar */}
      <div className="container mx-auto grid grid-cols-12 gap-8 p-8 flex-grow">
        {/* Main Content (Left Col) */}
        <main className="col-span-9">
          {/* Tabs */}
          <div className="border-b border-slate-800">
            <nav className="flex space-x-4 -mb-px">
              <a
                href="#"
                className="py-4 px-6 border-b-2 border-cyan-500 text-cyan-500 font-medium text-lg"
              >
                Overview
              </a>
              <a
                href="#"
                className="py-4 px-6 border-b-2 border-transparent hover:border-slate-500 hover:text-slate-300 font-medium text-lg"
              >
                Runbook
              </a>
              <a
                href="#"
                className="py-4 px-6 border-b-2 border-transparent hover:border-slate-500 hover:text-slate-300 font-medium text-lg"
              >
                Keys & Costs
              </a>
              <a
                href="#"
                className="py-4 px-6 border-b-2 border-transparent hover:border-slate-500 hover:text-slate-300 font-medium text-lg"
              >
                Help
              </a>
            </nav>
          </div>

          {/* Runbook View (Example) */}
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Runbook</h2>
            <p className="text-slate-400 mb-4">
              Follow these steps to get Eagle Eye up and running. Estimated
              Setup Time: 5 min
            </p>

            <div className="bg-slate-800 rounded-xl p-4 mb-4">
              <h3 className="text-lg font-medium mb-2">1. Clone</h3>
              <pre className="bg-slate-900 rounded-xl p-3 font-mono text-sm">
                <code className="text-white">git clone git@github.com:egos-lab/eagle-eye.git</code>
              </pre>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 mb-4">
              <h3 className="text-lg font-medium mb-2">2. Env</h3>
              <pre className="bg-slate-900 rounded-xl p-3 font-mono text-sm">
                <code className="text-white">cp .env.example .env && vim .env</code>
              </pre>
            </div>
          </section>

          {/* Keys & Costs View (Example) */}
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Keys & Costs</h2>
            <p className="text-slate-400 mb-4">
              Estimated cost/month: $5
            </p>

            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-4 text-slate-400">Service</th>
                  <th className="py-2 px-4 text-slate-400">Key</th>
                  <th className="py-2 px-4 text-slate-400">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4">Supabase</td>
                  <td className="py-2 px-4">
                    <a
                      href="#"
                      className="text-cyan-500 hover:text-cyan-400"
                    >
                      Get Key
                    </a>
                  </td>
                  <td className="py-2 px-4">$2</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">OpenAI</td>
                  <td className="py-2 px-4">
                    <a
                      href="#"
                      className="text-cyan-500 hover:text-cyan-400"
                    >
                      Get Key
                    </a>
                  </td>
                  <td className="py-2 px-4">$3</td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>

        {/* Sidebar (Right Col) */}
        <aside className="col-span-3">
          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Maintainers</h2>
            <div className="flex items-center space-x-2">
              <img
                src="https://avatars.githubusercontent.com/u/8458083?v=4"
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
              <img
                src="https://avatars.githubusercontent.com/u/4378743?v=4"
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Tech Stack</h2>
            <div className="flex items-center space-x-2">
              {/* Placeholder - Replace with actual icons */}
              <span>Bun</span>
              <span>React</span>
              <span>Supabase</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Activity</h2>
            <Sparklines data={[5, 10, 5, 20, 8, 15, 10]} height={35}>
              <SparklinesLine color="#06b6d4" />
              <SparklinesReferenceLine type="mean" />
            </Sparklines>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Top Contributors</h2>
            <ul>
              <li>User 1</li>
              <li>User 2</li>
              <li>User 3</li>
              <li>User 4</li>
              <li>User 5</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Help Request Section */}
      <section className="bg-slate-800 py-8 border-t border-slate-800">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Help Wanted</h2>
            <button className="bg-purple-500 hover:bg-purple-400 text-white font-medium py-2 px-4 rounded-xl transition duration-200">
              Ask for Help
            </button>
          </div>

          {/* Help Cards - Iterate for each wanted item */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-2">Issue Title</h3>
              <p className="text-slate-400">
                Description of the issue. Needs some assistance.
              </p>
            </div>
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-2">Issue Title</h3>
              <p className="text-slate-400">
                Description of the issue. Needs some assistance.
              </p>
            </div>
            <div className="bg-slate-700 rounded-xl p-4">
              <h3 className="text-lg font-medium mb-2">Issue Title</h3>
              <p className="text-slate-400">
                Description of the issue. Needs some assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetails;
```