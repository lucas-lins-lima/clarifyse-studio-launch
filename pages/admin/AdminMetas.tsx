import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { GoalsManager } from '@/components/goals/GoalsManager';

export default function AdminMetas() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label">METAS</p>
        <div className="flex items-center gap-3 mt-1">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">
            Acompanhamento de Metas
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Defina e acompanhe metas mensais e trimestrais de receita, projetos, margem e NPS.
        </p>
      </motion.div>

      <GoalsManager />
    </div>
  );
}
