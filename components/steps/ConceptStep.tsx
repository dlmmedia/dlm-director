import React from 'react';
import Image from 'next/image';
import { ProjectConfig, VideoCategory, TrendingTopic } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RefreshCw, ArrowRight, Loader2 } from 'lucide-react';

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
      {/* Hero Section */}
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
          <p className="text-2xl md:text-3xl text-muted-foreground font-light mb-6">
            Elite Cinematic Video Generation
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            AI-powered film direction with character consistency, professional cinematography, 
            and seamless scene stitching. Create videos that look like they belong together.
          </p>
        </div>
      </section>

      {/* Project Type Section */}
      <section className="px-8 pt-20 pb-24 border-t border-border bg-muted/30">
        <div id="concept-project-type" className="w-full px-4 md:px-12">
          <label className="block text-base font-semibold uppercase tracking-widest text-muted-foreground mb-12">
            Project Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {Object.values(VideoCategory).map((cat) => (
              <button
                key={cat}
                onClick={() => setConfig({ ...config, category: cat })}
                className={cn(
                  "px-4 py-8 rounded-2xl border text-center transition-all duration-300 group",
                  config.category === cat 
                    ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]' 
                    : 'border-border bg-card hover:border-border/80 hover:bg-muted hover:-translate-y-1'
                )}
              >
                <span className={cn(
                  "text-base font-medium block transition-colors",
                  config.category === cat ? 'text-primary' : 'text-foreground group-hover:text-foreground'
                )}>
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
          <Card className="p-8">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-xl font-medium flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#D4AF37]" />
                Market Research
              </h2>
              <Button 
                variant="ghost"
                onClick={onFetchTrending} 
                disabled={researchLoading}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                {researchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{researchLoading ? 'Analyzing Trends...' : 'Analyze Trends'}</span>
              </Button>
            </div>
            
            {trending.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {trending.map((t, i) => (
                  <Card 
                    key={i}
                    className="p-6 cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all bg-muted/50"
                    onClick={() => setConfig({...config, userPrompt: `Create a video about: ${t.title}. ${t.description}`})}
                  >
                    <h4 className="font-medium mb-4 truncate text-lg">{t.title}</h4>
                    <p className="text-base text-muted-foreground line-clamp-4 leading-relaxed">{t.description}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-muted/50 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground text-base">
                  Analyze market trends to get data-driven inspiration for your <span className="text-foreground">{config.category}</span> project.
                </p>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* CTA / Navigation Section */}
      <section className="px-8 pt-24 pb-32">
        <div className="w-full px-4 md:px-12 flex justify-end">
          <Button 
            variant="gold"
            size="lg"
            onClick={onNext}
            className="text-base px-12 py-5 shadow-xl hover:shadow-2xl"
          >
            <span>Next: Configuration</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
