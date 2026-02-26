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

function checkCompletion() {
    const totalItems = document.querySelectorAll('.product-item').length;
    const completedItems = document.querySelectorAll('.product-item.completed').length;
    
    if (totalItems > 0 && totalItems === completedItems) {
        completionMessage.textContent = 'Todos os itens foram buscados!';
        completionMessage.style.display = 'block';
    } else {
        completionMessage.style.display = 'none';
    }
}

// Calcula o valor total de todos os itens na lista
function calculateTotal() {
    let totalGeral = 0;
    document.querySelectorAll('.product-item').forEach(item => {
        const qtyDisplay = item.querySelector('.quantity-display');
        const priceUnit = parseFloat(qtyDisplay.dataset.price) || 0;
        
        // Extrai apenas o número da string (ex: "2 kg" -> 2)
        const qtyText = qtyDisplay.textContent.split(' ')[0].replace(',', '.');
        const qtyNum = parseFloat(qtyText) || 0;
        
        const subtotal = qtyNum * priceUnit;
        
        // Atualiza o subtotal visual do item específico
        const subtotalElement = item.querySelector('.item-price-total');
        if (subtotalElement) {
            subtotalElement.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        }
        
        totalGeral += subtotal;
    });
    totalValueDisplay.textContent = totalGeral.toFixed(2).replace('.', ',');
}

// Nova função: Permite editar o preço ao tocar no valor
function editPrice(itemElement) {
    const qtyDisplay = itemElement.querySelector('.quantity-display');
    const name = itemElement.querySelector('.item-name').textContent;
    const currentPrice = qtyDisplay.dataset.price || "0";

    let newPrice = prompt(`Informe o preço unitário de ${name}:`, currentPrice.replace('.', ','));
    
    if (newPrice !== null) {
        let priceValue = parseFloat(newPrice.replace(',', '.')) || 0;
        qtyDisplay.dataset.price = priceValue; // Atualiza o preço "escondido" no dataset
        
        saveList();
        calculateTotal(); // Recalcula tudo
    }
}

// Salva a lista no localStorage
function saveList() {
    const items = [];
    document.querySelectorAll('.product-item').forEach(item => {
        const imgElement = item.querySelector('img');
        const qtyDisplay = item.querySelector('.quantity-display');
        
        items.push({
            name: item.querySelector('.item-name').textContent,
            quantity: qtyDisplay.textContent,
            price: qtyDisplay.dataset.price, 
            image: imgElement.src,
            completed: item.classList.contains('completed'),
            isPlaceholder: imgElement.classList.contains('no-image')
        });
    });
    localStorage.setItem('shoppingList', JSON.stringify(items));
}

// Carrega a lista do localStorage 
function loadList() {
    const items = JSON.parse(localStorage.getItem('shoppingList')) || [];
    productList.innerHTML = ''; 
    
    items.forEach(item => {
        renderItem(item.name, item.quantity, item.price, item.image, item.completed, item.isPlaceholder);
    });
    calculateTotal();
    checkCompletion();
}

// Função auxiliar para renderizar o HTML do item
function renderItem(name, quantity, price, image, completed, isPlaceholder) {
    const imageClass = isPlaceholder ? 'no-image' : '';
    const altText = isPlaceholder ? '' : 'Imagem do Produto';
    const priceNum = parseFloat(price) || 0;
    
    const qtyText = quantity.split(' ')[0].replace(',', '.');
    const qtyNum = parseFloat(qtyText) || 0;
    const subtotal = (qtyNum * priceNum).toFixed(2).replace('.', ',');

    const li = document.createElement('li');
    li.className = `product-item ${completed ? 'completed' : ''}`;
    li.innerHTML = `
        <div class="item-content">
            <img src="${image}" alt="${altText}" class="${imageClass}">
            <span class="item-name">${name}</span>
        </div>
        
        <div class="item-details">
            <span class="item-price-total">R$ ${subtotal}</span>
            <span class="quantity-display" data-price="${priceNum}">${quantity}</span> 
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

// --- Funções de Sugestão ---

function showSuggestions() {
    const query = removeAccents(productInput.value.toLowerCase());
    suggestionsList.innerHTML = '';

    if (query.length < 2) return;

    const filteredProducts = productsDB.filter(product =>
        removeAccents(product.name.toLowerCase()).includes(query)
    );

    filteredProducts.forEach(product => {
        const li = document.createElement('li');
        li.textContent = product.name;
        li.addEventListener('click', () => {
            productInput.value = product.name;
            addProduct();
        });
        suggestionsList.appendChild(li);
    });
}

// --- Lógica Principal ---

function addProduct() {
    const productNameInput = productInput.value.trim();
    if (productNameInput === '') return;

    const productData = productsDB.find(item =>
        removeAccents(item.name.toLowerCase()) === removeAccents(productNameInput.toLowerCase())
    );

    const isPlaceholder = !productData; 
    const imageUrl = isPlaceholder ? "https://via.placeholder.com/40" : productData.image;
    const displayName = isPlaceholder ? productNameInput : productData.name;
    const unitType = productData ? productData.unit : "un";

    // Agora pede APENAS a quantidade. O preço começa em 0.
    let inputQty = prompt(`Quantos(as) ${unitType} de ${displayName}?`, "1");
    if (inputQty === null) return;
    let quantityValue = parseFloat(inputQty.replace(',', '.')) || 1;

    // Preço inicial automático como 0
    let priceValue = 0;

    const formattedQuantity = (quantityValue % 1 === 0) 
        ? quantityValue.toString() + " " + unitType 
        : quantityValue.toFixed(2).replace('.', ',') + " " + unitType;

    renderItem(displayName, formattedQuantity, priceValue, imageUrl, false, isPlaceholder);
    
    productInput.value = '';
    suggestionsList.innerHTML = '';
    saveList();
    calculateTotal();
    checkCompletion();
}

// --- Event Listeners ---

addProductBtn.addEventListener('click', addProduct);
productInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addProduct(); });
productInput.addEventListener('input', showSuggestions);

productList.addEventListener('click', (e) => {
    const target = e.target;
    const item = target.closest('.product-item');
    if (!item) return;

    // Ação de Check
    if (target.closest('.check-btn')) {
        item.classList.toggle('completed');
        saveList();
        checkCompletion();
    }

    // Ação de Remover
    if (target.closest('.remove-btn')) {
        item.remove();
        saveList();
        calculateTotal();
        checkCompletion();
    }

    // Ação de Editar Preço (Ao clicar no valor R$)
    if (target.closest('.item-price-total')) {
        editPrice(item);
    }

    // Controle de Quantidade (+ / -)
    if (target.closest('.increase-qty-btn') || target.closest('.decrease-qty-btn')) {
        const qtySpan = item.querySelector('.quantity-display');
        const match = qtySpan.textContent.match(/^([\d\.,]+)\s*([a-zA-Z]+)$/);
        
        if (match) {
            let quantity = parseFloat(match[1].replace(',', '.'));
            const unit = match[2];
            const step = (['kg', 'L', 'ml', 'g'].includes(unit)) ? 0.5 : 1;
            const priceUnit = parseFloat(qtySpan.dataset.price) || 0;

            if (target.closest('.increase-qty-btn')) quantity += step;
            if (target.closest('.decrease-qty-btn') && quantity > step) quantity -= step;

            qtySpan.textContent = (quantity % 1 === 0) 
                ? quantity.toString() + " " + unit 
                : quantity.toFixed(2).replace('.', ',') + " " + unit;
            
            // Atualiza subtotal baseado no preço unitário que já está no dataset
            const newSubtotal = quantity * priceUnit;
            item.querySelector('.item-price-total').textContent = `R$ ${newSubtotal.toFixed(2).replace('.', ',')}`;
            
            saveList();
            calculateTotal();
        }
    }
});

clearListBtn.addEventListener('click', () => {
    if(confirm("Deseja zerar toda a lista?")) {
        localStorage.removeItem('shoppingList');
        productList.innerHTML = '';
        calculateTotal();
        checkCompletion();
    }
});

document.addEventListener('DOMContentLoaded', loadList);