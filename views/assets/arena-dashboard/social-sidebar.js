(() => {
 const modal=document.getElementById('serverGiftcodeModal'),open=document.getElementById('serverGiftcodeOpen'),close=document.getElementById('serverGiftcodeClose');
 const list=document.getElementById('serverGiftcodeList'),select=document.getElementById('serverGiftcodeCharacter'),notice=document.getElementById('serverGiftcodeNotice'),status=document.getElementById('serverGiftcodeStatus');
 let data=null,version=0,previousOverflow='';
 function render(){
  list.replaceChildren();
  const character=data.characters.find(p=>String(p.id)===select.value);
  notice.textContent=!data.loggedIn?'Đăng nhập để xem trạng thái nhận Giftcode.':!character?'Bạn chưa tạo nhân vật trong game.':'Trạng thái theo dữ liệu nhân vật đã được server lưu. Bấm Làm mới để cập nhật.';
  if(!data.codes.length){list.textContent='Server chưa có Giftcode.';return;}
  for(const gift of data.codes){
   const row=document.createElement('div');row.className='server-giftcode-row';
   const info=document.createElement('div');info.className='server-giftcode-info';
   const code=document.createElement('span');code.className='server-giftcode-code';code.textContent=gift.code;
   const state=document.createElement('span');state.className='server-giftcode-state';
   const claimed=character?.claimed?.includes(gift.code);
   state.textContent=!data.loggedIn?'Đăng nhập để xem trạng thái':!character?'Chưa có nhân vật':character.claimed===null?'Chưa xác định trạng thái':claimed?'Đã nhận':'Chưa nhận';
   if(claimed)state.classList.add('claimed');
   const availability=document.createElement('span');availability.className='server-giftcode-expiry';
   const expired=gift.expiresAt && Number(gift.expiresAt)<Date.now();
   availability.textContent=expired?'Đã hết hạn':Number(gift.count_left)===0?'Đã hết lượt':Number(gift.count_left)===-1?'Không giới hạn lượt':`Còn ${Number(gift.count_left).toLocaleString('vi-VN')} lượt`;
   info.append(code,state,availability);
   const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.setAttribute('aria-label','Sao chép '+gift.code);
   copy.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(gift.code);status.textContent='Đã sao chép '+gift.code;}
    catch(_){const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(code);selection.removeAllRanges();selection.addRange(range);status.textContent='Mã đã được chọn. Nhấn Ctrl+C hoặc giữ để sao chép.';}
   });
   row.append(info,copy);list.append(row);
  }
 }
 async function load(){
  const request=++version;status.textContent='Đang tải...';
  try{
   const response=await fetch('/api/giftcodes',{cache:'no-store'});const result=await response.json();
   if(!response.ok||result.error)throw new Error(result.message||'Không tải được Giftcode.');
   if(request!==version)return;
   data=result;const previous=select.value;select.replaceChildren();
   for(const p of data.characters){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}
   if(data.characters.some(p=>String(p.id)===previous))select.value=previous;
   document.getElementById('serverGiftcodeCharacterLabel').hidden=!data.characters.length;
   status.textContent='';render();
  }catch(error){if(request===version){list.replaceChildren();status.textContent=error.message;}}
 }
 function dismiss(){modal.hidden=true;++version;document.body.style.overflow=previousOverflow;open.focus();}
 open.addEventListener('click',()=>{if(!modal.hidden)return;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.hidden=false;close.focus();load();});
 close.addEventListener('click',dismiss);modal.addEventListener('click',event=>{if(event.target===modal)dismiss();});
 document.getElementById('serverGiftcodeRefresh').addEventListener('click',load);select.addEventListener('change',render);
 modal.addEventListener('keydown',event=>{
  if(event.key==='Escape')dismiss();
  if(event.key==='Tab'){const nodes=[...modal.querySelectorAll('button,select')].filter(n=>!n.closest('[hidden]'));const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 });
})();
