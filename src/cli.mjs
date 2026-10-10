import * as fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Vault} from './core.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const vault=new Vault(process.env.VAJRA_STATE??'state');
const [command,...args]=process.argv.slice(2);
const out=path.resolve(process.env.VAJRA_OUTPUT??'demo-output');
function save(name,data){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name),data,{mode:0o600});}
try {
  vault.offline=new Set((process.env.VAJRA_OFFLINE_VALIDATORS??'').split(',').filter(Boolean).map(Number));
  switch(command){
    case 'init': vault.init(); console.log('Enrolled 3 synthetic identities and 4 logical validators.'); break;
    case 'distribute': console.log(vault.distribute(args[0],fs.readFileSync(args[1],'utf8'))); break;
    case 'open': {const text=vault.open(args[0],args[1],args[2]);save(args[1]+'-'+args[0]+'.txt',text);console.log('Committed release and acknowledgement; copy saved in '+out);break;}
    case 'revoke': vault.revoke(args[0]);console.log('Revoked future access for '+args[0]);break;
    case 'verify': console.log({valid:true,blocks:vault.verify().length,checkpoint:vault.checkpoint()});break;
    case 'investigate': {
      const trust=args[1]?JSON.parse(fs.readFileSync(args[1],'utf8')):vault.trust();
      const checkpoint=args[2]?JSON.parse(fs.readFileSync(args[2],'utf8')):vault.checkpoint();
      const report=vault.investigate(fs.readFileSync(args[0],'utf8'),trust,checkpoint);save('evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));break;
    }
    case 'demo': {
      if(fs.existsSync(vault.p('trust.json')))throw Error('Demo needs a fresh VAJRA_STATE directory; choose a new directory');
      vault.init();vault.distribute('briefing',fs.readFileSync(path.join(here,'../sample-data/briefing.txt'),'utf8'));
      for(const user of ['alice','bob'])save(user+'-briefing.txt',vault.open('briefing',user,user+'-device'));
      const report=vault.investigate(fs.readFileSync(path.join(out,'alice-briefing.txt'),'utf8'));
      save('evidence.json',JSON.stringify(report,null,2));save('trusted-keys.json',JSON.stringify(vault.trust(),null,2));save('auditor-checkpoint.json',JSON.stringify(vault.checkpoint(),null,2));
      console.log(JSON.stringify({finding:report.finding,recipient:report.recipient,acknowledged:report.acknowledged,blocks:vault.verify().length,output:out},null,2));break;
    }
    default: console.log('Usage: node src/cli.mjs init | distribute DOC FILE | open DOC USER DEVICE | revoke USER | verify | investigate FILE [TRUST CHECKPOINT] | demo');
  }
}catch(e){console.error(e.message);process.exitCode=1;}
