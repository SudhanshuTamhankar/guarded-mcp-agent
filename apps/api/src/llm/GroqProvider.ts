import Groq from 'groq-sdk';
import { env } from '../config/env';

export class GroqProvider {
  private groq: Groq;
  private model: string = env.GROQ_MODEL || 'openai/gpt-oss-120b';

  constructor() {
    this.groq = new Groq({
      apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY
    });
  }

  async generateResponse(messages: any[], tools: any[] = []): Promise<any> {
    const params: any = {
      model: this.model,
      messages: messages,
    };

    if (tools.length > 0) {
      params.tools = tools;
      params.tool_choice = "auto";
    }

    const response = await this.groq.chat.completions.create(params);
    return response.choices[0].message;
  }
}

export const groqProvider = new GroqProvider();
