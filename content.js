console.log('Simple Image Preview with Whitelist starting...');

function isAllowedSite(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get('allowedSites', function(data) {
            const allowedSites = data.allowedSites || [];
            console.log('Checking whitelist:', allowedSites, 'Current URL:', window.location.href); // Debugging log
            resolve(allowedSites.some(site => url.includes(site)));
        });
    });
}

function watchForLinks() {
    chrome.storage.local.get('allowedSites', function(data) {
        const allowedSites = data.allowedSites || [];
        console.log('Allowed Sites:', allowedSites);

        if (allowedSites.length === 0) {
            console.log('No sites in whitelist. No image preview will function.');
            return;
        }

        // Watch for links specifically within the chat container
        const chatContainer = document.querySelector('#chat-history-list, .chat-history-list, .chat-container') || document.body;

        if (!chatContainer) {
            console.log('Chat container not found yet, retrying in 1 second...');
            setTimeout(watchForLinks, 1000);
            return;
        }

        console.log('Starting to watch for links within the chat container...');

        const observer = new MutationObserver((mutationsList, observer) => {
            mutationsList.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const links = Array.from(node.querySelectorAll('a')).filter(link => {
                            const url = link.href;
                            return url && url.match(/\.(gif|png|jpg|jpeg)$/i);
                        });

                        links.forEach(link => {
                            const url = link.href;
                            console.log('Detected image link:', url);
                            isAllowedSite(url).then((isAllowed) => {
                                if (!isAllowed) {
                                    console.log('Image link blocked:', url);
                                    return; // Stop processing this link
                                }
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
                                if (link.parentNode) {
                                    link.parentNode.insertBefore(img, link.nextSibling);
                                    link.style.display = 'none'; // Hide original link
                                }
                            });
                        });
                    }
                });
            });
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
    });
}

function scrollToBottom() {
    const chatContainer = document.querySelector('#chat-history-list, .chat-history-list, .chat-container') || document.body;
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Start watching immediately
watchForLinks();
