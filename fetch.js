function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

function showResultSection() {
    document.getElementById('resultSection').style.display = 'block';
}

function displayMedia(thumbnailUrl, videoUrl) {
    const thumbnail = document.getElementById('thumbnail');
    const downloadOptions = document.getElementById('downloadOptions');
    thumbnail.src = '';
    downloadOptions.innerHTML = '';

    if (thumbnailUrl) {
        thumbnail.src = thumbnailUrl;
        thumbnail.style.display = 'block';
    } else {
        thumbnail.style.display = 'none';
    }

    if (videoUrl) {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.className = 'download-btn';
        a.innerHTML = '<i class="fas fa-file-download"></i> Download Video';
        a.download = 'instagram_video.mp4';
        downloadOptions.appendChild(a);
    }
    showResultSection();
}

function showMessage(type, message) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type}-message">${message}</div>`;
}

async function fetchInstagramReelData(instagramUrl) {
    showSpinner();
    showMessage('success', 'Processing your request...');
    if (!instagramUrl) {
        showMessage('error', 'Please provide a valid Instagram URL.');
        hideSpinner();
        return;
    }
    try {
        const response = await fetch('https://api.instasave.website/media', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({url: instagramUrl})
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = {error: 'Invalid response format', response: text};
        }
        hideSpinner();
        if (data.error === 'Invalid response format') {
            // Парсинг HTML и извлечение ссылки на видео
            let html = data.response || '';
            html = html.replace(/loader\.style\.display="none";/, '')
                       .replace(/document\.getElementById\("div_download"\)\.innerHTML ="/, '')
                       .replace(/";document\.getElementById\("downloader"\)\.remove\(\);showAd\(\);/, '')
                       .replace(/\\/g, '');
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const thumbImg = doc.querySelector('.download-items__thumb img');
            const videoBtn = doc.querySelector('a.abutton.is-success');
            const thumbnailUrl = thumbImg ? thumbImg.getAttribute('src') : '';
            const videoUrl = videoBtn ? videoBtn.getAttribute('href') : '';
            if (videoUrl) {
                displayMedia(thumbnailUrl, videoUrl);
                showMessage('success', 'Video ready for download!');
            } else {
                showMessage('error', 'No downloadable video found in the response.');
            }
        } else if (data.error) {
            showMessage('error', data.error);
        } else if (data.download_url) {
            displayMedia(data.thumbnail, data.download_url);
            showMessage('success', 'Video ready for download!');
        } else {
            showMessage('error', 'No downloadable video found in the response.');
        }
    } catch (err) {
        showMessage('error', 'Failed to fetch video. Please try again.');
        hideSpinner();
        console.error('Fetch Error:', err);
    }
}

document.getElementById('fetchButton').addEventListener('click', async function() {
    const url = document.getElementById('instagramReelUrl').value.trim();
    await fetchInstagramReelData(url);
});

document.getElementById('instagramReelUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('fetchButton').click();
    }
});
