import React, { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    showBrand?: boolean;
}

export default function AuthLayout({ children, title, subtitle, showBrand = true }: AuthLayoutProps) {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

            {/* Left Column: Brand & Visuals */}
            <div className="hidden lg:flex flex-col justify-between bg-neutral-900 p-12 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl mix-blend-screen transform -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl mix-blend-screen transform translate-x-1/2 translate-y-1/2"></div>
                </div>

                {/* Brand */}
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-2">
                        <span className="w-8 h-8 bg-white rounded-lg block"></span>
                        Egos Lab
                    </h1>
                </div>

                {/* Testimonial / Quote */}
                <div className="relative z-10 max-w-md">
                    <blockquote className="text-xl font-medium text-white mb-4">
                        "The most powerful tool for citizen-driven tourism intelligence."
                    </blockquote>
                    <cite className="not-italic text-sm text-neutral-400 block">
                        Eagle Eye System v1.0
                    </cite>
                </div>
            </div>

            {/* Right Column: Auth Form */}
            <div className="flex flex-col justify-center items-center bg-black p-8 sm:p-12 lg:p-24 relative">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                            {title}
                        </h2>
                        <p className="text-neutral-400">
                            {subtitle}
                        </p>
                    </div>

                    {/* The actual form form the child component */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 shadow-2xl">
                        {children}
                    </div>

                    <p className="px-8 text-center text-sm text-neutral-500">
                        By clicking continue, you agree to our{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-white">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline underline-offset-4 hover:text-white">
                            Privacy Policy
                        </a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
