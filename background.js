// 탭 변경 시 실행
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url.startsWith('http')) return;
  
    chrome.storage.sync.get(['trackingEnabled', 'visitedUrls'], (data) => {
      if (!data.trackingEnabled) return;
  
      const visited = data.visitedUrls || [];
      if (!visited.includes(tab.url)) {
        visited.push(tab.url);
        chrome.storage.sync.set({ visitedUrls: visited });
        console.log('[memordo] URL 저장됨:', tab.url);
      }
    });
  });
  