"use strict";
import authService from '../../src/service/authService.js';
import jwt from 'jsonwebtoken';
import responseStatus from '../../util/responseStatus.js';
import jwtConfig from '../../../config/jwt.js';

class VerifyTokenMiddleware {
  constructor() {
    // this.publicKeyPath = "./config/public-key.pem";
  }

  async middleware(req, res, next) {
    console.log('Inside middleware...');
    const authHeader = req.headers.authorization;
    const { code, message } = responseStatus.getStatus('UNAUTHORIZED');
    if (!authHeader) {
      return res.status(code).json({ status: code, message, error: 'UNAUTHORIZED: Token is missing' });
    }
    const checkBlacklist = await authService.checkBlackListToken(authHeader);
    if (checkBlacklist) {
      return res.status(code).send({ status: code, message, error: 'This token is invalid or blacklist' });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, jwtConfig.JWT_SECRET, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      req.user = decoded;
      if (req.user.role !== 'driver') {
        return res.status(403).json({ status: 403, message: 'Forbidden: Only driver can access this.' });
      }
      next();
    } catch (error) {
      console.error('Token Verification Error:', error);
      return res.status(401).send({ status: 401, message: 'Unauthorized: Invalid token' });
    }
  }

}
export default new VerifyTokenMiddleware().middleware;
