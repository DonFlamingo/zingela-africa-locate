/**
 * Traccar Configuration Hook
 * 
 * Manages Traccar connection configuration.
 */

import { useState, useEffect } from 'react';
import type { TraccarConfig } from '../models/types';
import { traccarConfigStorage } from '../services/storage';
import { testTraccarConnection } from '../services/traccarApi';
import { traccarWebSocket } from '../services/traccarWebSocket';

export function useTraccarConfig(organizationId: string) {
  const [config, setConfig] = useState<TraccarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const stored = traccarConfigStorage.get();
    if (stored && stored.organizationId === organizationId) {
      setConfig(stored);
    }
    setIsLoading(false);
  }, [organizationId]);

  const saveConfig = async (newConfig: TraccarConfig): Promise<{ success: boolean; error?: string }> => {
    setIsTesting(true);
    try {
      const isValid = await testTraccarConnection(newConfig);
      const configToSave: TraccarConfig = {
        ...newConfig,
        isValid,
        lastTested: new Date().toISOString(),
      };

      traccarConfigStorage.set(configToSave);
      setConfig(configToSave);

      // Reconnect WebSocket if valid
      if (isValid) {
        traccarWebSocket.disconnect();
        traccarWebSocket.connect(configToSave);
      }

      return { success: isValid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, error: errorMessage };
    } finally {
      setIsTesting(false);
    }
  };

  const testConnection = async (): Promise<boolean> => {
    if (!config) return false;
    setIsTesting(true);
    try {
      const isValid = await testTraccarConnection(config);
      if (isValid !== config.isValid) {
        const updatedConfig = { ...config, isValid, lastTested: new Date().toISOString() };
        traccarConfigStorage.set(updatedConfig);
        setConfig(updatedConfig);
      }
      return isValid;
    } catch {
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  return {
    config,
    isLoading,
    isTesting,
    saveConfig,
    testConnection,
  };
}

