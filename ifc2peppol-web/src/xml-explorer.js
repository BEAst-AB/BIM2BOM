/**
 * XML Explorer - Visualize catalogue lines and lots
 */

/**
 * Parse XML and extract catalogue lines grouped by lot
 */
export function parseCatalogueXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('Failed to parse XML: ' + parserError.textContent);
    }
    
    // Namespace handling
    const nsResolver = xmlDoc.createNSResolver(xmlDoc.documentElement);
    const nsMap = {
        'cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
    };
    
    // Helper to get namespaced elements
    function getElementsNS(element, localName, namespace) {
        const result = [];
        const elements = element.getElementsByTagNameNS(namespace, localName);
        for (let i = 0; i < elements.length; i++) {
            result.push(elements[i]);
        }
        return result;
    }
    
    function getTextNS(element, localName, namespace) {
        const elems = getElementsNS(element, localName, namespace);
        return elems.length > 0 ? elems[0].textContent : '';
    }
    
    // Extract all catalogue lines
    const catalogueLines = [];
    const allPropertyNames = new Set(); // Track all unique property names
    const catalogueLineElements = xmlDoc.getElementsByTagNameNS(nsMap.cac, 'CatalogueLine');
    
    for (let i = 0; i < catalogueLineElements.length; i++) {
        const line = catalogueLineElements[i];
        const item = getElementsNS(line, 'Item', nsMap.cac)[0];
        
        if (!item) continue;
        
        const lineData = {
            id: getTextNS(line, 'ID', nsMap.cbc),
            name: getTextNS(item, 'Name', nsMap.cbc),
            description: getTextNS(item, 'Description', nsMap.cbc),
            keywords: [],
            manufacturer: getTextNS(item, 'BrandName', nsMap.cbc),
            lotNumber: '',
            buyersItemId: '',
            sellersItemId: '',
            standardItemId: '',
            orderableUnit: getTextNS(line, 'OrderableUnit', nsMap.cbc),
            contentUnitQuantity: getTextNS(line, 'ContentUnitQuantity', nsMap.cbc),
            componentRelatedItemId: '',
            componentRelatedQuantity: '',
            priceAmount: '',
            priceCurrency: '',
            properties: {}
        };
        
        // Extract keywords
        const keywordElements = getElementsNS(item, 'Keyword', nsMap.cbc);
        for (let j = 0; j < keywordElements.length; j++) {
            lineData.keywords.push(keywordElements[j].textContent);
        }
        
        // Extract item identifications (Ref §7)
        const buyersIdEl = getElementsNS(item, 'BuyersItemIdentification', nsMap.cac)[0];
        if (buyersIdEl) lineData.buyersItemId = getTextNS(buyersIdEl, 'ID', nsMap.cbc);
        
        const sellersIdEl = getElementsNS(item, 'SellersItemIdentification', nsMap.cac)[0];
        if (sellersIdEl) lineData.sellersItemId = getTextNS(sellersIdEl, 'ID', nsMap.cbc);
        
        const standardIdEl = getElementsNS(item, 'StandardItemIdentification', nsMap.cac)[0];
        if (standardIdEl) lineData.standardItemId = getTextNS(standardIdEl, 'ID', nsMap.cbc);
        
        // Extract ComponentRelatedItem (Ref §5)
        const compRelEl = getElementsNS(line, 'ComponentRelatedItem', nsMap.cac)[0];
        if (compRelEl) {
            lineData.componentRelatedItemId = getTextNS(compRelEl, 'ID', nsMap.cbc);
            lineData.componentRelatedQuantity = getTextNS(compRelEl, 'Quantity', nsMap.cbc);
        }
        
        // Extract pricing (Ref §6)
        const reqItemLocQty = getElementsNS(line, 'RequiredItemLocationQuantity', nsMap.cac)[0];
        if (reqItemLocQty) {
            const priceEl = getElementsNS(reqItemLocQty, 'Price', nsMap.cac)[0];
            if (priceEl) {
                const priceAmountEl = getElementsNS(priceEl, 'PriceAmount', nsMap.cbc)[0];
                if (priceAmountEl) {
                    lineData.priceAmount = priceAmountEl.textContent || '';
                    lineData.priceCurrency = priceAmountEl.getAttribute('currencyID') || '';
                }
            }
        }
        
        // Extract lot number from ItemInstance
        const itemInstance = getElementsNS(item, 'ItemInstance', nsMap.cac)[0];
        if (itemInstance) {
            const lotIdentification = getElementsNS(itemInstance, 'LotIdentification', nsMap.cac)[0];
            if (lotIdentification) {
                lineData.lotNumber = getTextNS(lotIdentification, 'LotNumberID', nsMap.cbc);
            }
        }
        
        // Extract additional properties
        const propElements = getElementsNS(item, 'AdditionalItemProperty', nsMap.cac);
        for (let j = 0; j < propElements.length; j++) {
            const prop = propElements[j];
            const propName = getTextNS(prop, 'Name', nsMap.cbc);
            const propValue = getTextNS(prop, 'Value', nsMap.cbc);
            if (propName && propValue) {
                lineData.properties[propName] = propValue;
                allPropertyNames.add(propName);
            }
        }
        
        catalogueLines.push(lineData);
    }
    
    // Group by lot number
    const lotsMap = new Map();
    const noLotLines = [];
    
    catalogueLines.forEach(line => {
        if (line.lotNumber) {
            if (!lotsMap.has(line.lotNumber)) {
                lotsMap.set(line.lotNumber, []);
            }
            lotsMap.get(line.lotNumber).push(line);
        } else {
            noLotLines.push(line);
        }
    });
    
    // Sort property names for consistent column order
    const sortedPropertyNames = Array.from(allPropertyNames).sort();
    
    return {
        lots: Array.from(lotsMap.entries()).map(([lotNumber, lines]) => ({
            lotNumber,
            lines,
            count: lines.length
        })),
        noLotLines,
        totalLines: catalogueLines.length,
        propertyNames: sortedPropertyNames // Return all unique property names
    };
}

// Global state for sorting and filtering
let currentSortColumn = null;
let currentSortDirection = 'asc';
let currentFilterText = '';
let allCatalogueLines = [];
let currentExplorerData = null;

/**
 * Display XML explorer with tabs and table
 */
export function displayXMLExplorer(xmlString, ui) {
    try {
        const explorerData = parseCatalogueXML(xmlString);
        currentExplorerData = explorerData;
        const explorerSection = document.getElementById('xml-explorer');
        const lotTabs = document.getElementById('lot-tabs');
        const table = document.getElementById('catalogue-table');
        const tableHead = table.querySelector('thead');
        const tableBody = document.getElementById('catalogue-table-body');
        const searchInput = document.getElementById('table-search');
        
        // Reset state
        currentSortColumn = null;
        currentSortDirection = 'asc';
        currentFilterText = '';
        
        // Clear previous content
        lotTabs.innerHTML = '';
        tableBody.innerHTML = '';
        searchInput.value = '';
        
        // Build table header with dynamic property columns
        buildTableHeader(tableHead, explorerData.propertyNames);
        
        // Set up search filter
        searchInput.addEventListener('input', (e) => {
            currentFilterText = e.target.value.toLowerCase();
            refreshTable();
        });
        
        // Create tabs for each lot
        let activeTab = null;
        
        // Add "All" tab
        const allTab = document.createElement('button');
        allTab.className = 'lot-tab active';
        allTab.textContent = `All (${explorerData.totalLines})`;
        allTab.onclick = () => {
            showLotLines(null, explorerData);
            setActiveTab(allTab, lotTabs);
        };
        lotTabs.appendChild(allTab);
        activeTab = allTab;
        
        // Add tabs for each lot
        explorerData.lots.forEach((lot, index) => {
            const tab = document.createElement('button');
            tab.className = 'lot-tab';
            tab.textContent = `${lot.lotNumber} (${lot.count})`;
            tab.onclick = () => {
                showLotLines(lot.lotNumber, explorerData);
                setActiveTab(tab, lotTabs);
            };
            lotTabs.appendChild(tab);
        });
        
        // Show all lines initially
        showLotLines(null, explorerData);
        
        // Show explorer section
        explorerSection.hidden = false;
        
        // Scroll to table
        setTimeout(() => {
            explorerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
    } catch (error) {
        console.error('Failed to parse XML for explorer:', error);
        ui.showError('Failed to parse XML for visualization', error.message);
    }
}

/**
 * Build table header with fixed and dynamic property columns
 */
function buildTableHeader(tableHead, propertyNames) {
    // Clear existing header
    tableHead.innerHTML = '';
    
    const headerRow = document.createElement('tr');
    
    // Fixed columns
    const fixedColumns = [
        { label: 'ID', class: 'col-id', key: 'id' },
        { label: 'Name', class: 'col-name', key: 'name' },
        { label: 'Description', class: 'col-description', key: 'description' },
        { label: 'Buyer ID', class: 'col-buyer-id', key: 'buyersItemId' },
        { label: 'Seller ID', class: 'col-seller-id', key: 'sellersItemId' },
        { label: 'GTIN', class: 'col-gtin', key: 'standardItemId' },
        { label: 'Keywords', class: 'col-keywords', key: 'keywords' },
        { label: 'Manufacturer', class: 'col-manufacturer', key: 'manufacturer' },
        { label: 'Unit', class: 'col-unit', key: 'orderableUnit' },
        { label: 'Quantity', class: 'col-qty', key: 'contentUnitQuantity' },
        { label: 'Parent Line', class: 'col-parent', key: 'componentRelatedItemId' },
        { label: 'Price', class: 'col-price', key: 'priceAmount' },
        { label: 'Lot Number', class: 'col-lot', key: 'lotNumber' }
    ];
    
    fixedColumns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        th.className = `${col.class} sortable`;
        th.dataset.sortKey = col.key;
        th.innerHTML = `${col.label} <span class="sort-indicator"></span>`;
        th.addEventListener('click', () => sortTable(col.key));
        headerRow.appendChild(th);
    });
    
    // Dynamic property columns
    propertyNames.forEach(propName => {
        const th = document.createElement('th');
        th.textContent = propName;
        th.className = 'col-property sortable';
        th.dataset.sortKey = `prop:${propName}`;
        th.title = propName;
        th.innerHTML = `${propName} <span class="sort-indicator"></span>`;
        th.addEventListener('click', () => sortTable(`prop:${propName}`));
        headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);
}

/**
 * Show lines for a specific lot (or all if lotNumber is null)
 */
function showLotLines(lotNumber, explorerData) {
    if (lotNumber === null) {
        // Show all lines
        allCatalogueLines = [
            ...explorerData.lots.flatMap(lot => lot.lines),
            ...explorerData.noLotLines
        ];
    } else {
        // Show lines for specific lot
        const lot = explorerData.lots.find(l => l.lotNumber === lotNumber);
        if (lot) {
            allCatalogueLines = lot.lines;
        } else {
            allCatalogueLines = [];
        }
    }
    
    refreshTable();
}

/**
 * Refresh table with current filter and sort
 */
function refreshTable() {
    const tableBody = document.getElementById('catalogue-table-body');
    tableBody.innerHTML = '';
    
    // Filter lines
    let filteredLines = allCatalogueLines;
    if (currentFilterText) {
        filteredLines = allCatalogueLines.filter(line => {
            const searchText = [
                line.id,
                line.name,
                line.description || '',
                line.keywords.join(' '),
                line.manufacturer || '',
                line.lotNumber || '',
                ...Object.values(line.properties)
            ].join(' ').toLowerCase();
            return searchText.includes(currentFilterText);
        });
    }
    
    // Sort lines
    if (currentSortColumn) {
        filteredLines = [...filteredLines].sort((a, b) => {
            let aVal, bVal;
            
            if (currentSortColumn.startsWith('prop:')) {
                const propName = currentSortColumn.substring(5);
                aVal = a.properties[propName] || '';
                bVal = b.properties[propName] || '';
            } else {
                aVal = a[currentSortColumn] || '';
                if (currentSortColumn === 'keywords') {
                    aVal = a.keywords.join(', ');
                    bVal = b.keywords.join(', ');
                } else {
                    bVal = b[currentSortColumn] || '';
                }
            }
            
            // Convert to comparable values
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Populate table
    filteredLines.forEach(line => {
        const row = document.createElement('tr');
        
        // Fixed columns
        const fixedCells = [
            { val: line.id, cls: 'col-id' },
            { val: line.name, cls: 'col-name' },
            { val: line.description || '', cls: 'col-description' },
            { val: line.buyersItemId || '', cls: 'col-buyer-id' },
            { val: line.sellersItemId || '', cls: 'col-seller-id' },
            { val: line.standardItemId || '', cls: 'col-gtin' },
            { val: line.keywords.join(', '), cls: 'col-keywords' },
            { val: line.manufacturer || '', cls: 'col-manufacturer' },
            { val: line.orderableUnit || '', cls: 'col-unit' },
            { val: line.contentUnitQuantity || '', cls: 'col-qty' },
            { val: line.componentRelatedItemId || '', cls: 'col-parent' },
            { val: line.priceAmount ? `${line.priceAmount} ${line.priceCurrency}` : '', cls: 'col-price' },
            { val: line.lotNumber || '-', cls: 'col-lot' }
        ];
        
        fixedCells.forEach(({ val, cls }) => {
            const td = document.createElement('td');
            td.className = cls;
            td.textContent = escapeHtml(val);
            row.appendChild(td);
        });
        
        // Dynamic property columns
        currentExplorerData.propertyNames.forEach(propName => {
            const td = document.createElement('td');
            td.className = 'col-property';
            const propValue = line.properties[propName] || '';
            td.textContent = propValue;
            if (!propValue) {
                td.style.color = '#cbd5e1';
                td.textContent = '-';
            }
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });
    
    // Update row count if needed
    const rowCount = filteredLines.length;
    if (rowCount !== allCatalogueLines.length) {
        // Could show filtered count somewhere
    }
}

/**
 * Sort table by column
 */
function sortTable(columnKey) {
    if (currentSortColumn === columnKey) {
        // Toggle direction
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = columnKey;
        currentSortDirection = 'asc';
    }
    
    // Update sort indicators
    document.querySelectorAll('.sortable').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (th.dataset.sortKey === columnKey) {
            indicator.textContent = currentSortDirection === 'asc' ? ' ↑' : ' ↓';
            indicator.style.opacity = '1';
        } else {
            indicator.textContent = '';
            indicator.style.opacity = '0';
        }
    });
    
    refreshTable();
}

/**
 * Set active tab
 */
function setActiveTab(activeTab, container) {
    const tabs = container.querySelectorAll('.lot-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    activeTab.classList.add('active');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

