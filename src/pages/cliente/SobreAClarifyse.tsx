import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { motion } from 'framer-motion';
import {
  Search, Star, Lightbulb, BarChart2, Users, Brain,
  Mail, MessageCircle, DollarSign, Calendar, FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PILLARS = [
  {
    key: 'DISCOVER',
    icon: Search,
    name: 'Consumer & Market Understanding',
    desc: 'Entender profundamente consumidores, contextos e mercados.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    key: 'BRAND',
    icon: Star,
    name: 'Brand Intelligence & Positioning',
    desc: 'Medir força, percepção e posicionamento de marcas.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    key: 'INNOVATE',
    icon: Lightbulb,
    name: 'Product, Concept & Innovation',
    desc: 'Criar e validar novos produtos, conceitos e ideias.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    key: 'DECIDE',
    icon: BarChart2,
    name: 'Pricing, Portfolio & Strategy',
    desc: 'Apoiar decisões estratégicas de precificação e portfólio.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    key: 'EXPERIENCE',
    icon: Users,
    name: 'Customer & Shopper Intelligence',
    desc: 'Entender como clientes compram e interagem com marcas.',
    color: 'from-green-500 to-green-600',
  },
  {
    key: 'ANALYTICS',
    icon: Brain,
    name: 'Data Science, Modeling & AI',
    desc: 'Análises avançadas: modelagem, previsão e IA aplicada.',
    color: 'from-indigo-500 to-indigo-600',
  },
];

const DIFERENCIAIS = [
  {
    emoji: '💰',
    title: 'Preço competitivo',
    desc: 'Mesmo rigor metodológico das grandes consultorias, com precificação acessível para empresas de médio porte.',
  },
  {
    emoji: '📅',
    title: 'Compromisso com cronograma',
    desc: 'Cronograma detalhado compartilhado e atualizado em tempo real. Transparência total em cada etapa.',
  },
  {
    emoji: '🔬',
    title: 'Integração metodológica',
    desc: 'Qualitativo, quantitativo, analytics e IA em uma abordagem integrada e personalizada.',
  },
];

export default function SobreAClarifyse() {
  const { data: settings } = useQuery({
    queryKey: ['system-settings-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value');
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value || ''; });
      return map;
    },
  });

  const email = settings?.email_suporte || 'clarifysestrategyresearch@gmail.com';
  const whatsapp = settings?.whatsapp || '(11) 99310-6662';
  const whatsappClean = whatsapp.replace(/\D/g, '');

  return (
    <div className="space-y-16 pb-16">
      {/* Section 1 — Apresentação */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B2B6B] via-[#2D3E8C] to-[#1B2B6B] px-8 py-14 text-white text-center"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #7B2D8B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #A855F7 0%, transparent 50%)' }}
        />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-teal-300 uppercase mb-3">QUEM SOMOS</p>
          <h1 className="text-4xl font-display font-bold mb-6">Clarifyse Strategy &amp; Research</h1>
          <p className="text-lg text-blue-100 leading-relaxed mb-8">
            Transformamos dados e percepções humanas em clareza estratégica para decisões de negócio.
            Combinamos rigor metodológico, inteligência analítica e profundo entendimento do comportamento
            humano para entregar insights que realmente movem empresas.
          </p>
          <p className="text-xl font-display italic text-teal-300">
            "Where insight becomes clarity."
          </p>
        </div>
      </motion.section>

      {/* Section 2 — Os 6 Pilares */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="text-center mb-10">
          <p className="clarifyse-section-label text-xs mb-2">NOSSAS SOLUÇÕES</p>
          <h2 className="text-3xl font-display font-bold text-foreground">Como podemos ajudar sua empresa</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className="clarifyse-card p-6 flex flex-col gap-3 group hover:shadow-lg transition-shadow"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-widest text-teal-600 uppercase">{p.key}</span>
                  <h3 className="font-display font-semibold text-foreground mt-0.5">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Section 3 — Diferenciais */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="text-center mb-10">
          <p className="clarifyse-section-label text-xs mb-2">POR QUE A CLARIFYSE</p>
          <h2 className="text-3xl font-display font-bold text-foreground">Nossos Diferenciais</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DIFERENCIAIS.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.07 * i }}
              className="clarifyse-card p-6 text-center flex flex-col items-center gap-3"
            >
              <span className="text-4xl">{d.emoji}</span>
              <h3 className="font-display font-bold text-foreground text-lg">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Section 4 — Contato */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="clarifyse-card p-10 text-center max-w-xl mx-auto"
      >
        <p className="clarifyse-section-label text-xs mb-2">FALE CONOSCO</p>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6">
          Vamos conversar sobre seu próximo projeto
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4 text-teal-500" />
            {email}
          </a>
          <span className="hidden sm:block text-muted-foreground">|</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-teal-500" />
            {whatsapp}
          </span>
        </div>
        <Button
          className="bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] hover:opacity-90 text-white border-0 px-8"
          onClick={() => window.open(`https://wa.me/${whatsappClean}`, '_blank')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Falar pelo WhatsApp
        </Button>
      </motion.section>
    </div>
  );
}
