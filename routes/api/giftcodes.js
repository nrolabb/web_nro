const { verifySession } = require('../../middleware/auth.middleware');
function claimedCodes(raw) {
 if (raw === null || raw === '') return [];
 try { const values=typeof raw==='string'?JSON.parse(raw):raw; return Array.isArray(values)&&values.every(x=>typeof x==='string')?values:null; } catch (_) { return null; }
}
module.exports={name:'api/giftcodes',method:'GET',middleware:[],run:async({req,res,sql})=>{
 res.set('Cache-Control','no-store');
 try {
  const db=sql.promise();
  const [codes]=await db.query('SELECT id, code, count_left, UNIX_TIMESTAMP(expired)*1000 expiresAt FROM giftcode ORDER BY id DESC');
  let characters=[],loggedIn=false;
  const identity=verifySession(req);
  if(identity){
   const [accounts]=await db.query('SELECT id FROM account WHERE id=? AND username=? AND ban=0',[identity.sub,identity.username]);
   if(accounts.length){
    loggedIn=true;
    const [players]=await db.query('SELECT id,name,giftcode FROM player WHERE account_id=? ORDER BY id',[identity.sub]);
    characters=players.map(player=>({id:player.id,name:player.name,claimed:claimedCodes(player.giftcode)}));
   }
  }
  res.json({codes,characters,loggedIn});
 }catch(error){console.error('Giftcode list failed:',error.code||'database error');res.status(503).json({error:true,message:'Chưa tải được danh sách Giftcode. Vui lòng thử lại.'});}
}};
