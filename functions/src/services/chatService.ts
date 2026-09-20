// ==============================================================================
// CHAT SERVICE & CONTEXT BUILDER (Section 20)
// ==============================================================================

import { db, config } from '../config';
import { ChatSessionRecord, ChatMessageRecord, ChatContextPayload } from '../types';
import { aiProvider } from '../providers/ai';
import { weatherProvider } from '../providers/weather';
import { riskService } from './riskService';
import { alertRepository } from '../repositories/alertRepository';
import { logger } from '../logging/logger';
import * as crypto from 'crypto';

export class ChatService {
  private sessionsCollection = db.collection('chatSessions');
  private memorySessions = new Map<string, ChatSessionRecord>();
  private memoryMessages = new Map<string, ChatMessageRecord[]>();

  /**
   * Aggregates live weather, risk intelligence, and active alerts into prompt context
   */
  async buildContext(locationId?: string): Promise<ChatContextPayload> {
    const locId = locationId || 'delhi';

    try {
      const [weather, risk, { alerts }] = await Promise.all([
        weatherProvider.getCurrentWeather(locId),
        riskService.getAssessment(locId),
        alertRepository.listAlerts({ location: locId, status: 'ACTIVE' }),
      ]);

      return {
        locationId: locId,
        locationName: weather.locationName,
        weather: {
          temperature: weather.temperature,
          feelsLike: weather.feelsLike,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          condition: weather.condition,
        },
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        activeAlerts: alerts.map((a) => a.title),
        language: 'en',
      };
    } catch {
      return {
        locationId: locId,
        locationName: 'National Meteorological Grid',
      };
    }
  }

  async processUserMessage(
    userId: string,
    messageContent: string,
    locationId?: string,
    existingSessionId?: string
  ): Promise<{ userMessage: ChatMessageRecord; assistantMessage: ChatMessageRecord; session: ChatSessionRecord }> {
    const sessionId = existingSessionId || `chat_session_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    // 1. Ensure Session exists
    let session = this.memorySessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId,
        title: messageContent.slice(0, 40) + (messageContent.length > 40 ? '...' : ''),
        createdAt: now,
        updatedAt: now,
        lastMessageSnippet: messageContent.slice(0, 60),
      };
      this.memorySessions.set(sessionId, session);
    } else {
      session.updatedAt = now;
      session.lastMessageSnippet = messageContent.slice(0, 60);
    }

    // 2. Build Meteorological Context
    const context = await this.buildContext(locationId);

    // 3. Create User Message Record
    const userMsg: ChatMessageRecord = {
      id: `msg_u_${Date.now()}`,
      sessionId,
      sender: 'user',
      content: messageContent,
      timestamp: now,
      contextAttached: context,
    };

    // 4. Generate AI Provider Response
    const aiResult = await aiProvider.generateResponse(messageContent, context);

    // 5. Create Assistant Message Record
    const assistantMsg: ChatMessageRecord = {
      id: `msg_a_${Date.now() + 1}`,
      sessionId,
      sender: 'assistant',
      content: aiResult.text,
      timestamp: new Date().toISOString(),
      suggestedPrompts: aiResult.suggestedPrompts,
    };

    // Store in memory
    const existingMsgs = this.memoryMessages.get(sessionId) || [];
    existingMsgs.push(userMsg, assistantMsg);
    this.memoryMessages.set(sessionId, existingMsgs);

    // Async write to Firestore (resilient)
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS || config.isProd) {
      try {
        await this.sessionsCollection.doc(sessionId).set(session, { merge: true });
        await this.sessionsCollection.doc(sessionId).collection('messages').doc(userMsg.id).set(userMsg);
        await this.sessionsCollection.doc(sessionId).collection('messages').doc(assistantMsg.id).set(assistantMsg);
      } catch {
        logger.debug('Firestore write fallback in ChatService');
      }
    }

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      session,
    };
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessageRecord[]> {
    return this.memoryMessages.get(sessionId) || [];
  }

  async getUserSessions(userId: string): Promise<ChatSessionRecord[]> {
    return Array.from(this.memorySessions.values()).filter((s) => s.userId === userId);
  }
}

export const chatService = new ChatService();
