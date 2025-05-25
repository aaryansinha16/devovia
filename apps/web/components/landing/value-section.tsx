
import React from 'react';
import AnimatedElement from '../animated-element';

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L21 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L14.25 12l2.846.813a4.5 4.5 0 0 0 3.09 3.09L21 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09Z" />
    </svg>
  );

const valuePoints = [
  {
    id: "value-unified-experience",
    title: "Unified Experience",
    description: "Stop juggling multiple tools. Devovia brings everything you need under one roof, accessible anytime, anywhere.",
    icon: SparklesIcon, 
  },
  {
    id: "value-boost-productivity",
    title: "Boost Productivity",
    description: "Automate repetitive tasks, leverage smart suggestions, and focus on what matters most: writing great code.",
    icon: SparklesIcon,
  },
  {
    id: "value-foster-collaboration",
    title: "Foster Collaboration",
    description: "Share your best work, discover community contributions, and learn from fellow developers in a thriving ecosystem.",
    icon: SparklesIcon,
  },
  {
    id: "value-future-proof",
    title: "Future-Proof Platform",
    description: "Continuously evolving with new features and integrations to keep you ahead of the curve in the fast-paced tech world.",
    icon: SparklesIcon,
  },
];

const ValuePropositionSection: React.FC = () => {
  return (
    <section id="why-devovia" className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 value-proposition-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 value-prop-content-wrapper">
        <AnimatedElement 
            animationClassName="animate-[fadeInUp_0.8s_ease-out_forwards]" 
            className="text-center mb-12 md:mb-16 section-header"
            id="value-prop-section-header"
        >
          <h2 id="value-prop-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 section-title">
            Designed by Developers, <span className="text-indigo-500 dark:text-indigo-400">for Developers</span>
          </h2>
          <p id="value-prop-subheading" className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 section-subtitle">
            We understand the challenges. That's why Devovia is built to enhance your workflow, not complicate it.
          </p>
        </AnimatedElement>

        <div id="value-points-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {valuePoints.map((point, index) => (
            <AnimatedElement
              key={point.id}
              id={point.id}
              className="flex items-start space-x-4 p-6 bg-white/50 dark:bg-slate-800/50 rounded-lg shadow-lg hover:bg-white dark:hover:bg-slate-700/60 transition-colors duration-300 value-point-item"
              animationClassName="animate-[fadeInUp_0.6s_ease-out_forwards]"
              delay={`[animation-delay:${index * 150}ms]`}
            >
              <div className="flex-shrink-0 mt-1 p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-full value-point-icon-wrapper">
                <point.icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 value-point-icon" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1 value-point-title">{point.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 value-point-description">{point.description}</p>
              </div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
