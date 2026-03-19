// --- Seleção de Elementos ---
const productInput = document.getElementById('productInput');
const addProductBtn = document.getElementById('addProductBtn');
const productList = document.getElementById('productList');
const suggestionsList = document.getElementById('suggestions');
const clearListBtn = document.getElementById('clearListBtn');
const completionMessage = document.getElementById('completionMessage');
const totalValueDisplay = document.getElementById('totalValue');

// --- Funções Auxiliares ---

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Lógica Principal ---

function calculateTotal() {
    let totalGeral = 0;
    document.querySelectorAll('.product-item').forEach(item => {
        const qtyDisplay = item.querySelector('.quantity-display');
        const priceUnit = parseFloat(qtyDisplay.dataset.price) || 0;
        const quantity = parseFloat(qtyDisplay.dataset.quantity) || 0;
        
        const subtotal = quantity * priceUnit;
        
        const subtotalElement = item.querySelector('.item-price-total');
        if (subtotalElement) {
            subtotalElement.textContent = formatCurrency(subtotal);
        }
        
        totalGeral += subtotal;
    });
    totalValueDisplay.textContent = totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function checkCompletion() {
    const totalItems = document.querySelectorAll('.product-item').length;
    const completedItems = document.querySelectorAll('.product-item.completed').length;
    completionMessage.style.display = (totalItems > 0 && totalItems === completedItems) ? 'block' : 'none';
}

function renderItem(name, quantity, unitLabel, price, image, completed, isPlaceholder) {
    const imageClass = isPlaceholder ? 'no-image' : '';
    const priceNum = parseFloat(price) || 0;
    const subtotal = quantity * priceNum;

    const li = document.createElement('li');
    li.className = `product-item ${completed ? 'completed' : ''}`;
    
    // Armazenamos os valores puros nos 'data-attributes' para não errar o cálculo
    li.innerHTML = `
        <div class="item-content">
            <img src="${image}" alt="" class="${imageClass}">
            <div class="item-info">
                <span class="item-name">${name}</span>
                <small class="unit-label">${unitLabel}</small>
            </div>
        </div>
        
        <div class="item-details">
            <span class="item-price-total">${formatCurrency(subtotal)}</span>
            <span class="quantity-display" data-quantity="${quantity}" data-price="${priceNum}" data-unit="${unitLabel}">
                ${quantity.toString().replace('.', ',')} 
            </span> 
            <div class="quantity-controls">
                <button class="decrease-qty-btn">-</button>
                <button class="increase-qty-btn">+</button>
            </div>
        </div>

        <div class="item-actions">
            <button class="check-btn"><i class="fas fa-check"></i></button>
            <button class="remove-btn"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    productList.appendChild(li);
}

function showSuggestions() {
    const query = removeAccents(productInput.value.toLowerCase());
    suggestionsList.innerHTML = '';

    if (query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    const filteredProducts = productsDB.filter(product =>
        removeAccents(product.name.toLowerCase()).includes(query)
    );

    if (filteredProducts.length > 0) {
        suggestionsList.style.display = 'block';
        filteredProducts.forEach(product => {
            const li = document.createElement('li');
            li.textContent = product.name;
            li.addEventListener('mousedown', (e) => { // mousedown evita conflito de foco
                productInput.value = product.name;
                addProduct();
            });
            suggestionsList.appendChild(li);
        });
    } else {
        suggestionsList.style.display = 'none';
    }
}

function addProduct() {
    const productNameInput = productInput.value.trim();
    if (productNameInput === '') return;

    const productData = productsDB.find(item =>
        removeAccents(item.name.toLowerCase()) === removeAccents(productNameInput.toLowerCase())
    );

    const isPlaceholder = !productData; 
    const imageUrl = isPlaceholder ? "https://via.placeholder.com/40" : productData.image;
    const displayName = isPlaceholder ? productNameInput : productData.name;
    const unitLabel = productData ? productData.unit : "un";

    // Define o passo (step) baseado na unidade
    const isWeight = ['kg', 'L', 'ml', 'g'].includes(unitLabel.toLowerCase());
    const defaultQty = isWeight ? "1.0" : "1";

    let inputQty = prompt(`Quantidade de ${displayName} (${unitLabel}):`, defaultQty);
    if (inputQty === null) return;
    let quantityValue = parseFloat(inputQty.replace(',', '.')) || 1;

    renderItem(displayName, quantityValue, unitLabel, 0, imageUrl, false, isPlaceholder);
    
    productInput.value = '';
    suggestionsList.style.display = 'none';
    saveList();
    calculateTotal();
    checkCompletion();
}

function editPrice(itemElement) {
    const qtyDisplay = itemElement.querySelector('.quantity-display');
    const name = itemElement.querySelector('.item-name').textContent;
    const currentPrice = qtyDisplay.dataset.price || "0";

    let newPrice = prompt(`Preço unitário/kg de ${name}:`, currentPrice.replace('.', ','));
    
    if (newPrice !== null) {
        qtyDisplay.dataset.price = parseFloat(newPrice.replace(',', '.')) || 0; 
        saveList();
        calculateTotal(); 
    }
}

// --- Eventos ---

productList.addEventListener('click', (e) => {
    const target = e.target;
    const item = target.closest('.product-item');
    if (!item) return;

    const qtySpan = item.querySelector('.quantity-display');
    let quantity = parseFloat(qtySpan.dataset.quantity);
    const unit = qtySpan.dataset.unit.toLowerCase();

    // Lógica de incremento inteligente
    const step = (['kg', 'l', 'ml', 'g'].includes(unit)) ? 0.1 : 1;

    if (target.closest('.increase-qty-btn')) {
        quantity += step;
    } else if (target.closest('.decrease-qty-btn') && quantity > step) {
        quantity -= step;
    } else if (target.closest('.check-btn')) {
        item.classList.toggle('completed');
    } else if (target.closest('.remove-btn')) {
        item.remove();
    } else if (target.closest('.item-price-total')) {
        editPrice(item);
    }

    qtySpan.dataset.quantity = quantity.toFixed(2);
    qtySpan.textContent = quantity.toFixed(isWeightUnit(unit) ? 2 : 0).replace('.', ',');
    
    saveList();
    calculateTotal();
    checkCompletion();
});

function isWeightUnit(unit) {
    return ['kg', 'l', 'ml', 'g'].includes(unit.toLowerCase());
}

// --- Persistência ---

function saveList() {
    const items = [];
    document.querySelectorAll('.product-item').forEach(item => {
        const qtyDisplay = item.querySelector('.quantity-display');
        items.push({
            name: item.querySelector('.item-name').textContent,
            unitLabel: item.querySelector('.unit-label').textContent,
            quantity: qtyDisplay.dataset.quantity,
            price: qtyDisplay.dataset.price, 
            image: item.querySelector('img').src,
            completed: item.classList.contains('completed'),
            isPlaceholder: item.querySelector('img').classList.contains('no-image')
        });
    });
    localStorage.setItem('shoppingList', JSON.stringify(items));
}

function loadList() {
    const items = JSON.parse(localStorage.getItem('shoppingList')) || [];
    productList.innerHTML = ''; 
    items.forEach(item => {
        renderItem(item.name, parseFloat(item.quantity), item.unitLabel, item.price, item.image, item.completed, item.isPlaceholder);
    });
    calculateTotal();
    checkCompletion();
}

// --- Event Listeners Iniciais ---
addProductBtn.addEventListener('click', addProduct);
productInput.addEventListener('input', showSuggestions);
productInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addProduct(); });
clearListBtn.addEventListener('click', () => {
    if(confirm("Deseja zerar toda a lista?")) {
        localStorage.removeItem('shoppingList');
        productList.innerHTML = '';
        calculateTotal();
        checkCompletion();
    }
});

document.addEventListener('DOMContentLoaded', loadList);