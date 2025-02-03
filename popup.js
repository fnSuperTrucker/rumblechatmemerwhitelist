document.addEventListener('DOMContentLoaded', function() {
    const newSiteInput = document.getElementById('new-site');
    const addSiteButton = document.getElementById('add-site');
    const sitesList = document.getElementById('sites-list');

    // Load saved sites
    chrome.storage.local.get('allowedSites', function(data) {
        let sites = data.allowedSites || [];
        
        // Check if the whitelist is empty and add 'rumble.com' if it is
        if (sites.length === 0) {
            sites.push('rumble.com');
            chrome.storage.local.set({ 'allowedSites': sites }, function() {
                console.log('Rumble added to whitelist by default');
            });
        }

        // Display existing sites
        sites.forEach(site => addSiteToList(site));
    });

    addSiteButton.addEventListener('click', function() {
        const site = newSiteInput.value.trim();
        if (site) {
            chrome.storage.local.get('allowedSites', function(data) {
                let sites = data.allowedSites || [];
                if (!sites.includes(site)) {
                    sites.push(site);
                    chrome.storage.local.set({ 'allowedSites': sites }, function() {
                        addSiteToList(site);
                        newSiteInput.value = '';
                    });
                }
            });
        }
    });

    function addSiteToList(site) {
        const li = document.createElement('li');
        li.textContent = site;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function() {
            chrome.storage.local.get('allowedSites', function(data) {
                let sites = data.allowedSites || [];
                sites = sites.filter(s => s !== site);
                chrome.storage.local.set({ 'allowedSites': sites }, function() {
                    li.remove();
                });
            });
        });
        li.appendChild(removeButton);
        sitesList.appendChild(li);
    }
});