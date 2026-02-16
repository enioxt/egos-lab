import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Enter your credentials to access the command center."
        >
            <form className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            className="block w-full rounded-md border border-neutral-700 bg-neutral-800 py-2 pl-10 pr-3 text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="block w-full rounded-md border border-neutral-700 bg-neutral-800 py-2 pl-10 pr-3 text-white placeholder-neutral-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-all"
                >
                    Sign In
                    <ArrowRight size={16} />
                </button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-neutral-900 px-2 text-neutral-500">Or continue with</span>
                    </div>
                </div>

                {/* Social Login */}
                <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none transition-all"
                >
                    <Github size={16} />
                    Google Account
                </button>
            </form>
        </AuthLayout>
    );
}
