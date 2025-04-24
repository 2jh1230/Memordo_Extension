document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('visitedUrls', (data) => {
    const historyList = document.getElementById('history-list');
    const visited = data.visitedUrls || [];

    if (visited.length === 0) {
      historyList.innerHTML = '<p>저장된 방문 기록이 없습니다.</p>';
      return;
    }

    // 날짜별로 방문 기록 그룹화
    const groupedByDate = visited.reduce((groups, entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
      return groups;
    }, {});

    // 날짜 기준 최신순 정렬
    Object.keys(groupedByDate)
      .sort((a, b) => new Date(b) - new Date(a))
      .forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-group';
        dateDiv.innerHTML = `<h3>${date}</h3>`;
        const ul = document.createElement('ul');

        // 그룹 내에서도 최신 시간순 정렬
        groupedByDate[date]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .forEach(entry => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = entry.url;
            link.target = '_blank';
            link.textContent = entry.url;
            li.appendChild(link);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            const timeString = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            timeSpan.textContent = ` - ${timeString}`;
            li.appendChild(timeSpan);

            ul.appendChild(li);
          });

        dateDiv.appendChild(ul);
        historyList.appendChild(dateDiv);
      });
  });
});
