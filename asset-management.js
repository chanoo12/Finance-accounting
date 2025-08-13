 const assetForm = document.getElementById('assetForm');
    const depreciationInput = document.getElementById('depreciation');
    const tableBody = document.getElementById('assetTableBody');

    function loadAssets() {
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        tableBody.innerHTML = "";
        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asset.name}</td>
                <td>${asset.date}</td>
                <td>₱${asset.cost.toLocaleString()}</td>
                <td>₱${asset.salvage.toLocaleString()}</td>
                <td>${asset.life} yrs</td>
                <td>₱${asset.depreciation.toLocaleString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateDepreciation() {
        const cost = parseFloat(document.getElementById('cost').value) || 0;
        const salvage = parseFloat(document.getElementById('salvageValue').value) || 0;
        const life = parseFloat(document.getElementById('usefulLife').value) || 0;
        if (life > 0) {
            depreciationInput.value = ((cost - salvage) / life).toFixed(2);
        } else {
            depreciationInput.value = "";
        }
    }

    document.getElementById('cost').addEventListener('input', updateDepreciation);
    document.getElementById('salvageValue').addEventListener('input', updateDepreciation);
    document.getElementById('usefulLife').addEventListener('input', updateDepreciation);


    assetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const assets = JSON.parse(localStorage.getItem('assets') || '[]');
        const newAsset = {
            name: document.getElementById('assetName').value,
            date: document.getElementById('purchaseDate').value,
            cost: parseFloat(document.getElementById('cost').value),
            salvage: parseFloat(document.getElementById('salvageValue').value),
            life: parseInt(document.getElementById('usefulLife').value),
            depreciation: parseFloat(depreciationInput.value)
        };
        assets.push(newAsset);
        localStorage.setItem('assets', JSON.stringify(assets));

        // --- Add asset purchase as a dashboard transaction (expense) ---
        try {
            const txKey = 'spendmate_transactions_v1';
            const txs = JSON.parse(localStorage.getItem(txKey) || '[]');
            txs.push({
                id: 'asset_' + Math.random().toString(36).slice(2,9),
                date: newAsset.date,
                category: 'Asset: ' + newAsset.name,
                amount: newAsset.cost,
                type: 'expense',
                source: 'asset'
            });
            localStorage.setItem(txKey, JSON.stringify(txs));
        } catch(e) {/* ignore */}

        assetForm.reset();
        depreciationInput.value = "";
        loadAssets();
    });

    loadAssets();
function loadAssets() {
    const assets = JSON.parse(localStorage.getItem('assets') || '[]');
    tableBody.innerHTML = "";
    assets.forEach((asset, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="selectAsset" data-index="${index}"></td>
            <td>${asset.name}</td>
            <td>${asset.date}</td>
            <td>₱${asset.cost.toLocaleString()}</td>
            <td>₱${asset.salvage.toLocaleString()}</td>
            <td>${asset.life} yrs</td>
            <td>₱${asset.depreciation.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Select/Deselect All
document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.selectAsset');
    checkboxes.forEach(cb => cb.checked = this.checked);
});

// Delete Selected
document.getElementById('deleteSelected').addEventListener('click', function() {
    let assets = JSON.parse(localStorage.getItem('assets') || '[]');
    const selectedIndexes = [...document.querySelectorAll('.selectAsset:checked')]
        .map(cb => parseInt(cb.getAttribute('data-index')));

    if (selectedIndexes.length === 0) {
        alert("No assets selected!");
        return;
    }

    // Filter out selected assets
    assets = assets.filter((_, index) => !selectedIndexes.includes(index));
    localStorage.setItem('assets', JSON.stringify(assets));
    loadAssets();
});

loadAssets();
