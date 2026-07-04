import { v4 as uuidv4 } from 'uuid';
import { logger } from '@shared/logger';

interface MessageContext {
  conversationId: string;
  userId: string;
  organizationId: string;
  domain: string;
  history: Array<{ role: string; content: string }>;
}

interface ElstonResponse {
  id: string;
  message: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  context: MessageContext;
  timestamp: string;
}

/**
 * ELSTON - Enterprise Learning System That Observes and Navigates
 * 
 * Core intelligence service that:
 * - Maintains unified memory across conversations
 * - Applies domain expertise (HR, IT, Finance, etc.)
 * - Suggests actions based on business logic
 * - Learns from interactions
 */
export class ElstonService {
  private conversationMemory: Map<string, MessageContext> = new Map();

  /**
   * Process natural language input and generate intelligent response
   */
  async processMessage(
    userId: string,
    organizationId: string,
    message: string,
    domain: string = 'HR'
  ): Promise<ElstonResponse> {
    const conversationId = this.getOrCreateConversation(userId, organizationId);
    const context = this.conversationMemory.get(conversationId)!;

    logger.info(`ELSTON processing: "${message}" in domain: ${domain}`);

    // Add user message to history
    context.history.push({ role: 'user', content: message });

    // Determine intent and extract entities
    const { intent, entities } = this.parseMessage(message, domain);
    
    // Generate response based on intent
    let responseText = '';
    let suggestedActions: string[] = [];

    switch (intent) {
      case 'QUERY_EMPLOYEE':
        responseText = await this.handleEmployeeQuery(entities, organizationId);
        suggestedActions = ['view_profile', 'update_record', 'start_case'];
        break;

      case 'HR_CASE':
        responseText = await this.handleCaseCreation(entities, organizationId);
        suggestedActions = ['assign_case', 'set_priority', 'notify_hr'];
        break;

      case 'ANALYTICS':
        responseText = await this.handleAnalyticsRequest(entities, organizationId);
        suggestedActions = ['export_report', 'schedule_review'];
        break;

      case 'WORKFLOW':
        responseText = await this.handleWorkflowRequest(entities, organizationId);
        suggestedActions = ['execute_workflow', 'approve', 'reject'];
        break;

      case 'KNOWLEDGE':
        responseText = await this.queryKnowledgeBase(message, domain);
        suggestedActions = ['learn_more', 'apply_policy'];
        break;

      default:
        responseText = this.generateDefaultResponse(message, domain);
        suggestedActions = ['clarify', 'search_help'];
    }

    // Add ELSTON response to history
    context.history.push({ role: 'assistant', content: responseText });

    const response: ElstonResponse = {
      id: uuidv4(),
      message: responseText,
      confidence: this.calculateConfidence(intent, entities),
      reasoning: `Interpreted as ${intent} with entities: ${JSON.stringify(entities)}`,
      suggestedActions,
      context,
      timestamp: new Date().toISOString(),
    };

    return response;
  }

  /**
   * Handle employee-related queries
   */
  private async handleEmployeeQuery(
    entities: any,
    organizationId: string
  ): Promise<string> {
    const { name, field } = entities;

    if (!name) {
      return `I need an employee name to look that up. Could you provide one?`;
    }

    // In production, this would query the database
    const fieldInfo = field || 'general information';
    return `I found information about ${name}. Here's their ${fieldInfo}:
    
    - Name: ${name}
    - Status: Active
    - Department: [Would fetch from DB]
    - Join Date: [Would fetch from DB]
    
    Would you like me to provide more details or take any action?`;
  }

  /**
   * Handle HR case creation
   */
  private async handleCaseCreation(
    entities: any,
    organizationId: string
  ): Promise<string> {
    const { caseType, description, employeeName, priority } = entities;

    if (!caseType || !employeeName) {
      return `To create an HR case, I need: case type (e.g., performance review, leave request) and employee name. Please provide these details.`;
    }

    const caseId = uuidv4().substring(0, 8).toUpperCase();
    return `I've created HR case #${caseId}:
    
    - Type: ${caseType}
    - Employee: ${employeeName}
    - Priority: ${priority || 'Normal'}
    - Description: ${description || 'No description provided'}
    - Status: Open
    
    Next steps: Assign to HR manager, set timeline, notify involved parties. Should I proceed?`;
  }

  /**
   * Handle analytics and reporting requests
   */
  private async handleAnalyticsRequest(
    entities: any,
    organizationId: string
  ): Promise<string> {
    const { reportType, timeframe, metric } = entities;

    return `I can generate the following analytics for you:
    
    📊 Report Type: ${reportType || 'Executive Summary'}
    📅 Timeframe: ${timeframe || 'Last 30 Days'}
    📈 Metrics: ${metric || 'All available metrics'}
    
    Available reports:
    - Employee turnover analysis
    - Hiring pipeline status
    - Department performance
    - Compensation analysis
    - Leave utilization
    
    Which report would you like me to generate?`;
  }

  /**
   * Handle workflow requests
   */
  private async handleWorkflowRequest(
    entities: any,
    organizationId: string
  ): Promise<string> {
    const { workflowType, action } = entities;

    return `I can help you with the following workflows:
    
    1. **Hire-to-Retire**: Manage full employee lifecycle
    2. **Leave Management**: Track and approve leave requests
    3. **Performance Review**: Conduct structured reviews
    4. **Onboarding**: Automate new hire onboarding
    
    What workflow would you like to initiate or track?`;
  }

  /**
   * Query knowledge base
   */
  private async queryKnowledgeBase(
    message: string,
    domain: string
  ): Promise<string> {
    // In production, this would search vector database or knowledge graph
    const keywords = message.toLowerCase();

    if (keywords.includes('policy') || keywords.includes('compliance')) {
      return `📋 **Policy Information**:
      
      I found relevant policies in our knowledge base. Would you like information about:
      - Company Leave Policy
      - Remote Work Guidelines
      - Code of Conduct
      - Data Security Policies`;
    }

    if (keywords.includes('process') || keywords.includes('how')) {
      return `📚 **Process Documentation**:
      
      I can help you with processes for:
      - Hiring new employees
      - Performance reviews
      - Leave requests
      - Expense approvals`;
    }

    return `I searched our knowledge base. Could you be more specific about what you'd like to know?`;
  }

  /**
   * Generate contextual default response
   */
  private generateDefaultResponse(message: string, domain: string): string {
    return `I understood you're asking about: "${message}"

In the ${domain} domain, I can help with:
- Employee information and management
- HR cases and requests
- Analytics and reporting
- Workflows and processes
- Policy and compliance questions

How can I assist you more specifically?`;
  }

  /**
   * Parse message to extract intent and entities
   */
  private parseMessage(message: string, domain: string): { intent: string; entities: any } {
    const lowerMessage = message.toLowerCase();

    // Intent detection
    let intent = 'GENERAL';
    const entities: any = {};

    if (
      lowerMessage.includes('who is') ||
      lowerMessage.includes('tell me about') ||
      lowerMessage.includes('employee') ||
      lowerMessage.includes('information')
    ) {
      intent = 'QUERY_EMPLOYEE';
      const nameMatch = message.match(/(?:who is|about|tell me about)\s+(\w+\s+\w+)/i);
      if (nameMatch) entities.name = nameMatch[1];
    } else if (
      lowerMessage.includes('create case') ||
      lowerMessage.includes('new case') ||
      lowerMessage.includes('case')
    ) {
      intent = 'HR_CASE';
      entities.caseType = 'General';
    } else if (
      lowerMessage.includes('report') ||
      lowerMessage.includes('analytics') ||
      lowerMessage.includes('statistics')
    ) {
      intent = 'ANALYTICS';
      entities.reportType = 'Summary';
    } else if (
      lowerMessage.includes('workflow') ||
      lowerMessage.includes('process') ||
      lowerMessage.includes('onboard')
    ) {
      intent = 'WORKFLOW';
    } else if (
      lowerMessage.includes('policy') ||
      lowerMessage.includes('how') ||
      lowerMessage.includes('guide')
    ) {
      intent = 'KNOWLEDGE';
    }

    return { intent, entities };
  }

  /**
   * Calculate confidence score based on intent clarity
   */
  private calculateConfidence(intent: string, entities: any): number {
    let confidence = 0.5; // Base confidence

    if (intent !== 'GENERAL') confidence += 0.3;
    if (Object.keys(entities).length > 0) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Manage conversation memory
   */
  private getOrCreateConversation(userId: string, organizationId: string): string {
    const key = `${userId}:${organizationId}`;
    
    if (!this.conversationMemory.has(key)) {
      this.conversationMemory.set(key, {
        conversationId: uuidv4(),
        userId,
        organizationId,
        domain: 'HR',
        history: [],
      });
    }

    return key;
  }

  /**
   * Get full conversation history
   */
  getConversationHistory(userId: string, organizationId: string) {
    const key = `${userId}:${organizationId}`;
    return this.conversationMemory.get(key)?.history || [];
  }

  /**
   * Clear conversation (privacy)
   */
  clearConversation(userId: string, organizationId: string): void {
    const key = `${userId}:${organizationId}`;
    this.conversationMemory.delete(key);
    logger.info(`Conversation cleared for user ${userId}`);
  }
}

export default new ElstonService();
