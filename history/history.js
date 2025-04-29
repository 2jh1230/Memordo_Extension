document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('visitedUrls', (data) => {
    const historyList = document.getElementById('history-list');
    const visited = data.visitedUrls || [];

    if (visited.length === 0) {
      historyList.innerHTML = '<p>저장된 방문 기록이 없습니다.</p>';
      return;
    }

    // --- 날짜별 그룹화 (안정적인 키 사용) ---
    const groupedByDate = visited.reduce((groups, entry) => {
      // 타임스탬프에서 'YYYY-MM-DD' 형식의 날짜 키 생성
      const dateKey = new Date(entry.timestamp).toISOString().split('T')[0]; // 예: "2025-04-28"

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
      return groups;
    }, {});
    // ------------------------------------


    // --- 날짜 키 정렬 (YYYY-MM-DD는 문자열 정렬로도 가능하지만, 명확성을 위해 Date 객체 비교) ---
    const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => {
        // 'YYYY-MM-DD' 형식의 키를 Date 객체로 변환하여 최신순 정렬
        return new Date(b) - new Date(a);
    });
    // --------------------------------------------------------------------------------


    sortedDateKeys.forEach(dateKey => { // 정렬된 'YYYY-MM-DD' 키 사용
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-group';

        // --- 날짜 및 요일 표시 (안정적인 키 사용) ---
        // 'YYYY-MM-DD' 키 문자열을 Date 객체로 변환 (UTC 기준 해석 방지 위해 시간 정보 추가)
        // new Date('YYYY-MM-DD')는 UTC 자정 기준으로 해석될 수 있어, 시간대를 고려하여 파싱
        const dateParts = dateKey.split('-');
        // 로컬 시간대 기준으로 Date 객체 생성
        const dateObject = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }; // 요일 'short' 옵션 추가
        const formattedDate = dateObject.toLocaleDateString('ko-KR', options); // 예: "2025. 04. 28. (월)"

        // 제목(h3) 내용 설정
        dateDiv.innerHTML = `<h3>${formattedDate}</h3>`;
        // ------------------------------------------

        const ul = document.createElement('ul');

        // 그룹 내에서도 최신 시간순 정렬
        groupedByDate[dateKey] // 현재 날짜 키에 해당하는 배열 사용
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .forEach(entry => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = entry.url;
            link.target = '_blank';
            link.textContent = entry.url;
            link.title = entry.url; // 전체 URL 툴팁 유지
            li.appendChild(link);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            const timeString = new Date(entry.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute:'2-digit', hour12: true });
            timeSpan.textContent = `${timeString}`;
            li.appendChild(timeSpan);

            ul.appendChild(li);
          });

        dateDiv.appendChild(ul);
        historyList.appendChild(dateDiv);
      });
  });
});