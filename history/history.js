// history/history.js

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('visitedUrls', (data) => {
    const historyList = document.getElementById('history-list');
    const visited = data.visitedUrls || [];

    if (visited.length === 0) {
      historyList.innerHTML = '<p>저장된 방문 기록이 없습니다.</p>';
      return;
    }

    // --- 날짜별 그룹화 (기존과 동일) ---
    const groupedByDate = visited.reduce((groups, entry) => {
      const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
      return groups;
    }, {});
    // ------------------------------------

    // --- 날짜 키 정렬 (기존과 동일) ---
    const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
    // --------------------------------------------------------------------------------

    sortedDateKeys.forEach(dateKey => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-group';

        // --- 날짜 및 요일 표시 (기존과 동일) ---
        const dateParts = dateKey.split('-');
        const dateObject = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' };
        const formattedDate = dateObject.toLocaleDateString('ko-KR', options);
        dateDiv.innerHTML = `<h3>${formattedDate}</h3>`;
        // ------------------------------------------

        const ul = document.createElement('ul');

        // 그룹 내에서도 최신 시간순 정렬 (기존과 동일)
        groupedByDate[dateKey]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .forEach(entry => {
            const li = document.createElement('li');

            // 제목 표시용 요소 생성 및 추가
            const titleSpan = document.createElement('span');
            titleSpan.className = 'entry-title';
            // entry.title이 없거나 빈 문자열일 경우 URL을 대신 표시 (선택적 예외 처리)
            titleSpan.textContent = entry.title || entry.url;
            li.appendChild(titleSpan); // 링크(a) 앞에 제목(span) 추가

            // URL 링크 생성 (기존과 동일)
            const link = document.createElement('a');
            link.href = entry.url;
            link.target = '_blank';
            link.textContent = entry.url;
            link.title = entry.url; // 전체 URL 툴팁 유지
            li.appendChild(link);

            // 타임스탬프 표시 (기존과 동일)
            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            const timeString = new Date(entry.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute:'2-digit', hour12: true });
            timeSpan.textContent = `${timeString}`;
            li.appendChild(timeSpan); // 타임스탬프는 li의 마지막 자식으로 유지

            ul.appendChild(li);
          });

        dateDiv.appendChild(ul);
        historyList.appendChild(dateDiv);
      });
  });
});