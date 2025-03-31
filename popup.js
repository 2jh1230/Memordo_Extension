document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('tracking-toggle');
  
    // 초기 상태 로드
    chrome.storage.sync.get(['trackingEnabled'], (result) => {
      const isEnabled = result.trackingEnabled ?? true;
      toggle.checked = isEnabled;
    });
  
    // 상태 변경 시 저장
    toggle.addEventListener('change', () => {
      const isChecked = toggle.checked;
      chrome.storage.sync.set({ trackingEnabled: isChecked });
    });
  });
