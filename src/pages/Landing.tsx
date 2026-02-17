import { motion } from 'framer-motion';
import { Sparkles, Palette, Music, Wand2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pb-24">
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI Creative Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold font-display tracking-tight mb-4">
            <span className="text-foreground">Nexus</span>
            <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Transform your imagination into stunning visuals with AI-powered creativity
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full"
        >
          {[
            { icon: Wand2, label: 'AI Generation', desc: 'Create stunning images' },
            { icon: Palette, label: 'Personas', desc: 'Unique creative styles' },
            { icon: Music, label: 'Music Studio', desc: 'Ambient soundscapes' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="group p-5 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              <feature.icon size={24} className="text-primary mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{feature.label}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
