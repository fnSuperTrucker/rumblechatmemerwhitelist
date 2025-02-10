console.log('Simple Image Preview with Whitelist starting...');

function isAllowedSite(siteToCheck) {
    return new Promise((resolve) => {
        chrome.storage.local.get('allowedSites', function(data) {
            const allowedSites = data.allowedSites || [];
            if (!allowedSites || allowedSites.length == 0) {
                console.warn("Whitelist not configured, all sites allowed");
                resolve(true);
            }
            console.log('Checking whitelist:', allowedSites, 'Current URL:', siteToCheck); // Debugging log
            let inWhiteList = allowedSites.some(site => siteToCheck.includes(site));
            if (inWhiteList) {
                console.log(siteToCheck + " in whitelist");
            } else {
                console.log(siteToCheck + " not in whitelist");
            }
            resolve(inWhiteList);
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
        const chatContainer = document.getElementById("js-chat--height");
        if (!chatContainer) {
            console.log('Container not found yet, retrying in 1 second...');
            setTimeout(watchForLinks, 1000);
            return;
        }

        console.log('Starting to watch for links...');

        function processLinks(container) {
            const links = Array.from(container.querySelectorAll('a')).filter(link => {
                const url = link.href;
                return url && url.match(/\.(gif|png|jpg|jpeg)$/i);
            });
    
            links.forEach(link => {
                const url = link.href;
                console.log('Detected image link:', url);
    
                isAllowedSite(url).then((isAllowed) => {
                    if (isAllowed) {
                        console.log('Site is allowed, proceeding with image preview...');
                        const img = createImagePreview(url);
                        if (link.parentNode) {
                            link.parentNode.insertBefore(img, link.nextSibling);
                            link.style.display = 'none'; // Hide original link
                        }
                    } else {
                        console.log('This site is not in the whitelist. No image preview will function.');
                    }
                });
            });
        }
    
        console.log('checking chat content onLoad')
        processLinks(chatContainer);
    
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        console.log('new url detected');
                        processLinks(node);
                    }
                });
            });
        });
    
        observer.observe(chatContainer, { childList: true, subtree: true });
}

// Start watching immediately
watchForLinks();