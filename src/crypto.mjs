import * as c from 'node:crypto';
export const canonical = x => JSON.stringify(x, (_k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export const hash = x => c.createHash('sha256').update(typeof x === 'string' || Buffer.isBuffer(x) ? x : canonical(x)).digest('hex');
export const nonce = () => c.randomBytes(16).toString('hex');
export function keys(type) {
  const p = c.generateKeyPairSync(type);
  return {publicKey:p.publicKey.export({type:'spki',format:'pem'}), privateKey:p.privateKey.export({type:'pkcs8',format:'pem'})};
}
export const sign = (x,key) => c.sign(null,Buffer.from(canonical(x)),key).toString('base64');
export function valid(x,sig,key) { try { return c.verify(null,Buffer.from(canonical(x)),key,Buffer.from(sig,'base64')); } catch { return false; } }
export function encrypt(data,key,aad) {
  const iv=c.randomBytes(12), e=c.createCipheriv('aes-256-gcm',key,iv);
  e.setAAD(Buffer.from(canonical(aad)));
  return {iv:iv.toString('base64'),ciphertext:Buffer.concat([e.update(data),e.final()]).toString('base64'),tag:e.getAuthTag().toString('base64')};
}
export function decrypt(box,key,aad) {
  const d=c.createDecipheriv('aes-256-gcm',key,Buffer.from(box.iv,'base64'));
  d.setAAD(Buffer.from(canonical(aad))); d.setAuthTag(Buffer.from(box.tag,'base64'));
  return Buffer.concat([d.update(Buffer.from(box.ciphertext,'base64')),d.final()]);
}
export function seal(data,publicKey,aad) {
  const {sharedKey,ciphertext}=c.encapsulate(c.createPublicKey(publicKey));
  const key=Buffer.from(c.hkdfSync('sha256',sharedKey,Buffer.alloc(0),Buffer.from('VAJRA-v1-ML-KEM-768-envelope'),32));
  const box={...encrypt(data,key,aad),kem:ciphertext.toString('base64'),suite:'ML-KEM-768/HKDF-SHA256/AES-256-GCM'};
  sharedKey.fill(0); key.fill(0); return box;
}
export function unseal(box,privateKey,aad) {
  if(box.suite!=='ML-KEM-768/HKDF-SHA256/AES-256-GCM') throw Error('Unsupported suite');
  const shared=c.decapsulate(c.createPrivateKey(privateKey),Buffer.from(box.kem,'base64'));
  const key=Buffer.from(c.hkdfSync('sha256',shared,Buffer.alloc(0),Buffer.from('VAJRA-v1-ML-KEM-768-envelope'),32));
  try { return decrypt(box,key,aad); } finally { shared.fill(0); key.fill(0); }
}
