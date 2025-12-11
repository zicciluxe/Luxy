// --- 1. CONFIGURATION AND INITIALIZATION ---

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd_6xPr8I_lipGbzOQ3pcYBF-dggXbiEU",
    authDomain: "boss-luxe-6c9a8.firebaseapp.com",
    projectId: "boss-luxe-6c9a8",
    storageBucket: "boss-luxe-6c9a8.firebasestorage.app",
    messagingSenderId: "152048842414",
    appId: "1:152048842414:web:e82fd4b44a604b20679f3f"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Paystack Public Key
const PAYSTACK_PUBLIC_KEY = 'pk_live_98575428080557d261e91cb92fe745f878fc4278';

// Data Bundles Definition
const dataBundles = [
    { name: "MTN 1GB", price: 5.50, network: "MTN" },
    { name: "MTN 2GB", price: 12.00, network: "MTN" },
    { name: "MTN 3GB", price: 18.00, network: "MTN" },
    { name: "MTN 4GB", price: 25.00, network: "MTN" },
    { name: "MTN 5GB", price: 29.00, network: "MTN" },
    { name: "MTN 6GB", price: 36.00, network: "MTN" },
    { name: "MTN 10GB", price: 55.00, network: "MTN" },
    // Add TELECEL and AIRTEL TIGO bundles here when available
];

let cart = []; // Global Cart Array
let currentUser = null; // Global User Object

// --- 2. UI ELEMENTS AND EVENT LISTENERS ---

const body = document.body;
const sideMenu = document.getElementById('side-menu');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const authButton = document.getElementById('auth-button');
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutButton = document.getElementById('checkout-button');
const productGrid = document.getElementById('data-products-list');

// --- Theme Toggle (Dark/Light Mode) ---
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    themeToggle.textContent = isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    }
    renderDataProducts('MTN'); // Load default products on page load
    updateCartUI(); // Load cart from session storage
});

// --- Side Menu Toggle ---
menuToggle.addEventListener('click', () => {
    sideMenu.classList.toggle('hidden');
});
// Close menu when a link is clicked (for mobile UX)
sideMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        sideMenu.classList.add('hidden');
        // Handle section visibility (simple client-side routing)
        const targetId = link.getAttribute('href').substring(1);
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// --- Tab/Dashboard Switching ---
document.querySelectorAll('.category-tabs .tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        // Remove active class from all buttons and content
        document.querySelectorAll('.category-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.dashboard-content').forEach(content => content.classList.add('hidden'));

        // Add active class to clicked button and target content
        e.target.classList.add('active');
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// --- Network Filter Buttons ---
document.querySelectorAll('.network-buttons .network-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.network-buttons .network-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const network = e.target.getAttribute('data-network');
        renderDataProducts(network);
    });
});

// --- Cart Modal & Checkout ---
cartButton.addEventListener('click', () => {
    cartModal.classList.remove('hidden');
});

document.querySelector('.close-modal-btn').addEventListener('click', () => {
    cartModal.classList.add('hidden');
});

checkoutButton.addEventListener('click', handleCheckout);

// --- 3. FIREBASE AUTHENTICATION LOGIC ---

auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        authButton.textContent = 'Logout';
        authButton.onclick = handleLogout;
        console.log("User logged in:", user.email);
        // Display sections that require login, like Transactions/Orders
    } else {
        authButton.textContent = 'Login';
        authButton.onclick = handleLogin;
        console.log("User logged out");
        // Hide sections that require login
    }
});

function handleLogin() {
    // Basic Google Sign-in Pop-up (or replace with your custom form logic)
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login successful:", result.user.email);
            // Optionally, save user profile to Firestore
        })
        .catch((error) => {
            console.error("Login failed:", error.message);
            alert("Login Failed: " + error.message);
        });
}

function handleLogout() {
    auth.signOut()
        .then(() => {
            console.log("User logged out.");
            alert("You have been logged out.");
        })
        .catch((error) => {
            console.error("Logout error:", error.message);
        });
}

// --- 4. DATA PRODUCT RENDERING AND CART MANAGEMENT ---

function renderDataProducts(network) {
    productGrid.innerHTML = ''; // Clear existing products
    
    // Filter bundles by the selected network (only MTN is active for now)
    const filteredBundles = dataBundles.filter(b => b.network === network);

    if (network !== 'MTN') {
        productGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; padding: 50px;">${network} bundles are coming soon! Please check back later.</p>`;
        return;
    }

    filteredBundles.forEach(bundle => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.innerHTML = `
            <h4>${bundle.name}</h4>
            <p>High-speed ${bundle.network} data package.</p>
            <div class="price">GHC ${bundle.price.toFixed(2)}</div>
            <button class="add-to-cart-btn" data-name="${bundle.name}" data-price="${bundle.price.toFixed(2)}">
                Add to Cart
            </button>
        `;
        productGrid.appendChild(card);
    });

    // Attach add-to-cart listener to new buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const name = e.target.getAttribute('data-name');
            const price = parseFloat(e.target.getAttribute('data-price'));
            addToCart({ name, price, quantity: 1 });
        });
    });
}

function addToCart(item) {
    // Simple check: Data bundles are generally single-purchase, but we'll allow multiple for this demo.
    const existingItem = cart.find(i => i.name === item.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(item);
    }
    updateCartUI();
    console.log("Cart updated:", cart);
}

function updateCartUI() {
    cartItemsList.innerHTML = '';
    let total = 0;
    let itemCount = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} (${item.quantity}x)</span>
            <span>GHC ${itemTotal.toFixed(2)}</span>
            <button class="remove-from-cart-btn" data-index="${index}">🗑️</button>
        `;
        cartItemsList.appendChild(li);
    });

    cartTotalAmount.textContent = total.toFixed(2);
    document.getElementById('cart-count').textContent = itemCount;

    // Attach remove listeners
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            cart.splice(index, 1);
            updateCartUI();
        });
    });
    
    // Disable checkout if cart is empty
    checkoutButton.disabled = total === 0;
    checkoutButton.textContent = total === 0 ? "Cart is Empty" : "Proceed to Checkout";
}

// --- 5. PAYSTACK PAYMENT & FIRESTORE TRANSACTION ---

function handleCheckout() {
    if (!currentUser) {
        alert("Please log in to proceed with your payment.");
        handleLogin(); // Prompt login
        return;
    }

    if (cart.length === 0) {
        alert("Your cart is empty. Please add an item.");
        return;
    }

    // Get total and convert to kobo (Paystack requires amount in kobo/pesewas)
    const totalGHC = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalKobo = Math.round(totalGHC * 100);

    // Prompt for phone number for data bundle delivery
    const phoneNumber = prompt("Enter the recipient's phone number for the data bundle (e.g., 054xxxxxxx):");
    if (!phoneNumber || phoneNumber.length < 9) {
        alert("A valid phone number is required to complete the data bundle order.");
        return;
    }

    // Initialize Paystack Handler
    let handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: totalKobo,
        currency: 'GHS',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1), // Unique transaction reference
        metadata: {
            custom_fields: [
                {
                    display_name: "Items",
                    variable_name: "cart_items",
                    value: JSON.stringify(cart)
                },
                {
                    display_name: "Recipient Phone",
                    variable_name: "phone_number",
                    value: phoneNumber
                }
            ]
        },
        callback: function(response){
            // Payment was successful
            saveTransaction({
                ...response,
                status: 'success',
                cart: cart,
                recipient_phone: phoneNumber,
                amount_ghc: totalGHC
            });
            alert('Payment Complete! Transaction Reference: ' + response.reference + '. Your data bundle will be delivered within 30min-1hr.');
            cart = []; // Clear cart on successful payment
            updateCartUI();
            cartModal.classList.add('hidden');
        },
        onClose: function(){
            // User closed the payment modal
            alert('Transaction cancelled. You can try again.');
        }
    });
    
    // Open the Paystack payment modal
    handler.openIframe();
}

/**
 * Saves transaction history to Firestore
 * @param {object} transactionData - The data object from Paystack callback and local info.
 */
function saveTransaction(transactionData) {
    if (!currentUser) {
        console.error("Cannot save transaction: User not logged in.");
        return;
    }
    
    db.collection("transactions").add({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: transactionData.cart,
        amount_ghc: transactionData.amount_ghc,
        recipient_phone: transactionData.recipient_phone,
        paystack_ref: transactionData.reference,
        payment_status: transactionData.status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then((docRef) => {
        console.log("Transaction successfully written to Firestore with ID: ", docRef.id);
        // You can also add logic here to update the 'Transactions' UI section
    })
    .catch((error) => {
        console.error("Error writing transaction to Firestore: ", error);
    });
}
