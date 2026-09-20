// ==============================================================================
// CHAT API ROUTER (Section 20)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';
import { sendSuccess } from '../utils/response';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';

const router = Router();

const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  locationId: z.string().optional(),
  sessionId: z.string().optional(),
});

router.post('/', validateRequest({ body: chatMessageSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid || 'guest_user';
    const { message, locationId, sessionId } = req.body;

    const result = await chatService.processUserMessage(userId, message, locationId, sessionId);
    sendSuccess(req, res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid || 'guest_user';
    const sessions = await chatService.getUserSessions(userId);
    sendSuccess(req, res, sessions);
  } catch (err) {
    next(err);
  }
});

router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const messages = await chatService.getSessionMessages(sessionId);
    sendSuccess(req, res, messages);
  } catch (err) {
    next(err);
  }
});

export const chatRouter = router;
