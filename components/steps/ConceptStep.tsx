import React from 'react';
import Image from 'next/image';
import { ProjectConfig, VideoCategory, TrendingTopic } from '@/types';
import { RefreshIcon, ArrowRightIcon } from '@/components/Icons';

interface ConceptStepProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  trending: TrendingTopic[];
  researchLoading: boolean;
  onFetchTrending: () => void;
  onNext: () => void;
}

export default function ConceptStep({
  config,
  setConfig,
  trending,
  researchLoading,
  onFetchTrending,
  onNext
}: ConceptStepProps) {
  return (
    <div className="w-full">
      {/* Hero Section - Large centered hero with very generous spacing */}
      <section id="concept-hero" className="min-h-[60vh] flex items-center justify-center px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <div className="relative w-80 md:w-[32rem] h-32 md:h-48 mb-8">
            <Image 
              src="/logo.png" 
              alt="DLM Director" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <p className="text-2xl md:text-3xl text-gray-400 font-light mb-6">
            Elite Cinematic Video Generation
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            AI-powered film direction with character consistency, professional cinematography, 
            and seamless scene stitching. Create videos that look like they belong together.
          </p>
        </div>
      </section>

      {/* Project Type Section - Well spaced with separator */}
      <section className="px-8 pt-20 pb-24 border-t border-white/5 bg-white/[0.02]">
        <div id="concept-project-type" className="w-full px-4 md:px-12">
          <label className="block text-sm font-semibold uppercase tracking-widest text-gray-500 mb-12">
            Project Type
          </label>
          {/* IMPROVEMENT: Increased gap from 6 to 8 for better spacing */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {Object.values(VideoCategory).map((cat) => (
              <button
                key={cat}
                onClick={() => setConfig({ ...config, category: cat })}
                className={`px-4 py-8 rounded-2xl border text-center transition-all duration-300 group ${
                  config.category === cat 
                    ? 'border-dlm-accent bg-dlm-accent/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]' 
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:-translate-y-1'
                }`}
              >
                <span className={`text-sm font-medium block transition-colors ${
                  config.category === cat ? 'text-dlm-accent' : 'text-gray-300 group-hover:text-white'
                }`}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Market Research Section */}
      <section className="px-8 pt-20 pb-24">
        <div id="concept-market-research" className="w-full px-4 md:px-12">
          {/* IMPROVEMENT: Increased padding */}
          <div className="card-elevated p-12">
            <div className="flex justify-between items-center mb-16">
              <h2 className="text-xl font-medium text-white flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-dlm-accent shadow-[0_0_10px_#D4AF37]" />
                Market Research
              </h2>
              <button 
                onClick={onFetchTrending} 
                disabled={researchLoading}
                className="btn-ghost text-dlm-accent disabled:opacity-50 hover:bg-dlm-accent/10"
              >
                <span className={researchLoading ? 'animate-spin' : ''}>
                  <RefreshIcon />
                </span>
                <span>{researchLoading ? 'Analyzing Trends...' : 'Analyze Trends'}</span>
              </button>
            </div>
            
            {trending.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {trending.map((t, i) => (
                  <div 
                    key={i}
                    className="card-interactive p-8 cursor-pointer bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10"
                    onClick={() => setConfig({...config, userPrompt: `Create a video about: ${t.title}. ${t.description}`})}
                  >
                    <h4 className="text-white font-medium mb-4 truncate text-lg">{t.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed">{t.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p className="text-gray-500 text-base">
                  Analyze market trends to get data-driven inspiration for your <span className="text-gray-300">{config.category}</span> project.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA / Navigation Section */}
      <section className="px-8 pt-24 pb-32">
        <div className="w-full px-4 md:px-12 flex justify-end">
          <button 
            onClick={onNext}
            className="btn-primary text-base px-12 py-5 shadow-xl hover:shadow-2xl hover:shadow-dlm-accent/20 z-10 relative"
          >
            <span>Next: Configuration</span>
            <ArrowRightIcon />
          </button>
        </div>
      </section>
    </div>
  );
}
