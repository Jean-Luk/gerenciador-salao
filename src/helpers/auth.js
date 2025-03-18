import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const SECRET = process.env.AUTH_SECRET

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (salt, password) => {
    const hmac = crypto.createHmac('sha256', Buffer.from([salt, password].join('/')))
    
    return hmac.update(SECRET, 'utf8').digest('hex')
}

