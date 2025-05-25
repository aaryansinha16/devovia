
import React from 'react';
import FeatureCard from './feature-card';
import AnimatedElement from '../animated-element';

export interface Feature {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
}

export interface NavLink {
    href: string;
    label: string;
}


export const CodeBracketSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
    </svg>
);

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-3.75 2.25M12 13.5l-3.75 2.25L12 18l3.75-2.25-3.75-2.25Zm-3.75 2.25 3.75 2.25m0 0 3.75-2.25m5.625-3 4.179-2.25-4.179-2.25m0 4.5 3.75 2.25 4.179-2.25-4.179-2.25m0 0L21.75 7.5 12 2.25l-9.75 5.25 3.75 2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
);

export const WrenchScrewdriverIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83M11.42 15.17l.75-.75a3.75 3.75 0 0 0-5.303-5.303l-.75.75M11.42 15.17L5.83 21M12.75 3h3.75M21 12.75V9A2.25 2.25 0 0 0 18.75 6.75h-3.75M16.5 3.75h.008v.008H16.5V3.75Z" />
    </svg>
);

export const CommandLineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5 3 12m0 0 3.75 4.5M3 12h18" />
    </svg>
);

export const FEATURES_DATA: Feature[] = [
    {
        icon: CodeBracketSquareIcon,
        title: "Smart Snippet Library",
        description: "Instantly save, search, and share reusable code snippets. Tag, categorize, and collaborate with ease.",
    },
    {
        icon: RectangleStackIcon,
        title: "Rapid Project Templating",
        description: "Kickstart projects in seconds with pre-configured templates for various frameworks and languages.",
    },
    {
        icon: WrenchScrewdriverIcon,
        title: "Intuitive CI/CD Builders",
        description: "Visually construct and manage your CI/CD pipelines without the YAML headache.",
    },
    {
        icon: CommandLineIcon,
        title: "Curated Developer Toolkit",
        description: "Access a growing collection of essential utilities, linters, formatters, and converters directly.",
    },
];

const FeaturesSection: React.FC = () => {
    return (
        <section
            id="features" // This ID is used for navigation
            className="py-16 md:py-24 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden z-2 features-section"
        >
            {/* Background Shapes for Features Section */}
            {/* <CircleGrid
        className="w-48 h-48 md:w-64 md:h-64 text-sky-500 dark:text-sky-800 top-[5%] right-[5%] transform rotate-12 animate-float-subtle opacity-40 dark:opacity-30 features-bg-shape features-bg-shape-circlegrid"
        style={{ animationDuration: '18s' }}
        animationDelay="200ms"
      />
       <GeometricGrid
        className="hidden md:block w-40 h-40 md:w-56 md:h-56 text-indigo-500 dark:text-indigo-800 bottom-[10%] left-[8%] transform -rotate-15 animate-float-subtle opacity-30 dark:opacity-20 features-bg-shape features-bg-shape-geometricgrid"
        style={{ animationDuration: '22s', animationDirection: 'reverse' }}
        animationDelay="400ms"
      /> */}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 features-content-wrapper">
                <AnimatedElement
                    animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]"
                    className="text-center mb-12 md:mb-16 section-header"
                    id="features-section-header"
                >
                    <h2 id="features-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 section-title">
                        Unlock Your <span className="text-sky-500 dark:text-sky-400">Full Potential</span>
                    </h2>
                    <p id="features-subheading" className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 section-subtitle">
                        Devovia offers a suite of integrated tools designed to boost your productivity and streamline your development process.
                    </p>
                </AnimatedElement>

                <div id="features-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {FEATURES_DATA.map((feature, index) => (
                        <FeatureCard key={feature.title} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
