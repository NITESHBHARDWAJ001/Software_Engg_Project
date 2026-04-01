import { Router } from 'express';
import { authService } from './auth.service.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import { ok } from '../../shared/http/response.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body.email, body.password);
  res.json(ok(result, 'Login successful'));
});

authRouter.post('/refresh', async (req, res) => {
  const body = refreshSchema.parse(req.body);
  const result = await authService.refresh(body.refreshToken);
  res.json(ok(result, 'Token refreshed'));
});

authRouter.post('/logout', async (req, res) => {
  const body = refreshSchema.parse(req.body);
  await authService.logout(body.refreshToken);
  res.json(ok(null, 'Logged out'));
});

authRouter.post('/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await authService.register(body);
  res.status(201).json(ok(result, 'Organization registered successfully'));
});
