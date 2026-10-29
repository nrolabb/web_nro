(() => {
  const panel = document.getElementById('password-panel');
  const form = document.getElementById('password-form');
  const status = document.getElementById('password-status');
  const submit = document.getElementById('submitPassword');
  const openPanel = () => { if (!panel.open) panel.showModal(); };
  document.getElementById('changePassword').addEventListener('click', openPanel);
  document.getElementById('closePassword').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => { if (event.target === panel) {
    const box = panel.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) panel.close();
  } });
  panel.addEventListener('close', () => { form.reset(); status.textContent = ''; });
  if (location.hash === '#change-password') openPanel();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    if (newPassword !== document.getElementById('confirmPassword').value) {
      status.textContent = 'Mật khẩu mới nhập lại không khớp.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Đang đổi mật khẩu...';
    try {
      const response = await fetch('/auth/changepassword', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({oldPassword, newPassword})
      });
      if (response.redirected) { location.href = '/login'; return; }
      if (!response.ok) throw new Error('request failed');
      const result = await response.json();
      status.textContent = result.message;
      if (!result.error) {
        form.reset();
        status.textContent += ' Vui lòng đăng nhập lại.';
        setTimeout(() => { location.href = '/login'; }, 1500);
        return;
      }
    } catch (_) { status.textContent = 'Không thể đổi mật khẩu. Vui lòng thử lại.'; }
    submit.disabled = false;
  });
  document.getElementById('activeAccount').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const message = document.getElementById('account-status');
    try {
      const response = await fetch('/active', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (response.redirected) { location.href = '/login'; return; }
      const result = await response.json();
      message.textContent = result.message;
    } catch (_) { message.textContent = 'Không thể mở thành viên. Vui lòng thử lại.'; }
    finally { button.disabled = false; }
  });
})();
