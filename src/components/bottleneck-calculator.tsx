"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Computer, 
  ArrowRight,
  Loader2,
  Lightbulb,
  CheckCircle2,
  Monitor,
  Info,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CPUS, GPUS, RESOLUTIONS, RAM_OPTIONS } from '@/lib/hardware-data';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { aiBottleneckExplanation, type AiBottleneckExplanationOutput } from '@/ai/flows/ai-bottleneck-explanation-flow';
import { toast } from '@/hooks/use-toast';

interface InsightData {
  explanation: string;
  recommendations: string[];
}

export default function BottleneckCalculator() {
  const [mounted, setMounted] = useState(false);
  const [selectedCpu, setSelectedCpu] = useState<string>('');
  const [selectedGpu, setSelectedGpu] = useState<string>('');
  const [resolution, setResolution] = useState<string>(RESOLUTIONS[0].name);
  const [ram, setRam] = useState<string>('16');
  const [scenario, setScenario] = useState<string>('gaming');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<{
    percentage: number;
    component: 'CPU' | 'GPU';
    insight: InsightData;
    aiInsight?: AiBottleneckExplanationOutput | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCalculate = async () => {
    if (!selectedCpu || !selectedGpu) return;

    setCalculating(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    const cpu = CPUS.find(c => c.id === selectedCpu)!;
    const gpu = GPUS.find(g => g.id === selectedGpu)!;
    const resObj = RESOLUTIONS.find(r => r.name === resolution)!;
    
    const normalizedCpuScore = cpu.score;
    const normalizedGpuScore = gpu.score * resObj.weight;

    let bottleneckPercentage = 0;
    let component: 'CPU' | 'GPU' = 'CPU';

    if (normalizedCpuScore < normalizedGpuScore) {
      bottleneckPercentage = Math.min(((normalizedGpuScore - normalizedCpuScore) / normalizedGpuScore) * 100, 100);
      component = 'CPU';
    } else {
      bottleneckPercentage = Math.min(((normalizedCpuScore - normalizedGpuScore) / normalizedCpuScore) * 100, 100);
      component = 'GPU';
    }

    bottleneckPercentage = parseFloat(bottleneckPercentage.toFixed(1));

    const staticInsight: InsightData = {
      explanation: component === 'CPU' 
        ? `Your ${cpu.name} is currently limiting the performance of your ${gpu.name} at ${resolution}. This is a "CPU Bottleneck," meaning your graphics card is capable of rendering more frames, but the processor can't keep up with the data requests.`
        : `Your ${gpu.name} is the primary limiting factor at ${resolution}. This is generally considered a "GPU Bottleneck," which is the ideal state for high-fidelity gaming as it ensures your CPU has enough headroom for smooth system operations.`,
      recommendations: component === 'CPU'
        ? [
            "Consider increasing your game resolution to 1440p or 4K to shift load to the GPU.",
            "Close CPU-intensive background apps like browsers or recording software.",
            "Enable 'Ultra' graphics settings to put more stress on the GPU.",
            "A CPU upgrade to a newer generation would yield significant FPS gains."
          ]
        : [
            "Use performance-boosting tech like NVIDIA DLSS or AMD FSR.",
            "Lower GPU-heavy settings like Shadow Quality or Ray Tracing.",
            "Your system is well-balanced for cinematic gaming experiences.",
            "Consider overclocking your GPU for a free performance boost."
          ]
    };

    setResult({
      percentage: bottleneckPercentage,
      component,
      insight: staticInsight,
      aiInsight: null
    });
    setCalculating(false);
  };

  const handleAiAnalysis = async () => {
    if (!result || aiLoading) return;
    
    setAiLoading(true);
    try {
      const cpu = CPUS.find(c => c.id === selectedCpu)!;
      const gpu = GPUS.find(g => g.id === selectedGpu)!;
      
      const aiResponse = await aiBottleneckExplanation({
        cpuName: cpu.name,
        gpuName: gpu.name,
        resolution: resolution,
        ramGb: parseInt(ram),
        bottleneckPercentage: result.percentage,
        bottleneckComponent: result.component,
        usageScenario: scenario
      });
      
      setResult(prev => prev ? { ...prev, aiInsight: aiResponse } : null);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "AI Analysis Unavailable",
        description: "Please ensure your Gemini API key is configured in the environment settings."
      });
    } finally {
      setAiLoading(false);
    }
  };

  const getBottleneckColor = (percent: number) => {
    if (percent <= 10) return "text-emerald-500";
    if (percent <= 20) return "text-amber-500";
    return "text-rose-500";
  };

  const getProgressColor = (percent: number) => {
    if (percent <= 10) return "bg-emerald-500";
    if (percent <= 20) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-12 h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3388FF]" />
              System Components
            </CardTitle>
            <CardDescription>Select your hardware for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpu">Select CPU</Label>
                <Select value={selectedCpu} onValueChange={setSelectedCpu}>
                  <SelectTrigger id="cpu" className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Select CPU..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {CPUS.map(cpu => (
                      <SelectItem key={cpu.id} value={cpu.id}>{cpu.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpu">Select GPU</Label>
                <Select value={selectedGpu} onValueChange={setSelectedGpu}>
                  <SelectTrigger id="gpu" className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Select GPU..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {GPUS.map(gpu => (
                      <SelectItem key={gpu.id} value={gpu.id}>{gpu.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution" className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {RESOLUTIONS.map(res => (
                        <SelectItem key={res.id} value={res.name}>{res.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ram">RAM (GB)</Label>
                  <Select value={ram} onValueChange={setRam}>
                    <SelectTrigger id="ram" className="bg-slate-950 border-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {RAM_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt.toString()}>{opt}GB</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                variant="ghost" 
                className="text-[#33B3CC] hover:text-[#3388FF] p-0 h-auto font-medium"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="scenario">Primary Usage Scenario</Label>
                    <Select value={scenario} onValueChange={setScenario}>
                      <SelectTrigger id="scenario" className="bg-slate-950 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="gaming">Ultra Gaming (High Refresh)</SelectItem>
                        <SelectItem value="streaming">Streaming & Content Creation</SelectItem>
                        <SelectItem value="productivity">General Productivity</SelectItem>
                        <SelectItem value="workstation">Professional Workstation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-[#3388FF] hover:bg-[#2277EE] text-white font-bold py-6 transition-all shadow-[0_0_20px_rgba(51,136,255,0.3)]"
              onClick={handleCalculate}
              disabled={calculating || !selectedCpu || !selectedGpu}
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing System...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5 fill-white" />
                  Calculate Bottleneck
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-dashed border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Computer className="w-4 h-4 text-[#33B3CC]" />
              Hardware Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Ensure your <b>XMP/DOCP</b> profiles are enabled in BIOS to get the full speed of your RAM, which can often reduce minor CPU bottlenecks.</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7 space-y-8">
        {!result && !calculating ? (
          <Card className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Monitor className="w-10 h-10 text-slate-600" />
            </div>
            <CardTitle className="text-2xl mb-2">Analysis Tool</CardTitle>
            <CardDescription className="max-w-xs">
              Fill in your system specifications to see potential performance bottlenecks and optimization recommendations.
            </CardDescription>
          </Card>
        ) : calculating ? (
          <Card className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute top-0 w-24 h-24 border-4 border-[#3388FF] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <CardTitle className="text-2xl mb-2">Calculating Load...</CardTitle>
            <CardDescription>
              We are comparing hardware architectures and evaluating bottleneck scenarios.
            </CardDescription>
          </Card>
        ) : result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="glass-card overflow-hidden">
              <div className={cn("h-1.5 w-full", getProgressColor(result.percentage))} />
              <CardContent className="pt-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <Badge variant="outline" className="mb-2 text-[#33B3CC] border-[#33B3CC]/30 bg-[#33B3CC]/5 uppercase tracking-wider">Analysis Result</Badge>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                      Your {result.component} Bottleneck
                      <span className={cn("text-5xl font-black", getBottleneckColor(result.percentage))}>
                        {result.percentage}%
                      </span>
                    </h2>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center min-w-[160px]">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
                    <p className={cn("text-xl font-bold uppercase", getBottleneckColor(result.percentage))}>
                      {result.percentage <= 10 ? 'Optimal' : result.percentage <= 20 ? 'Sub-Optimal' : 'Bottlenecked'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Performance Balance</span>
                    <span>{result.percentage}% Utilization Gap</span>
                  </div>
                  <Progress 
                    value={result.percentage} 
                    className="h-3 bg-slate-800"
                  />
                  <p className="text-sm text-muted-foreground italic">
                    *A lower percentage indicates a more balanced system. Results under 10% are considered excellent.
                  </p>
                </div>

                <div className="space-y-8 pt-4 border-t border-slate-800">
                  <div className="rounded-xl border border-[#3388FF]/30 bg-gradient-to-br from-[#3388FF]/5 to-transparent p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#3388FF]">
                        <Sparkles className="w-5 h-5 fill-[#3388FF]/20" />
                        <h3 className="text-lg font-bold">AI Deep Analysis</h3>
                      </div>
                      {!result.aiInsight && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="bg-[#3388FF]/10 text-[#3388FF] hover:bg-[#3388FF]/20 border border-[#3388FF]/20"
                          onClick={handleAiAnalysis}
                          disabled={aiLoading}
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          Generate AI Report
                        </Button>
                      )}
                    </div>
                    
                    {aiLoading ? (
                      <div className="space-y-3 py-4">
                        <div className="h-4 w-full bg-slate-800 animate-pulse rounded" />
                        <div className="h-4 w-[90%] bg-slate-800 animate-pulse rounded" />
                        <div className="h-4 w-[75%] bg-slate-800 animate-pulse rounded" />
                      </div>
                    ) : result.aiInsight ? (
                      <div className="space-y-6 animate-in fade-in">
                        <p className="text-slate-200 leading-relaxed text-sm">
                          {result.aiInsight.explanation}
                        </p>
                        <div className="grid gap-3">
                          {result.aiInsight.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-[#3388FF]/5 border border-[#3388FF]/10 text-xs text-slate-300">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#3388FF]" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Click "Generate AI Report" for a personalized architecture deep-dive and custom upgrade paths.
                      </p>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#33B3CC]">
                        <Lightbulb className="w-5 h-5" />
                        <h3 className="text-lg font-bold">Standard Analysis</h3>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {result.insight.explanation}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="text-lg font-bold">Base Optimization Tips</h3>
                      </div>
                      <div className="grid gap-3">
                        {result.insight.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-sm text-slate-300">
                            <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-[#3388FF]" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-[#3388FF]" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-500 font-bold mb-1">Optimal</p>
                <p className="text-xs text-muted-foreground">Components are well-matched. No significant performance is left on the table.</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-500 font-bold mb-1">Fair</p>
                <p className="text-xs text-muted-foreground">Minor bottleneck present. Performance is stable but could be improved.</p>
              </div>
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-rose-500 font-bold mb-1">Extreme</p>
                <p className="text-xs text-muted-foreground">Severe mismatch. One component is significantly faster than the other.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
