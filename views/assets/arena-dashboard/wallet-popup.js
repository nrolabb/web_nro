(() => {
let userDonnetPoints=0, exchangeHistory=[], currentReceiveCode='', receiveCodeSecondsLeft=60, receiveCodeInterval=null;
let storageKey='', hiddenHistory=new Set();
let expiresAt=0, busy=false, pending=null, requestId='', previousFocus=null, viewVersion=0, receivedSince=0, pollTick=0;
const modal=document.getElementById('userFeaturesModal');
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,body){
 const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 if(r.redirected){location.href='/login';throw new Error('Vui lòng đăng nhập lại.');}
 const data=await r.json(); if(!r.ok||data.error){const e=new Error(data.message||'Không tải được ví. Vui lòng thử lại.');e.status=r.status;throw e;} return data;
}
async function refresh(){
 const data=await api('/wallet/data');userDonnetPoints=Number(data.balance);requestId=data.requestId;
 storageKey='wallet-hidden-'+data.accountId;try{hiddenHistory=new Set(JSON.parse(localStorage.getItem(storageKey)||'[]'));}catch(_){}
 exchangeHistory=data.transactions.filter(item=>!hiddenHistory.has(item.id)).map(item=>({...item,targetCode:escapeHtml(item.targetCode),note:escapeHtml(item.note),time:escapeHtml(item.time)}));
 const balance=document.getElementById('header-user-vnd');if(balance)balance.textContent=userDonnetPoints.toLocaleString('vi-VN');
}
async function launch(event){
 if(event){event.preventDefault();previousFocus=event.currentTarget;}
 document.querySelector('.user-capsule')?.removeAttribute('open');
 modal.classList.remove('hidden');document.body.classList.add('modal-open');
 const version=++viewVersion;
 document.getElementById('userFeatureModalTitle').textContent='VÍ CÁ NHÂN';
 document.getElementById('userFeatureModalBody').textContent='Đang tải...';
 try{await refresh();if(version===viewVersion){openUserModal('wallet');modal.querySelector('.close-btn').focus();}}catch(e){if(version===viewVersion)document.getElementById('userFeatureModalBody').textContent=e.message;}
}
function openUserModal(type,event){
 if(event)event.stopPropagation();clearInterval(receiveCodeInterval);++viewVersion;
 const titleEl=document.getElementById('userFeatureModalTitle'),bodyEl=document.getElementById('userFeatureModalBody');
                titleEl.innerHTML = '<i class="fa-solid fa-wallet icon-green"></i> VÍ CÁ NHÂN';
                bodyEl.innerHTML = `
                    <div class="user-feature-content">
                        <div class="wallet-balance-box">
                            <div class="wallet-col wallet-col-full">
                                <span class="wallet-lbl"><i class="fa-solid fa-star" style="color: #ffd700; font-size: 0.82rem; margin-right: 4px;"></i> Điểm</span>
                                <span class="wallet-val color-gold">${userDonnetPoints.toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                        <div class="wallet-actions-grid">
                            <button class="btn-wallet-quick" onclick="openReceiveCodeModal(event)">
                                <i class="fa-solid fa-qrcode"></i> Mã nhận điểm
                            </button>
                            <button class="btn-wallet-quick" onclick="openTransferPointsModal(event)">
                                <i class="fa-solid fa-arrow-right-arrow-left"></i> Chuyển Điểm
                            </button>
                        </div>
                        <button class="btn-wallet-history" onclick="openExchangeHistoryModal(event)">
                            <i class="fa-solid fa-clock-rotate-left"></i> Lịch Sử Trao Đổi
                        </button>
                        <button class="btn-feature-action" onclick="closeUserModal()">ĐÓNG</button>
                    </div>
                `;
}
function closeUserModal(){if(busy)return;clearInterval(receiveCodeInterval);++viewVersion;modal.classList.add('hidden');document.body.classList.remove('modal-open');previousFocus?.focus();}
async function openReceiveCodeModal(event){
 if(event)event.stopPropagation();clearInterval(receiveCodeInterval);const version=++viewVersion;
 try{const data=await api('/wallet/code',{});if(version!==viewVersion)return;currentReceiveCode=data.code;expiresAt=Date.now()+data.remainingMs;receiveCodeSecondsLeft=Math.ceil(data.remainingMs/1000);if(!receivedSince)receivedSince=Number(data.now)||Date.now();renderReceiveCodeView();startReceiveCodeCountdown();}catch(e){alert(e.message);}
}
// While the code is on screen, poll for incoming transfers so the receiver
// sees the points arrive instead of an unchanged screen.
async function pollReceived(){
 try{
  const r=await fetch('/wallet/received?since='+receivedSince,{cache:'no-store'});if(!r.ok||r.redirected)return;
  const data=await r.json();if(data.error)return;
  if(data.items?.length){
   receivedSince=Math.max(receivedSince,...data.items.map(i=>i.at));
   if(Number.isFinite(data.balance)){userDonnetPoints=data.balance;const b=document.getElementById('header-user-vnd');if(b)b.textContent=userDonnetPoints.toLocaleString('vi-VN');}
   const box=document.getElementById('receiveNotice');
   if(box){box.hidden=false;box.innerHTML=data.items.map(i=>`<div><i class="fa-solid fa-circle-check"></i> Đã nhận <strong>+${Number(i.amount).toLocaleString('vi-VN')}</strong> điểm từ <strong>${escapeHtml(i.from)}</strong>${i.note?` – “${escapeHtml(i.note)}”`:''}</div>`).join('')+box.innerHTML;}
   refresh().catch(()=>{});
  }
 }catch(_){}
}
function startReceiveCodeCountdown(){
 clearInterval(receiveCodeInterval);pollTick=0;receiveCodeInterval=setInterval(()=>{
  receiveCodeSecondsLeft=Math.max(0,Math.ceil((expiresAt-Date.now())/1000));
  const timer=document.getElementById('receiveCodeTimer'),bar=document.getElementById('receiveCodeProgressBar');
  if(timer)timer.innerText=receiveCodeSecondsLeft+'s';if(bar)bar.style.width=(receiveCodeSecondsLeft/60*100)+'%';
  if(++pollTick%12===0)pollReceived();
  if(receiveCodeSecondsLeft===0){clearInterval(receiveCodeInterval);openReceiveCodeModal();}
 },250);
}
        function renderReceiveCodeView() {
            const titleEl = document.getElementById('userFeatureModalTitle');
            const bodyEl = document.getElementById('userFeatureModalBody');
            titleEl.innerHTML = '<i class="fa-solid fa-qrcode icon-gold"></i> MÃ NHẬN ĐIỂM (60s)';
            bodyEl.innerHTML = `
                <div class="user-feature-content">
                    <p class="feature-sub-desc" style="text-align: center; margin-bottom: 12px;">Đưa mã số ví này cho người chuyển điểm để họ chuyển điểm vào ví của bạn:</p>
                    <div class="receive-code-box">
                        <span class="receive-code-label">MÃ SỐ VÍ TẠM THỜI</span>
                        <div class="receive-code-display">
                            <span class="code-digits">${currentReceiveCode}</span>
                            <button class="btn-copy-code" onclick="navigator.clipboard.writeText('${currentReceiveCode}'); alert('Đã sao chép mã số ví: ${currentReceiveCode}');">
                                <i class="fa-solid fa-copy"></i> SAO CHÉP
                            </button>
                        </div>
                        <div class="receive-code-countdown-wrap">
                            <div class="countdown-text"><i class="fa-solid fa-clock-rotate-left"></i> Mã tự động làm mới sau: <strong id="receiveCodeTimer">${receiveCodeSecondsLeft}s</strong></div>
                            <div class="countdown-bar-bg">
                                <div class="countdown-bar-fill" id="receiveCodeProgressBar" style="width: ${(receiveCodeSecondsLeft / 60) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div id="receiveNotice" class="receive-notice" role="status" aria-live="polite" hidden></div>
                    <div class="wallet-actions-grid" style="margin-top: 14px;">
                        <button class="btn-wallet-quick" onclick="openReceiveCodeModal(event);">
                            <i class="fa-solid fa-rotate"></i> Tạo Mã Mới
                        </button>
                        <button class="btn-wallet-quick" onclick="openUserModal('wallet');">
                            <i class="fa-solid fa-arrow-left"></i> Quay Lại Ví
                        </button>
                    </div>
                </div>
            `;
        }

        function openTransferPointsModal(event) {
            ++viewVersion;clearInterval(receiveCodeInterval);
            if(pending){executeTransferPoints();return;}
            if (event) event.stopPropagation();
            if (receiveCodeInterval) clearInterval(receiveCodeInterval);
            const titleEl = document.getElementById('userFeatureModalTitle');
            const bodyEl = document.getElementById('userFeatureModalBody');
            titleEl.innerHTML = '<i class="fa-solid fa-arrow-right-arrow-left icon-green"></i> CHUYỂN ĐIỂM';
            bodyEl.innerHTML = `
                <div class="user-feature-content">
                    <div class="points-balance-card" style="margin-bottom: 14px;">
                        <span class="points-label">Số dư hiện tại</span>
                        <span class="points-amount">${userDonnetPoints.toLocaleString('vi-VN')} Điểm</span>
                    </div>
                    <div class="form-group-feature">
                        <label>Mã số ví người nhận (Mã nhận điểm):</label>
                        <input type="text" id="transferTargetWalletCode" class="feature-input" placeholder="Nhập mã ví 6 số (VD: ${currentReceiveCode || '839215'})..." maxlength="6" inputmode="numeric">
                    </div>
                    <div class="form-group-feature">
                        <label>Số điểm muốn chuyển:</label>
                        <input type="number" id="transferAmountInput" class="feature-input" placeholder="Nhập số điểm muốn chuyển..." value="50000">
                    </div>
                    <div class="form-group-feature">
                        <label>Lời nhắn (tùy chọn):</label>
                        <input type="text" id="transferNoteInput" maxlength="150" class="feature-input" placeholder="Ghi chú kèm theo...">
                    </div>
                    <button class="btn-feature-action btn-gold-action" style="margin-top: 10px;" onclick="executeTransferPoints()">
                        <i class="fa-solid fa-paper-plane"></i> XÁC NHẬN CHUYỂN ĐIỂM
                    </button>
                    <button class="btn-feature-action" style="margin-top: 8px;" onclick="openUserModal('wallet')">QUAY LẠI VÍ</button>
                </div>
            `;
        }


async function executeTransferPoints(){
 if(busy)return;
 if(!pending){
  const code=document.getElementById('transferTargetWalletCode').value.trim();
  const amount=Number(document.getElementById('transferAmountInput').value);
  const note=document.getElementById('transferNoteInput').value.trim();
  if(!/^\d{6}$/.test(code)||!Number.isSafeInteger(amount)||amount<1||amount>2147483647||note.length>150){alert('Nhập mã ví 6 số, số điểm nguyên dương và lời nhắn tối đa 150 ký tự.');return;}
  if(amount>userDonnetPoints){alert('Số điểm không đủ.');return;}
  // Step 1: verify the code is still valid and find out who will receive the points.
  busy=true;let check;
  try{check=await api('/wallet/code/check',{code});}
  catch(e){alert(e.message);return;}
  finally{busy=false;}
  const reqId = (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&0x3|0x8)).toString(16);}));
  pending={recipientCode:code,amount,note,requestId:reqId,recipient:check.recipient,confirmUntil:Date.now()+check.remainingMs};
 }
 // Step 2: re-authenticate with the account password.
 const version=++viewVersion;clearInterval(receiveCodeInterval);
 const body=document.getElementById('userFeatureModalBody');
 body.innerHTML=`<div class="user-feature-content"><div class="points-balance-card" style="margin-bottom:12px"><span class="points-label">Người nhận (mã ${escapeHtml(pending.recipientCode)})</span><span class="points-amount">${escapeHtml(pending.recipient||'')}</span></div><p class="feature-sub-desc">Chuyển <strong>${pending.amount.toLocaleString('vi-VN')} Điểm</strong>${pending.note?` – “${escapeHtml(pending.note)}”`:''}</p><p class="feature-sub-desc" id="walletConfirmTimer"></p><form id="wallet-confirm"><div class="form-group-feature"><label for="walletPassword">Mật khẩu xác nhận:</label><input class="feature-input" type="password" id="walletPassword" autocomplete="current-password" maxlength="100" required></div><p id="walletResult" role="status" style="color:#ff5252;font-size:0.88rem;margin:8px 0;text-align:center;font-weight:600;"></p><button class="btn-feature-action btn-gold-action" type="submit">XÁC NHẬN CHUYỂN ĐIỂM</button><button class="btn-feature-action" type="button" id="walletBack" style="margin-top:8px">QUAY LẠI VÍ</button></form></div>`;
 const tick=()=>{const el=document.getElementById('walletConfirmTimer');if(!el||version!==viewVersion)return;const s=Math.max(0,Math.ceil((pending?.confirmUntil-Date.now())/1000));el.innerHTML=s>0?`<i class="fa-solid fa-clock"></i> Mã còn hiệu lực xác nhận: <strong>${s}s</strong>`:'<i class="fa-solid fa-triangle-exclamation"></i> Mã đã hết hạn. Hãy quay lại và lấy mã mới từ người nhận.';};
 tick();receiveCodeInterval=setInterval(tick,500);
 document.getElementById('walletBack').onclick=()=>{if(!busy){pending=null;openUserModal('wallet');}};
 document.getElementById('walletPassword').focus();
 document.getElementById('wallet-confirm').onsubmit=async event=>{
  event.preventDefault();if(busy)return;busy=true;const button=event.target.querySelector('[type=submit]');button.disabled=true;
  const passwordInput=document.getElementById('walletPassword');
  try{
   const result=await api('/wallet/transfer',{recipientCode:pending.recipientCode,amount:pending.amount,note:pending.note,requestId:pending.requestId,password:passwordInput.value});
   pending=null;userDonnetPoints=result.balance;busy=false;try{await refresh();}catch(_){}openUserModal('wallet');alert(result.message);
  }catch(e){
   document.getElementById('walletResult').textContent=e.message;
   if(e.status===400&&/Mật khẩu/.test(e.message)){passwordInput.value='';passwordInput.focus();}
   else if(e.status===400){button.textContent='QUAY LẠI ĐỂ NHẬP LẠI';button.onclick=event=>{event.preventDefault();pending=null;openTransferPointsModal();};}
   else button.textContent='THỬ LẠI';
  }
  finally{busy=false;button.disabled=false;}
 };
}
        function openExchangeHistoryModal(event) {
            ++viewVersion;
            if (event) event.stopPropagation();
            if (receiveCodeInterval) clearInterval(receiveCodeInterval);
            const titleEl = document.getElementById('userFeatureModalTitle');
            const bodyEl = document.getElementById('userFeatureModalBody');
            titleEl.innerHTML = '<i class="fa-solid fa-clock-rotate-left icon-yellow"></i> LỊCH SỬ TRAO ĐỔI ĐIỂM';

            let historyRowsHtml = '';
            if (exchangeHistory.length === 0) {
                historyRowsHtml = `
                    <div class="empty-history-box">
                        <i class="fa-solid fa-inbox empty-icon"></i>
                        <p>Không có lịch sử trao đổi nào.</p>
                    </div>
                `;
            } else {
                historyRowsHtml = exchangeHistory.map(item => {
                    const isRecv = item.type === 'receive';
                    const iconClass = isRecv ? 'fa-arrow-down-left' : 'fa-arrow-up-right';
                    const typeLabel = isRecv ? 'Nhận Điểm' : 'Chuyển Điểm';
                    const badgeClass = isRecv ? 'badge-recv' : 'badge-send';
                    const amountText = isRecv ? `+${item.amount.toLocaleString('vi-VN')}` : `-${item.amount.toLocaleString('vi-VN')}`;
                    const amountColor = isRecv ? 'color-recv' : 'color-send';
                    const noteHtml = item.note ? `
                        <div class="exchange-item-note">
                            <i class="fa-solid fa-quote-left"></i> ${item.note}
                        </div>
                    ` : '';

                    return `
                        <div class="exchange-history-card" id="historyCard_${item.id}">
                            <div class="exchange-card-select">
                                <input type="checkbox" class="history-checkbox" value="${item.id}" onchange="updateHistoryActionButtons()">
                            </div>
                            <div class="exchange-card-main">
                                <div class="exchange-card-header-row">
                                    <div class="exchange-type-tag ${badgeClass}">
                                        <i class="fa-solid ${iconClass}"></i> ${typeLabel}
                                    </div>
                                    <span class="exchange-amount ${amountColor}">${amountText} Điểm</span>
                                </div>
                                <div class="exchange-meta">
                                    <span class="exchange-code">Mã ví: <strong>${item.targetCode}</strong></span>
                                    <span class="exchange-time">${item.time}</span>
                                    <span class="exchange-status"><i class="fa-solid fa-circle-check"></i> ${item.status}</span>
                                </div>
                                ${noteHtml}
                            </div>
                            <button class="btn-delete-single" title="Xóa thông báo này" onclick="deleteSingleHistoryItem(${item.id})">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    `;
                }).join('');
            }

            bodyEl.innerHTML = `
                <div class="user-feature-content">
                    <!-- Batch Action Bar -->
                    <div class="history-action-bar">
                        <label class="select-all-label">
                            <input type="checkbox" id="selectAllHistoryCheckbox" onchange="toggleSelectAllHistory(this.checked)" ${exchangeHistory.length === 0 ? 'disabled' : ''}>
                            Chọn tất cả
                        </label>
                        <div class="history-btn-group">
                            <button class="btn-history-action btn-del-selected" id="btnDeleteSelected" onclick="deleteSelectedHistory()" disabled>
                                <i class="fa-solid fa-trash-can"></i> Xóa đã chọn (<span id="selectedCount">0</span>)
                            </button>
                            <button class="btn-history-action btn-del-all" onclick="clearAllHistory()" ${exchangeHistory.length === 0 ? 'disabled' : ''}>
                                <i class="fa-solid fa-broom"></i> Xóa tất cả
                            </button>
                        </div>
                    </div>

                    <!-- Scrollable History List -->
                    <div class="exchange-history-list">
                        ${historyRowsHtml}
                    </div>

                    <button class="btn-feature-action" style="margin-top: 15px;" onclick="openUserModal('wallet')">QUAY LẠI VÍ</button>
                </div>
            `;
        }

        function toggleSelectAllHistory(checked) {
            const checkboxes = document.querySelectorAll('.history-checkbox');
            checkboxes.forEach(cb => cb.checked = checked);
            updateHistoryActionButtons();
        }

        function updateHistoryActionButtons() {
            const checkboxes = document.querySelectorAll('.history-checkbox');
            const selected = Array.from(checkboxes).filter(cb => cb.checked);
            const btn = document.getElementById('btnDeleteSelected');
            const countEl = document.getElementById('selectedCount');
            const selectAllCb = document.getElementById('selectAllHistoryCheckbox');

            if (countEl) countEl.innerText = selected.length;
            if (btn) btn.disabled = selected.length === 0;
            if (selectAllCb) selectAllCb.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
        }

function hideHistory(ids){ids.forEach(id=>hiddenHistory.add(id));try{localStorage.setItem(storageKey,JSON.stringify([...hiddenHistory].slice(-1000)));}catch(_){}}
        function deleteSingleHistoryItem(id) {
            hideHistory([id]);
            exchangeHistory = exchangeHistory.filter(item => item.id !== id);
            openExchangeHistoryModal();
        }

        function deleteSelectedHistory() {
            const checkboxes = document.querySelectorAll('.history-checkbox:checked');
            const idsToDelete = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
            if (idsToDelete.length === 0) return;

            if (confirm(`Bạn có chắc chắn muốn xóa ${idsToDelete.length} thông báo đã chọn?`)) {
                hideHistory(idsToDelete);
                exchangeHistory = exchangeHistory.filter(item => !idsToDelete.includes(item.id));
                openExchangeHistoryModal();
            }
        }

        function clearAllHistory() {
            if (exchangeHistory.length === 0) return;
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trao đổi không?')) {
                hideHistory(exchangeHistory.map(item=>item.id));
                exchangeHistory = [];
                openExchangeHistoryModal();
            }
        }
Object.assign(window,{openUserModal,closeUserModal,openReceiveCodeModal,openTransferPointsModal,executeTransferPoints,openExchangeHistoryModal,toggleSelectAllHistory,updateHistoryActionButtons,deleteSingleHistoryItem,deleteSelectedHistory,clearAllHistory});
document.querySelectorAll('[data-wallet-open]').forEach(a=>a.addEventListener('click',launch));
const close=modal.querySelector('.close-btn');close.tabIndex=0;close.setAttribute('role','button');close.setAttribute('aria-label','Đóng');close.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')closeUserModal();});
modal.addEventListener('click',e=>{if(e.target===modal)closeUserModal();});
modal.addEventListener('keydown',e=>{
 if(e.key==='Escape')closeUserModal();
 if(e.key==='Tab'){const items=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
if(location.pathname.replace(/\/$/,'')==='/wallet')launch();
})();
