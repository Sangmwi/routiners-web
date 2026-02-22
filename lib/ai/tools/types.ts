import type { AIToolName } from '@/lib/types/fitness';

export interface AIToolDefinition {
  type: 'function';
  name: AIToolName;
  description: string;
  strict?: boolean;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}
