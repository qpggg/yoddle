// Middleware для валидации входных данных
export const validateUser = (req, res, next) => {
  const { user_id } = req.query || req.body;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  // Проверяем, что user_id это число
  const userId = parseInt(user_id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id must be a positive integer' });
  }
  
  req.validatedUserId = userId;
  next();
};

export const validateLogin = (req, res, next) => {
  const { login, password } = req.body;
  
  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }
  
  if (typeof login !== 'string' || login.trim().length === 0) {
    return res.status(400).json({ error: 'Login must be a non-empty string' });
  }
  
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password must be a non-empty string' });
  }
  
  next();
};

export const validateProgress = (req, res, next) => {
  const { user_id, xp_to_add, action } = req.body;
  
  if (!user_id || !xp_to_add) {
    return res.status(400).json({ error: 'user_id and xp_to_add required' });
  }
  
  const userId = parseInt(user_id);
  const xpToAdd = parseInt(xp_to_add);
  
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id must be a positive integer' });
  }
  
  if (isNaN(xpToAdd) || xpToAdd < 0) {
    return res.status(400).json({ error: 'xp_to_add must be a non-negative integer' });
  }
  
  req.validatedData = { userId, xpToAdd, action };
  next();
};

export const validateActivityParams = (req, res, next) => {
  const { user_id, year, month } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  
  const userId = parseInt(user_id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id must be a positive integer' });
  }
  
  // Валидация года и месяца (опционально)
  if (year) {
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({ error: 'year must be between 2020 and 2030' });
    }
  }
  
  if (month) {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' });
    }
  }
  
  req.validatedParams = { userId, year: year ? parseInt(year) : null, month: month ? parseInt(month) : null };
  next();
};

export const validateClient = (req, res, next) => {
  const { name, email, message, company } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }
  
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name must be a non-empty string' });
  }
  
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'email must be a valid email address' });
  }
  
  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }
  
  next();
};

// Rate limiting middleware (простая реализация)
const requestCounts = new Map();

export const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 минут
  const maxRequests = 100; // максимум 100 запросов за 15 минут
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const userRequests = requestCounts.get(ip);
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + windowMs;
    } else {
      userRequests.count++;
      
      if (userRequests.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests, please try again later' });
      }
    }
  }
  
  next();
}; 