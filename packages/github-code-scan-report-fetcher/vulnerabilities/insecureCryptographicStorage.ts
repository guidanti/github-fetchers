import * as crypto from 'crypto';
import fs from 'fs';

function storePassword(password: string) {
  // Insecure: Using MD5 for hashing
  const hash = crypto.createHash('md5').update(password).digest('hex');
  fs.writeFileSync('passwords.txt', `${hash}\n`, { flag: 'a' });
}
