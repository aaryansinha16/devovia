
import React from 'react';
import { Feature } from './features-section';
import AnimatedElement from '../animated-element';

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const IconComponent = feature.icon;
  const featureId = `feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}`;

  return (
    <AnimatedElement 
      id={featureId}
      className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-xl dark:shadow-2xl hover:shadow-sky-500/20 dark:hover:shadow-sky-400/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 group feature-card-item"
      animationClassName="animate-[fadeInUp_0.6s_ease-out_forwards]"
      delay={`[animation-delay:${index * 150}ms]`}
    >
      <div className="flex items-center justify-center mb-6 w-16 h-16 rounded-full bg-sky-500/10 dark:bg-sky-400/10 group-hover:bg-sky-500/20 dark:group-hover:bg-sky-400/20 transition-colors duration-300 feature-card-icon-wrapper">
        <IconComponent className="w-8 h-8 text-sky-500 dark:text-sky-400 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors duration-300 feature-card-icon" />
      </div>
      <h3 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors duration-300 feature-card-title">
        {feature.title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed feature-card-description">
        {feature.description}
      </p>
    </AnimatedElement>
  );
};

export default FeatureCard;
