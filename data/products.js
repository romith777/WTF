// Initialize empty arrays
let tees = [];
let hoodies = [];
let cargos = [];
let shirts = [];
let jeans = [];
let joggers = [];

// Flags
let productsLoaded = false;
let productsLoading = false;

// Fetch products from backend
async function fetchProducts() {
    if (productsLoading) {
        return;
    }
    
    productsLoading = true;
    
    try {
        const response = await fetch(`${API_URI}/products`);
        console.log("Fetching products from:", `${API_URI}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update global arrays
        tees = Array.isArray(data.tees) ? data.tees : [];
        hoodies = Array.isArray(data.hoodies) ? data.hoodies : [];
        cargos = Array.isArray(data.cargos) ? data.cargos : [];
        shirts = Array.isArray(data.shirts) ? data.shirts : [];
        jeans = Array.isArray(data.jeans) ? data.jeans : [];
        joggers = Array.isArray(data.joggers) ? data.joggers : [];
        
        productsLoaded = true;
        productsLoading = false;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('productsLoaded', {
            detail: {
                tees: tees,
                hoodies: hoodies,
                cargos: cargos,
                shirts: shirts,
                jeans: jeans,
                joggers: joggers
            }
        }));
        
        return true;
    } catch (error) {
        console.error('Error fetching products:', error);
        productsLoaded = false;
        productsLoading = false;
        
        // Set to empty arrays on error
        tees = [];
        hoodies = [];
        cargos = [];
        shirts = [];
        jeans = [];
        joggers = [];
        
        return false;
    }
}

// Auto-fetch when script loads
fetchProducts();
