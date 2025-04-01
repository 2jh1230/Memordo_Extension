chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['trackingEnabled'], (result) => {
    if (typeof result.trackingEnabled === 'undefined') {
      chrome.storage.sync.set({ trackingEnabled: true }, () => {
        console.log('[memordo] trackingEnabled 초기값 설정됨: true');
      });
    }
  });
});

// 탭 변경 시 실행
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url.startsWith('http')) return;

  chrome.storage.sync.get(['trackingEnabled', 'visitedUrls'], (data) => {
    if (!data.trackingEnabled) return;

    const visited = data.visitedUrls || [];

    // URL 중복 확인
    const alreadyVisited = visited.some(entry => entry.url === tab.url);
    if (!alreadyVisited) {
      visited.push({
        url: tab.url,
        timestamp: new Date().toISOString()
      });
      chrome.storage.sync.set({ visitedUrls: visited });
      console.log('[memordo] URL 저장됨:', tab.url);
    }
  });
});

// 인증 토큰 받기
function getAuthToken(callback) {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      callback(token);
    }
  });
}

// Google Drive 업로드
function uploadToDrive(jsonData) {
  getAuthToken((token) => {
    const metadata = {
      name: `visited_urls_${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };

    const file = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + token }),
      body: form
    })
    .then(response => response.json())
    .then(data => console.log('파일 업로드 완료:', data))
    .catch(error => console.error('업로드 오류:', error));
  });
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadToDrive') {
    uploadToDrive(message.data);
  }
});
