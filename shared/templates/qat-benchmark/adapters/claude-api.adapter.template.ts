/**
 * Claude API Adapter — Baseline adapter that calls Claude API directly
 *
 * This adapter calls the Claude API with the same prompt as the app adapter,
 * providing a market-reference baseline for comparison.
 */

export class ClaudeApiAdapter {
  name = 'claude-api-baseline';
  type = 'api' as const;

  private model: string;
  private apiKey: string;
  private maxTokens: number;

  constructor(config: { model: string; apiKeyEnvVar: string; maxTokens: number }) {
    this.model = config.model;
    this.apiKey = process.env[config.apiKeyEnvVar] ?? '';
    this.maxTokens = config.maxTokens;

    if (!this.apiKey) {
      throw new Error(`Missing API key: set ${config.apiKeyEnvVar} environment variable`);
    }
  }

  async initialize(): Promise<void> {
    // Verify API key works — optional warm-up
  }

  async send(scenario: { id: string; prompt: string; systemPrompt?: string; context?: string; timeoutMs: number }) {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          system: scenario.systemPrompt ?? 'You are a helpful AI assistant.',
          messages: [
            {
              role: 'user',
              content: scenario.context
                ? `Context: ${scenario.context}\n\n${scenario.prompt}`
                : scenario.prompt,
            },
          ],
        }),
        signal: AbortSignal.timeout(scenario.timeoutMs),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Claude API ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
      const inputCost = (data.usage?.input_tokens ?? 0) * 0.000015;
      const outputCost = (data.usage?.output_tokens ?? 0) * 0.000075;

      return {
        text,
        latencyMs: Date.now() - startTime,
        tokensUsed,
        costUsd: inputCost + outputCost,
        metadata: {
          adapter: this.name,
          model: this.model,
          scenario: scenario.id,
          usage: data.usage,
        },
        capturedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        text: '',
        latencyMs: Date.now() - startTime,
        metadata: { adapter: this.name, model: this.model, scenario: scenario.id },
        capturedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for API adapter
  }
}
