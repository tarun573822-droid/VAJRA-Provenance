// Exact-copy UTF-8 demonstration. This channel does not survive sanitization or printing.
import {hash} from './crypto.mjs';
const START='\u2063\u2063', END='\u2064\u2064', ZERO='\u200b', ONE='\u200c';
export function embed(text,session) {
  if(!/^[0-9a-f]{32}$/.test(session)) throw Error('Invalid session');
  if(/[\u200b\u200c\u2063\u2064]/u.test(text)) throw Error('Source contains reserved watermark characters');
  const payload=Buffer.from(session,'hex');
  const bits=[...payload].map(v=>v.toString(2).padStart(8,'0')).join('');
  return text+START+[...bits].map(v=>v==='0'?ZERO:ONE).join('')+END;
}
export function extract(text) {
  const m=text.match(/\u2063\u2063([\u200b\u200c]{128})\u2064\u2064/gu);
  if(!m || m.length!==1) throw Error('No unique intact watermark; attribution inconclusive');
  const bits=[...m[0].slice(2,-2)].map(v=>v===ZERO?'0':'1').join('');
  return Buffer.from(bits.match(/.{8}/g).map(v=>parseInt(v,2))).toString('hex');
}
export const visible = text => text.replace(/[\u200b\u200c\u2063\u2064]/gu,'');
export const fingerprint = text => hash(Buffer.from(text,'utf8'));
