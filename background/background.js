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

  chrome.storage.sync.get(['trackingEnabled'], (syncData) => {
    if (!syncData.trackingEnabled) return;

    chrome.storage.local.get(['visitedUrls'], (localData) => {
      const visited = localData.visitedUrls || [];

      // URL 중복 확인 (기본은 전체 URL 기준)
      const alreadyVisited = visited.some(entry => entry.url === tab.url);
      if (!alreadyVisited) {
        visited.push({
          url: tab.url,
          timestamp: new Date().toISOString()
        });

        // local에 저장
        chrome.storage.local.set({ visitedUrls: visited }, () => {
          console.log('[memordo] URL 저장됨:', tab.url);
        });
      }
    });
  });
});


// 인증 토큰 받기
function getAuthToken(callback) {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError || !token) {
      console.error('인증 오류:', chrome.runtime.lastError);
      return;
    }
    callback(token);
  });
}

// 폴더 확인 및 생성
async function getOrCreateFolder(token, folderName) {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  )}&fields=files(id,name)`;

  const response = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    console.error('폴더 검색 실패:', response.statusText);
    return null;
  }

  const data = await response.json();

  if (data.files.length > 0) {
    console.log('기존 폴더 사용:', data.files[0].id);
    return data.files[0].id;
  } else {
    // 폴더 생성
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    });

    if (!createResp.ok) {
      console.error('폴더 생성 실패:', createResp.statusText);
      return null;
    }

    const folder = await createResp.json();
    console.log('새 폴더 생성됨:', folder.id);
    return folder.id;
  }
}

// 드라이브 업로드 함수
async function uploadToDrive(jsonData) {
  return new Promise((resolve, reject) => {
    getAuthToken(async (token) => {
      try {
        const folderId = await getOrCreateFolder(token, 'memordo');
        if (!folderId) {
          reject(new Error('폴더 접근 실패'));
          return;
        }

        const metadata = {
          name: `visited_urls_${new Date().toISOString().split('T')[0]}.jsonl`,
          mimeType: 'application/jsonl',
          parents: [folderId],
        };

        const jsonl = jsonData.map((entry) => JSON.stringify(entry)).join('\n');
        const file = new Blob([jsonl], { type: 'application/jsonl' });

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const uploadResp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: new Headers({ Authorization: `Bearer ${token}` }),
          body: form,
        });

        if (!uploadResp.ok) {
          const errorInfo = await uploadResp.json();
          reject(new Error(`업로드 실패: ${JSON.stringify(errorInfo)}`));
          return;
        }

        const uploadedFile = await uploadResp.json();
        console.log('업로드 성공:', uploadedFile);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}


//메세지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'uploadToDrive') {
    uploadToDrive(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('업로드 중 오류:', error);
        sendResponse({ success: false });
      });
    return true; // 비동기 응답 시 반드시 필요
  }
});


