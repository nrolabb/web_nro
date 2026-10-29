const assert=require('node:assert/strict');
const route=require('../routes/game/spinControllers');
async function check(type, failReward, balance=20000) {
 const events=[];
 let result, status=200;
 const connection={
  beginTransaction:async()=>events.push('begin'),
  query:async(q,p)=>{
   if(q.startsWith('SELECT')) return [[{vnd:balance}]];
   if(q.startsWith('UPDATE')) {events.push(['debit',p[0],p[1]]);return [{affectedRows:1}];}
   if(q.startsWith('INSERT')) {events.push('reward');if(failReward)throw Error('simulated reward failure');return [{insertId:1}];}
   throw Error(q);
  },commit:async()=>events.push('commit'),rollback:async()=>events.push('rollback'),release:()=>events.push('release')
 };
 global.sql={query:(q,cb)=>cb(null,[{id:1,item_id:1,name:'Test item',quantity:1,item_options:'[]',ratio:1}]),promise:()=>({getConnection:async()=>connection})};
 await route.run({req:{body:{type}},user:{getInfo:async()=>[{id:1,username:'test',vnd:20000}]},res:{json:r=>{result=r;},status:n=>{status=n;return {json:r=>{result=r;}};}}});
 return {events,result,status};
}
(async()=>{
 for(const [type,cost,count] of [['x1',1000,1],['x10',9000,10]]) {
  const r=await check(type,false);assert.equal(r.result.error,false);assert.equal(r.result.newBalance,20000-cost);
  assert.equal(r.events.filter(e=>e==='reward').length,count);assert.equal(r.events.find(e=>Array.isArray(e))[1],cost);assert.ok(r.events.includes('commit'));
 }
 const fail=await check('x1',true);assert.equal(fail.result.error,true);assert.ok(fail.events.includes('rollback'));assert.ok(!fail.events.includes('commit'));
 const insufficient=await check('x10',false,0);assert.equal(insufficient.result.error,true);assert.ok(!insufficient.events.some(Array.isArray));assert.ok(!insufficient.events.includes('reward'));
 console.log('PASS: x1/x10 cost and rewards, rollback on reward failure, locked balance insufficient guard.');
})().catch(e=>{console.error(e);process.exitCode=1});
