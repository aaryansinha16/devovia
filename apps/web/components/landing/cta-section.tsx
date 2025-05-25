
import React from 'react';
import { Button } from '@repo/ui';
import AnimatedElement from '../animated-element';

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
);

const CTASection: React.FC = () => {
    return (
        <section id="early-access" className="py-16 md:py-24 bg-sky-600/10 dark:bg-sky-700/20 cta-section">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 cta-content-wrapper">
                <AnimatedElement
                    id="cta-content-box"
                    animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]"
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 md:p-12 lg:p-16 text-center cta-inner-box"
                >
                    <h2 id="cta-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mb-4 section-title">
                        Ready to Elevate Your <span className="text-sky-500 dark:text-sky-400">Development Game</span>?
                    </h2>
                    <p id="cta-subheading" className="max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-300 mb-8 section-subtitle">
                        Sign up for early access to Devovia and be among the first to experience the future of developer productivity. Get exclusive updates and shape the platform with your feedback.
                    </p>
                    <form id="early-access-form" className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 early-access-form-wrapper" onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address" // Already has ID
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="flex-auto appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:focus:ring-sky-400 min-w-0 email-input"
                            placeholder="Enter your email"
                        />
                        <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto submit-button" id="early-access-submit-btn" rightIcon={<ArrowRightIcon className="w-5 h-5" />}>
                            Request Access
                        </Button>
                    </form>
                    <p id="cta-privacy-note" className="mt-6 text-sm text-slate-500 dark:text-slate-400 privacy-note">
                        We respect your privacy. No spam, ever.
                    </p>
                </AnimatedElement>
            </div>
        </section>
    );
};

export default CTASection;
