import * as fs from 'node:fs';
import path from 'node:path';
import * as c from 'node:crypto';
import {canonical,hash,nonce,keys,sign,valid,encrypt,decrypt,seal,unseal} from './crypto.mjs';
import {embed,extract,fingerprint} from './watermark.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,canonical(x),{mode:0o600});};
const id=x=>{if(typeof x!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(x)) throw Error('Invalid identifier');return x;};
export class Vault {
  constructor(root){this.root=path.resolve(root);this.offline=new Set();this.now=()=>new Date();}
  p(...parts){return path.join(this.root,...parts);}
  init(){
    if(fs.existsSync(this.p('trust.json'))) throw Error('State already initialized');
    const identities={};
    for(const user of ['alice','bob','mallory']){
      const s=keys('ml-dsa-65'),k=keys('ml-kem-768');
      write(this.p('private',user+'.json'),{sign:s.privateKey,kem:k.privateKey});
      identities[user]={sign:s.publicKey,kem:k.publicKey,device:user+'-device',role:user==='mallory'?'guest':'officer'};
    }
    const validators={};
    for(let i=0;i<4;i++){const k=keys('ml-dsa-65');validators[i]=k.publicKey;write(this.p('private','validator-'+i+'.json'),k.privateKey);write(this.p('replicas',i+'.json'),[]);}
    const broker=keys('ml-kem-768');write(this.p('private','broker.json'),broker.privateKey);
    write(this.p('trust.json'),{schema:1,identities,validators,broker:broker.publicKey});
    write(this.p('checkpoint.json'),{height:0,head:'0'.repeat(64)});
    write(this.p('policy.json'),{revoked:[],policyVersion:'exercise-1'});
  }
  trust(){return read(this.p('trust.json'));}
  checkpoint(){return read(this.p('checkpoint.json'));}
  verify(trust=this.trust(),checkpoint=this.checkpoint()){
    const good=[];
    for(let i=0;i<4;i++){
      try {const chain=read(this.p('replicas',i+'.json'));this.verifyChain(chain,trust,checkpoint);good.push(chain);} catch {}
    }
    if(good.length<3) throw Error('Fewer than 3 intact replicas at trusted checkpoint');
    return good[0];
  }
  verifyChain(chain,trust,checkpoint){
    let prev='0'.repeat(64); const sessions=new Set();
    for(let i=0;i<chain.length;i++){
      const {body,hash:digest,certificate}=chain[i];
      if(body.height!==i+1||body.previous!==prev||hash(body)!==digest)throw Error('Broken chain');
      if(new Set(certificate.map(s=>s.validator)).size!==certificate.length)throw Error('Duplicate validator');
      if(certificate.filter(s=>valid(body,s.signature,trust.validators[s.validator])).length<3)throw Error('Invalid quorum');
      const {record,recipientSignature}=body.event;
      if(!valid(record,recipientSignature,trust.identities[record.recipient]?.sign))throw Error('Invalid recipient signature');
      if(record.type==='release') {if(sessions.has(record.session))throw Error('Session replay');sessions.add(record.session);}
      if(record.type==='ack'&&!sessions.has(record.session))throw Error('Orphan acknowledgement');
      prev=digest;
    }
    if(chain.length!==checkpoint.height||prev!==checkpoint.head)throw Error('Checkpoint mismatch / truncation');
  }
  commit(record,recipientSignature){
    const trust=this.trust(),chain=this.verify();
    if(!valid(record,recipientSignature,trust.identities[record.recipient]?.sign))throw Error('Invalid recipient signature');
    if(record.type==='release'&&chain.some(b=>b.body.event.record.type==='release'&&b.body.event.record.session===record.session))throw Error('Session replay');
    const available=[0,1,2,3].filter(i=>!this.offline.has(i));
    if(available.length<3)throw Error('Ledger quorum unavailable; release blocked');
    const body={height:chain.length+1,previous:chain.at(-1)?.hash??'0'.repeat(64),event:{record,recipientSignature}};
    const certificate=available.map(i=>({validator:String(i),signature:sign(body,read(this.p('private','validator-'+i+'.json')))}));
    const block={body,hash:hash(body),certificate};
    // Single-process coordinator, NOT an implementation of distributed BFT consensus.
    for(const i of available)write(this.p('replicas',i+'.json'),[...chain,block]);
    write(this.p('checkpoint.json'),{height:body.height,head:block.hash});
    return block;
  }
  distribute(doc,text,allowed=['alice','bob']){
    id(doc);if(fs.existsSync(this.p('documents',doc+'.json')))throw Error('Document already exists');
    if(!allowed.length||allowed.some(u=>!this.trust().identities[u]))throw Error('Unknown recipient');
    const aad={doc,version:1,classification:'SYNTHETIC',authority:'exercise-order-001',allowed};
    const key=c.randomBytes(32),content=encrypt(Buffer.from(text),key,aad);
    const brokerEnvelope=seal(key,this.trust().broker,aad);key.fill(0);
    write(this.p('documents',doc+'.json'),{aad,content,brokerEnvelope,sourceHash:hash(Buffer.from(text))});
    return aad;
  }
  release(doc,user,device,{session=nonce(),expiresAt,role='officer'}={}){
    id(doc);id(user);
    const d=read(this.p('documents',doc+'.json')),trust=this.trust(),policy=read(this.p('policy.json'));
    const who=trust.identities[user];
    if(!who||!d.aad.allowed.includes(user)||policy.revoked.includes(user)||who.role!==role||device!==who.device)throw Error('Access denied');
    const expiry=expiresAt??new Date(this.now().getTime()+60000).toISOString();
    if(!Number.isFinite(Date.parse(expiry))||Date.parse(expiry)<=this.now().getTime())throw Error('Authority expired');
    const sourceKey=unseal(d.brokerEnvelope,read(this.p('private','broker.json')),d.aad);
    let text;try{text=decrypt(d.content,sourceKey,d.aad).toString('utf8');}finally{sourceKey.fill(0);}
    const output=embed(text,session);
    const record={type:'release',schema:1,session,doc,version:d.aad.version,recipient:user,device,authority:d.aad.authority,policyVersion:policy.policyVersion,sourceHash:d.sourceHash,outputHash:fingerprint(output),time:this.now().toISOString(),expiresAt:expiry,clockAssurance:'local-host-clock-unattested',suite:'ML-DSA-65'};
    const recipientSignature=sign(record,read(this.p('private',user+'.json')).sign);
    const aad={doc,session,recipient:user,outputHash:record.outputHash};
    const encrypted=seal(Buffer.from(output),who.kem,aad);
    const block=this.commit(record,recipientSignature);
    // Return only after a valid quorum certificate has been durably written.
    return {aad,encrypted,receipt:block};
  }
  receive(pkg,user){
    id(user);if(pkg.aad.recipient!==user)throw Error('Wrong recipient');
    const chain=this.verify(),block=chain.find(b=>b.hash===pkg.receipt.hash);
    if(!block||block.body.event.record.type!=='release')throw Error('Uncommitted release');
    const r=block.body.event.record;
    if(r.recipient!==user||r.session!==pkg.aad.session||r.doc!==pkg.aad.doc||r.outputHash!==pkg.aad.outputHash)throw Error('Receipt binding mismatch');
    if(Date.parse(r.expiresAt)<=this.now().getTime())throw Error('Release expired');
    const text=unseal(pkg.encrypted,read(this.p('private',user+'.json')).kem,pkg.aad).toString('utf8');
    if(fingerprint(text)!==r.outputHash||extract(text)!==r.session)throw Error('Output binding mismatch');
    const ack={type:'ack',schema:1,session:r.session,doc:r.doc,recipient:user,releaseHash:block.hash,outputHash:r.outputHash,time:this.now().toISOString()};
    const signature=sign(ack,read(this.p('private',user+'.json')).sign);
    this.commit(ack,signature);return text;
  }
  open(doc,user,device){return this.receive(this.release(doc,user,device),user);}
  revoke(user){id(user);const policy=read(this.p('policy.json'));policy.revoked=[...new Set([...policy.revoked,user])];write(this.p('policy.json'),policy);}
  investigate(text,trust=this.trust(),checkpoint=this.checkpoint()){
    const session=extract(text),chain=this.verify(trust,checkpoint);
    const block=chain.find(b=>b.body.event.record.type==='release'&&b.body.event.record.session===session);
    if(!block)throw Error('Unknown session; attribution inconclusive');
    const r=block.body.event.record;
    if(fingerprint(text)!==r.outputHash)throw Error('Content changed or watermark transplanted; attribution inconclusive');
    return {finding:'Exact issued copy matched',recipient:r.recipient,session,document:r.doc,device:r.device,authority:r.authority,releaseTime:r.time,acknowledged:chain.some(b=>b.body.event.record.type==='ack'&&b.body.event.record.releaseHash===block.hash),receipt:block,checkpoint,limitations:'Identifies the issued copy and signing credential. Does not prove who physically leaked it. Trust and checkpoint must be independently pinned.'};
  }
}
