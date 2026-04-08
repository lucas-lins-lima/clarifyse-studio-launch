/**
 * Serviço de Análises em Tempo Real
 * Suporta polling e WebSocket para atualização instantânea de resultados
 */

import { AnalysisResponse, Question } from './analyticsEngine';
import { useRealtimeAnalytics, RealtimeAnalyticsResult } from '@/hooks/useRealtimeAnalytics';

export interface RealtimeAnalyticsConfig {
  projectId: string;
  pollingInterval?: number; // ms (default 5000)
  enableWebSocket?: boolean;
  maxResponsesCache?: number; // limite de respostas em cache
}

export interface AnalyticsUpdate {
  timestamp: string;
  responseCount: number;
  newResponseCount: number;
  analysisResults: RealtimeAnalyticsResult;
  hasSignificantChange: boolean;
}

export interface AnalyticsListener {
  (update: AnalyticsUpdate): void;
}

/**
 * Serviço singleton para gerenciar análises em tempo real
 */
export class RealtimeAnalyticsService {
  private static instance: RealtimeAnalyticsService;
  private projectListeners: Map<string, Set<AnalyticsListener>> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastResponseCounts: Map<string, number> = new Map();
  private cachedResponses: Map<string, AnalysisResponse[]> = new Map();
  private wsConnections: Map<string, WebSocket> = new Map();
  private config: Map<string, RealtimeAnalyticsConfig> = new Map();

  private constructor() {}

  /**
   * Obter instância singleton
   */
  static getInstance(): RealtimeAnalyticsService {
    if (!RealtimeAnalyticsService.instance) {
      RealtimeAnalyticsService.instance = new RealtimeAnalyticsService();
    }
    return RealtimeAnalyticsService.instance;
  }

  /**
   * Iniciar monitoramento de um projeto
   */
  startMonitoring(
    projectId: string,
    fetchResponses: () => Promise<AnalysisResponse[]>,
    fetchQuestions: () => Promise<Question[]>,
    fetchQuotas: () => Promise<any[]>,
    fetchMethodologies: () => Promise<string[]>,
    config?: Partial<RealtimeAnalyticsConfig>
  ) {
    const finalConfig: RealtimeAnalyticsConfig = {
      projectId,
      pollingInterval: 5000,
      enableWebSocket: false,
      maxResponsesCache: 10000,
      ...config,
    };

    this.config.set(projectId, finalConfig);
    this.lastResponseCounts.set(projectId, 0);

    // Iniciar polling
    this.startPolling(projectId, fetchResponses, fetchQuestions, fetchQuotas, fetchMethodologies, finalConfig);

    // WebSocket (se habilitado)
    if (finalConfig.enableWebSocket) {
      this.connectWebSocket(projectId);
    }
  }

  /**
   * Parar monitoramento de um projeto
   */
  stopMonitoring(projectId: string) {
    // Limpar polling
    const interval = this.pollingIntervals.get(projectId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(projectId);
    }

    // Fechar WebSocket
    const ws = this.wsConnections.get(projectId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(projectId);
    }

    // Limpar listeners
    this.projectListeners.delete(projectId);
    this.cachedResponses.delete(projectId);
    this.lastResponseCounts.delete(projectId);
    this.config.delete(projectId);
  }

  /**
   * Inscrever-se aos updates de um projeto
   */
  subscribe(projectId: string, listener: AnalyticsListener): () => void {
    if (!this.projectListeners.has(projectId)) {
      this.projectListeners.set(projectId, new Set());
    }

    this.projectListeners.get(projectId)!.add(listener);

    // Retornar função de desinscrição
    return () => {
      const listeners = this.projectListeners.get(projectId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.projectListeners.delete(projectId);
        }
      }
    };
  }

  /**
   * Iniciar polling de respostas
   */
  private startPolling(
    projectId: string,
    fetchResponses: () => Promise<AnalysisResponse[]>,
    fetchQuestions: () => Promise<Question[]>,
    fetchQuotas: () => Promise<any[]>,
    fetchMethodologies: () => Promise<string[]>,
    config: RealtimeAnalyticsConfig
  ) {
    const poll = async () => {
      try {
        const [responses, questions, quotas, methodologies] = await Promise.all([
          fetchResponses(),
          fetchQuestions(),
          fetchQuotas(),
          fetchMethodologies(),
        ]);

        const lastCount = this.lastResponseCounts.get(projectId) || 0;
        const newCount = responses.length;
        const newResponseCount = newCount - lastCount;

        if (newCount > lastCount || newCount === 0) {
          // Cache responses
          this.cachedResponses.set(projectId, responses);
          this.lastResponseCounts.set(projectId, newCount);

          // Aqui você integraria com useRealtimeAnalytics
          const hasSignificantChange = newResponseCount > 0;

          // Notificar listeners
          this.notifyListeners(projectId, {
            timestamp: new Date().toISOString(),
            responseCount: newCount,
            newResponseCount,
            analysisResults: {} as RealtimeAnalyticsResult,
            hasSignificantChange,
          });
        }
      } catch (error) {
        console.error(`Erro ao fazer polling de análises para ${projectId}:`, error);
      }
    };

    // Executar imediatamente
    poll();

    // Agendar próxima execução
    const interval = setInterval(poll, config.pollingInterval || 5000);
    this.pollingIntervals.set(projectId, interval);
  }

  /**
   * Conectar ao WebSocket
   */
  private connectWebSocket(projectId: string) {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/realtime/analytics/${projectId}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`WebSocket conectado para ${projectId}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(projectId, data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`Erro WebSocket para ${projectId}:`, error);
        // Fallback para polling
        console.log('Revertendo para polling...');
      };

      ws.onclose = () => {
        console.log(`WebSocket fechado para ${projectId}`);
        this.wsConnections.delete(projectId);
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          if (this.config.has(projectId)) {
            this.connectWebSocket(projectId);
          }
        }, 5000);
      };

      this.wsConnections.set(projectId, ws);
    } catch (error) {
      console.error(`Erro ao conectar WebSocket para ${projectId}:`, error);
    }
  }

  /**
   * Notificar todos os listeners de um projeto
   */
  private notifyListeners(projectId: string, update: AnalyticsUpdate) {
    const listeners = this.projectListeners.get(projectId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(update);
        } catch (error) {
          console.error('Erro ao executar listener de análise:', error);
        }
      });
    }
  }

  /**
   * Obter responses em cache
   */
  getCachedResponses(projectId: string): AnalysisResponse[] {
    return this.cachedResponses.get(projectId) || [];
  }

  /**
   * Atualizar responses manualmente (útil para testes)
   */
  updateResponses(projectId: string, responses: AnalysisResponse[]) {
    const lastCount = this.lastResponseCounts.get(projectId) || 0;
    const newCount = responses.length;
    const newResponseCount = newCount - lastCount;

    this.cachedResponses.set(projectId, responses);
    this.lastResponseCounts.set(projectId, newCount);

    this.notifyListeners(projectId, {
      timestamp: new Date().toISOString(),
      responseCount: newCount,
      newResponseCount,
      analysisResults: {} as RealtimeAnalyticsResult,
      hasSignificantChange: newResponseCount > 0,
    });
  }

  /**
   * Obter status de monitoramento
   */
  getStatus(projectId: string) {
    return {
      isMonitoring: this.pollingIntervals.has(projectId),
      hasWebSocket: this.wsConnections.has(projectId),
      cachedResponseCount: this.cachedResponses.get(projectId)?.length || 0,
      listenerCount: this.projectListeners.get(projectId)?.size || 0,
    };
  }
}

/**
 * Hook para usar o serviço de análises em tempo real em componentes React
 */
export function useRealtimeAnalyticsService(projectId: string) {
  const service = RealtimeAnalyticsService.getInstance();

  const subscribe = (listener: AnalyticsListener) => {
    return service.subscribe(projectId, listener);
  };

  const startMonitoring = (
    fetchResponses: () => Promise<AnalysisResponse[]>,
    fetchQuestions: () => Promise<Question[]>,
    fetchQuotas: () => Promise<any[]>,
    fetchMethodologies: () => Promise<string[]>,
    config?: Partial<RealtimeAnalyticsConfig>
  ) => {
    service.startMonitoring(projectId, fetchResponses, fetchQuestions, fetchQuotas, fetchMethodologies, config);
  };

  const stopMonitoring = () => {
    service.stopMonitoring(projectId);
  };

  const getStatus = () => {
    return service.getStatus(projectId);
  };

  return { subscribe, startMonitoring, stopMonitoring, getStatus };
}
