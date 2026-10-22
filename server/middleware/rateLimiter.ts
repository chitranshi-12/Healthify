import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, AttemptRecord>();

// Clean up stale attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (record.resetAt < now) {
      loginAttempts.delete(key);
    }
  }
}, 60000);

export function loginRateLimiter(maxAttempts = 5, windowMinutes = 15) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = (req.body?.email || '').toLowerCase().trim();
    const key = `${ip}:${email}`;
    const now = Date.now();

    const record = loginAttempts.get(key);

    if (record) {
      if (record.resetAt > now) {
        if (record.count >= maxAttempts) {
          const waitMins = Math.ceil((record.resetAt - now) / 60000);
          res.status(429).json({
            success: false,
            message: `Too many failed login attempts. Please try again in ${waitMins} minute${waitMins === 1 ? '' : 's'}.`,
          });
          return;
        }
      } else {
        // Expired window, reset
        loginAttempts.set(key, { count: 0, resetAt: now + windowMinutes * 60000 });
      }
    } else {
      loginAttempts.set(key, { count: 0, resetAt: now + windowMinutes * 60000 });
    }

    // Attach hook to increment on failure
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 401) {
        const cur = loginAttempts.get(key);
        if (cur) {
          cur.count += 1;
        }
      } else if (res.statusCode === 200 && body?.success) {
        // Reset on successful login
        loginAttempts.delete(key);
      }
      return originalJson(body);
    };

    next();
  };
}
