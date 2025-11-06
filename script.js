const productInput = document.getElementById('productInput');
const addProductBtn = document.getElementById('addProductBtn');
const productList = document.getElementById('productList');
const suggestionsList = document.getElementById('suggestions');
const clearListBtn = document.getElementById('clearListBtn');
const completionMessage = document.getElementById('completionMessage');

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


// Salva a lista no localStorage
function saveList() {
    const items = [];
    document.querySelectorAll('.product-item').forEach(item => {
        const imgElement = item.querySelector('img');
        const isPlaceholder = imgElement.classList.contains('no-image');
        

        const quantityText = item.querySelector('.quantity-display').textContent; 
        const unitMatch = quantityText.match(/[a-zA-Z]+$/);
        const unit = unitMatch ? unitMatch[0].trim() : '';

        items.push({
            name: item.querySelector('span').textContent,
            quantity: quantityText, // Salva o valor completo (ex: "1,50 kg")
            unit: unit,
            image: imgElement.src,
            completed: item.classList.contains('completed'),
            isPlaceholder: isPlaceholder 
        });
    });
    localStorage.setItem('shoppingList', JSON.stringify(items));
}

// Carrega a lista do localStorage 
function loadList() {
    const items = JSON.parse(localStorage.getItem('shoppingList')) || [];
    productList.innerHTML = ''; 
    
    items.forEach(item => {
        const isPlaceholder = item.image === "https://via.placeholder.com/40" || item.isPlaceholder;
        const imageClass = isPlaceholder ? 'no-image' : '';
        const altText = isPlaceholder ? '' : 'Imagem do Produto'; 
        
        const li = document.createElement('li');
        li.className = `product-item ${item.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="item-content">
                <img src="${item.image}" alt="${altText}" class="${imageClass}">
                <span>${item.name}</span>
            </div>
            
            <div class="item-details">
                <span class="quantity-display">${item.quantity}</span> 
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
    });
    checkCompletion();
}

// --- Funções de Sugestão ---

function showSuggestions() {
    const query = removeAccents(productInput.value.toLowerCase());
    suggestionsList.innerHTML = '';

    if (query.length < 2) {
        return;
    }

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

// --- Lógica Principal da Lista de Compras  ---

// Adicionar produto
function addProduct() {
    const productNameInput = productInput.value.trim();
    if (productNameInput === '') {
        alert('Por favor, insira o nome de um produto.');
        return;
    }

    const productData = productsDB.find(item =>
        removeAccents(item.name.toLowerCase()) === removeAccents(productNameInput.toLowerCase())
    );

    // Variáveis de controle
    const isPlaceholder = !productData; 
    const imageUrl = isPlaceholder ? "https://via.placeholder.com/40" : productData.image;
    const displayName = isPlaceholder ? productNameInput : productData.name;
    const imageClass = isPlaceholder ? 'no-image' : ''; 
    const altText = isPlaceholder ? '' : 'Imagem do Produto'; 
    
    // Define a unidade. Se não estiver no DB, usa "un" como padrão.
    const unitType = productData ? productData.unit : "un";

    // Processamento de Duplicidade 
    const existingItems = document.querySelectorAll('#productList .item-content span');
    let isDuplicate = false;
    existingItems.forEach(item => {
        if (removeAccents(item.textContent.toLowerCase()) === removeAccents(displayName.toLowerCase())) {
            isDuplicate = true;
        }
    });

    if (isDuplicate) {
        const confirmAdd = confirm(`O produto "${displayName}" já foi adicionado. Deseja adicioná-lo novamente?`);
        if (!confirmAdd) {
            productInput.value = '';
            suggestionsList.innerHTML = '';
            return;
        }
    }
    
    // SOLICITAÇÃO DA QUANTIDADE E UNIDADE 
    let quantityValue;
    let validQuantity = false;

    while (!validQuantity) {
        const promptMessage = `Quantos(as) ${unitType} de ${displayName} você precisa? (Use ponto ou vírgula para decimais, ex: 1.5)`;
        const input = prompt(promptMessage);

        if (input === null || input.trim() === "") {
            quantityValue = 1; // Padrão se o usuário cancelar ou deixar vazio
            validQuantity = true;
        } else {
            // Permite vírgula ou ponto, mas converte para ponto para parseFloat
            const numericValue = parseFloat(input.replace(',', '.')); 
            if (!isNaN(numericValue) && numericValue > 0) {
                quantityValue = numericValue;
                validQuantity = true;
            } else {
                alert("Por favor, insira um número válido e positivo.");
            }
        }
    }

    // Formata a exibição da quantidade (ex: "1 un", "1,50 kg")
    const formattedQuantity = (quantityValue % 1 === 0) 
        ? quantityValue.toString() + " " + unitType // Ex: "2 kg"
        : quantityValue.toFixed(2).replace('.', ',') + " " + unitType; // Ex: "1,50 kg"

    // Criação do Elemento na Lista 
    const li = document.createElement('li');
    li.className = 'product-item';
    li.innerHTML = `
        <div class="item-content">
            <img src="${imageUrl}" alt="${altText}" class="${imageClass}">
            <span>${displayName}</span>
        </div>
        
        <div class="item-details">
            <span class="quantity-display">${formattedQuantity}</span> 
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
    productInput.value = '';
    suggestionsList.innerHTML = '';
    saveList();
    checkCompletion();
}

// --- Event Listeners  ---

addProductBtn.addEventListener('click', addProduct);

productInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addProduct();
    }
});

productInput.addEventListener('input', showSuggestions);

productList.addEventListener('click', (e) => {
    const target = e.target;
    const item = target.closest('.product-item');

    if (!item) return;

    if (target.closest('.check-btn')) {
        item.classList.toggle('completed');
        saveList();
        checkCompletion();
    }

    if (target.closest('.remove-btn')) {
        productList.removeChild(item);
        saveList();
        checkCompletion();
    }

    // Lógica de Incremento/Decremento 
    const quantitySpan = item.querySelector('.quantity-display'); 
    const fullQuantityText = quantitySpan.textContent;
    
   
    const match = fullQuantityText.match(/^([\d\.,]+)\s*([a-zA-Z]+)$/);
    
    if (match) {
        // Converte para número, aceitando vírgula como decimal
        let quantity = parseFloat(match[1].replace(',', '.'));
        const unitType = match[2];
        
        // Define o passo de incremento (0.5 para peso/volume, 1 para unidades)
        const step = (unitType === 'kg' || unitType === 'L' || unitType === 'ml' || unitType === 'g') ? 0.5 : 1; 

        if (target.closest('.increase-qty-btn')) {
            quantity += step;
        }

        if (target.closest('.decrease-qty-btn')) {
            if (quantity > step) {
                quantity -= step;
            } else {
               
                return;
            }
        }
        
        // Atualiza o Span com o novo valor formatado
        const formattedQuantity = (quantity % 1 === 0) 
            ? quantity.toString() + " " + unitType
            : quantity.toFixed(2).replace('.', ',') + " " + unitType;
            
        quantitySpan.textContent = formattedQuantity;
        saveList();
    }
});

clearListBtn.addEventListener('click', () => {
    localStorage.removeItem('shoppingList');
    productList.innerHTML = '';
    checkCompletion();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.input-area')) {
        suggestionsList.innerHTML = '';
    }
});


document.addEventListener('DOMContentLoaded', loadList);