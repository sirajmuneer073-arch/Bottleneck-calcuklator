import BottleneckCalculator from '@/components/bottleneck-calculator';

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight">
            Performance <span className="gradient-text">Insight</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Advanced Bottleneck Calculator: Understand PC Performance. Get data-driven hardware analysis and smart optimization tips.
          </p>
        </div>

        <BottleneckCalculator />

        <footer className="text-center text-muted-foreground text-sm pt-12">
          <p>© {new Date().getFullYear()} Performance Insight. All hardware data is for estimation purposes only.</p>
        </footer>
      </div>
    </main>
  );
}
