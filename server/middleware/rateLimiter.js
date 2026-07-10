const rateLimit = {};

// Clean up memory every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const ip in rateLimit) {
    if (now - rateLimit[ip].resetTime > 0) {
      delete rateLimit[ip];
    }
  }
}, 5 * 60 * 1000);

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
  const max = options.max || 100; // limit each IP to 100 requests per windowMs

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!rateLimit[ip]) {
      rateLimit[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (now > rateLimit[ip].resetTime) {
      rateLimit[ip].count = 1;
      rateLimit[ip].resetTime = now + windowMs;
      return next();
    }

    rateLimit[ip].count++;

    if (rateLimit[ip].count > max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      });
    }

    next();
  };
};

module.exports = rateLimiter;
