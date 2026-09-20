// ==============================================================================
// AI PROVIDER ABSTRACTION (Section 20 & 58)
// ==============================================================================

import { ChatContextPayload } from '../../types';

export interface AIResponse {
  text: string;
  suggestedPrompts: string[];
  modelUsed: string;
}

export interface IAIProvider {
  readonly providerName: string;
  generateResponse(prompt: string, context?: ChatContextPayload): Promise<AIResponse>;
  isHealthy(): Promise<boolean>;
}
