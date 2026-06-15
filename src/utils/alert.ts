import { Platform, Alert } from 'react-native';

function injectWebAlertStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('funxon-alert-styles')) return;

  const style = document.createElement('style');
  style.id = 'funxon-alert-styles';
  style.textContent = `
    .funxon-alert-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: funxonAlertFadeIn 0.15s ease-out;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .funxon-alert-box {
      background: #ffffff;
      border-radius: 16px;
      padding: 28px 24px 20px;
      max-width: 380px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      animation: funxonAlertSlideIn 0.2s ease-out;
      text-align: center;
    }
    .funxon-alert-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #123f5c;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    .funxon-alert-message {
      font-size: 14px;
      color: #000000;
      margin-bottom: 22px;
      line-height: 1.5;
    }
    .funxon-alert-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .funxon-alert-btn {
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: transform 0.08s, opacity 0.15s;
      min-width: 100px;
    }
    .funxon-alert-btn:active { transform: scale(0.97); }
    .funxon-alert-btn-primary {
      background: #123f5c;
      color: #ffffff;
    }
    .funxon-alert-btn-primary:hover { opacity: 0.92; }
    .funxon-alert-btn-cancel {
      background: #f7f5f0;
      color: #123f5c;
    }
    .funxon-alert-btn-cancel:hover { background: #ede9e2; }
    .funxon-alert-btn-destructive {
      background: #ff0000;
      color: #ffffff;
    }
    .funxon-alert-btn-destructive:hover { opacity: 0.92; }
    @keyframes funxonAlertFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes funxonAlertSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `;
  document.head.appendChild(style);
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: Array<{ text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }>
) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  if (typeof document === 'undefined') return;
  injectWebAlertStyles();

  // Remove any existing alert
  const existing = document.getElementById('funxon-alert-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'funxon-alert-container';

  const overlay = document.createElement('div');
  overlay.className = 'funxon-alert-overlay';

  const box = document.createElement('div');
  box.className = 'funxon-alert-box';

  const titleEl = document.createElement('div');
  titleEl.className = 'funxon-alert-title';
  titleEl.textContent = title;
  box.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement('div');
    msgEl.className = 'funxon-alert-message';
    msgEl.textContent = message;
    box.appendChild(msgEl);
  }

  const btnRow = document.createElement('div');
  btnRow.className = 'funxon-alert-buttons';

  const btnDefs = buttons?.length ? buttons : [{ text: 'OK', style: 'default' as const }];

  btnDefs.forEach((btn) => {
    const btnEl = document.createElement('button');
    btnEl.className = 'funxon-alert-btn';
    if (btn.style === 'cancel') btnEl.classList.add('funxon-alert-btn-cancel');
    else if (btn.style === 'destructive') btnEl.classList.add('funxon-alert-btn-destructive');
    else btnEl.classList.add('funxon-alert-btn-primary');
    btnEl.textContent = btn.text;
    btnEl.addEventListener('click', () => {
      container.remove();
      btn.onPress?.();
    });
    btnRow.appendChild(btnEl);
  });

  box.appendChild(btnRow);
  overlay.appendChild(box);
  container.appendChild(overlay);
  document.body.appendChild(container);
}
