import { Link } from 'react-router-dom';
import { Sparkles, Users, History, CreditCard, ArrowRight } from 'lucide-react';
import { HorizontalSwipeContainer } from '@/components/HorizontalSwipeContainer';

const actions = [
  {
    title: 'Create',
    description: 'Generate new artwork',
    icon: Sparkles,
    path: '/creative-journey',
    color: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10'
  },
  {
    title: 'Personas',
    description: 'Manage AI guides',
    icon: Users,
    path: '/personas',
    color: 'text-primary border-primary/30 bg-primary/10'
  },
  {
    title: 'History',
    description: 'View past creations',
    icon: History,
    path: '/history',
    color: 'text-accent border-accent/30 bg-accent/10'
  },
  {
    title: 'Upgrade',
    description: 'Get more credits',
    icon: CreditCard,
    path: '/billing',
    color: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10'
  }
];

export function QuickActionsWidget() {
  return (
    <HorizontalSwipeContainer showIndicators={false}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            to={action.path}
            className="group flex flex-col p-2 border border-border/30 bg-space-dark/30 hover:bg-space-dark/50 transition-all rounded min-w-[100px] flex-shrink-0"
          >
            <div className={`w-6 h-6 flex items-center justify-center border ${action.color} mb-1.5`}>
              <Icon className="w-3 h-3" />
            </div>
            <p className="text-xs font-display font-semibold text-foreground group-hover:text-neon-cyan transition-colors leading-tight">
              {action.title}
            </p>
            <p className="text-[9px] text-muted-foreground">{action.description}</p>
          </Link>
        );
      })}
    </HorizontalSwipeContainer>
  );
}