console.log('Simple Image Preview with Whitelist starting...');

function isAllowedSite() {
    return new Promise((resolve) => {
        chrome.storage.local.get('allowedSites', function(data) {
            const allowedSites = data.allowedSites || [];
            console.log('Checking whitelist:', allowedSites, 'Current URL:', window.location.href); // Debugging log
            resolve(allowedSites.some(site => window.location.href.includes(site)));
        });
    });
}

function createImagePreview(url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '300px';
    img.style.maxHeight = '400px';
    img.style.display = 'block';
    img.style.marginTop = '4px';
    img.style.borderRadius = '4px';
    img.onerror = () => console.error('Failed to load image:', url);
    img.onload = () => {
        console.log('Image loaded:', url);
        scrollToBottom();
    };
    return img;
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        const chatContainer = document.querySelector('#chat-history-list, .chat-history-list, .chat-container') || document.body;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}

function watchForLinks() {
    isAllowedSite().then((isAllowed) => {
        if (isAllowed) {
            console.log('Site is allowed, proceeding with image preview...');
            const chatContainer = document.body;

            if (!chatContainer) {
                console.log('Container not found yet, retrying in 1 second...');
                setTimeout(watchForLinks, 1000);
                return;
            }

            console.log('Starting to watch for links...');

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const links = Array.from(node.querySelectorAll('a')).filter(link => {
                                const url = link.href;
                                return url && url.match(/\.(gif|png|jpg|jpeg)$/i);
                            });

                            links.forEach(link => {
                                const url = link.href;
                                console.log('Detected image link:', url);
                                const img = createImagePreview(url);
                                if (link.parentNode) {
                                    link.parentNode.insertBefore(img, link.nextSibling);
                                    link.style.display = 'none'; // Hide original link
                                }
                            });
                        }
                    });
                });
            });

            observer.observe(chatContainer, { childList: true, subtree: true });
        } else {
            console.log('This site is not in the whitelist. No image preview will function.');
        }
    });
}

// Start watching immediately
watchForLinks();