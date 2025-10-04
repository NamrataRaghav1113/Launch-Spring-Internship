// Global variable to store fetched project data (now read from data.js)
// ALL_PROJECTS will be set to PROJECT_DATA from data.js during initialization
let ALL_PROJECTS = [];

// CATEGORIES is imported from config.js

// --- APPLICATION STATE (Unchanged) ---
let state = {
    searchTerm: '',
    filterCategory: 'All',
    filterBudgetMin: 0,
    filterBudgetMax: 10000,
    sortBy: 'date',
    sortOrder: 'desc', // 'asc' for oldest/lowest, 'desc' for newest/highest
    theme: 'dark' // Initial theme state
};

// --- UTILITIES & ICONS (Unchanged) ---
const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffTime = Math.abs(now - past);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Posted Today";
    if (diffDays < 30) return `${diffDays} days ago`;
    return past.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const ICONS = {
    dollar: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5 mr-1 text-[var(--color-accent)]"><path d="M12 1V23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'
};

// --- RENDER FUNCTIONS (Unchanged, rely on CSS variables) ---

function generateProjectCard(project) {
    const tagsHtml = project.tags.map(tag => `
        <span class="px-3 py-1 text-xs bg-[var(--color-tag-bg)] text-[var(--color-tag-text)] rounded-full font-medium">
            ${tag}
        </span>
    `).join('');

    const clientInitial = project.client.charAt(0);
    const clientLogoUrl = `https://placehold.co/40x40/4b5563/e5e7eb?text=${clientInitial}`;

    return `
        <div class="bg-[var(--color-bg-secondary)] p-6 rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02] border border-[var(--color-border)]">
            <div class="flex justify-between items-start mb-3">
                <h2 class="text-xl font-semibold text-[var(--color-text-primary)]">${project.title}</h2>
                <div class="flex flex-col items-end">
                    <span class="text-2xl font-bold text-[var(--color-accent)] flex items-center">
                        ${ICONS.dollar}
                        $${project.budget.toLocaleString()}
                    </span>
                    <span class="text-xs text-[var(--color-text-subtle)] mt-1">${timeAgo(project.datePosted)}</span>
                </div>
            </div>
            <p class="text-[var(--color-text-subtle)] mb-4 text-sm line-clamp-3">${project.description}</p>
            <div class="flex flex-wrap gap-2 mb-4">
                ${tagsHtml}
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                <div class="flex items-center">
                    <img 
                        src="${clientLogoUrl}" 
                        alt="${project.client} Logo" 
                        class="w-8 h-8 rounded-full object-cover mr-3 shadow-md border border-[var(--color-border)]"
                        onerror="this.onerror=null; this.src='https://placehold.co/40x40/4b5563/e5e7eb?text=?';" 
                    >
                    <span class="text-sm text-[var(--color-text-subtle)]">
                        Client: ${project.client}
                    </span>
                </div>
                <button class="bg-[var(--color-accent)] text-[var(--color-accent-text)] px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-colors duration-200 shadow-md">
                    View & Apply
                </button>
            </div>
        </div>
    `;
}

// --- THEME LOGIC (Unchanged) ---

function applyTheme() {
    const body = document.body;
    body.classList.toggle('light-theme', state.theme === 'light');

    const toggleBtn = document.getElementById('theme-toggle-btn');
    toggleBtn.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;

    renderProjects();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
}


// --- MAIN APPLICATION LOGIC ---

/**
 * Filters and sorts the projects from the global ALL_PROJECTS list.
 */
function filterAndSortProjects() {
    // Synchronously use the global ALL_PROJECTS data
    if (ALL_PROJECTS.length === 0) return [];

    let results = ALL_PROJECTS.filter(project => {
        // 1. Search Filter
        const searchMatch = project.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(state.searchTerm.toLowerCase());

        // 2. Category Filter
        const categoryMatch = state.filterCategory === 'All' || project.category === state.filterCategory;

        // 3. Budget Filter
        const budgetMatch = project.budget >= state.filterBudgetMin && project.budget <= state.filterBudgetMax;

        return searchMatch && categoryMatch && budgetMatch;
    });

    // 4. Sorting
    results.sort((a, b) => {
        let comparison = 0;
        if (state.sortBy === 'date') {
            const dateA = new Date(a.datePosted);
            const dateB = new Date(b.datePosted);
            comparison = dateA - dateB;
        } else if (state.sortBy === 'budget') {
            comparison = a.budget - b.budget;
        }

        // Apply sort order
        return state.sortOrder === 'asc' ? comparison : comparison * -1;
    });

    return results;
}

/**
 * Renders the project cards and updates the results count.
 */
function renderProjects() {
    const projects = filterAndSortProjects();
    const container = document.getElementById('projects-container');
    const countDisplay = document.getElementById('results-count');

    countDisplay.textContent = projects.length;

    if (projects.length === 0 && ALL_PROJECTS.length > 0) {
        // Show 'no match' if projects are loaded but filtered out
        container.innerHTML = `
            <div class="text-center p-12 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                <p class="text-xl text-[var(--color-text-subtle)] font-medium">No projects match your current filters. Try adjusting your search or budget range.</p>
                <button id="clear-search-btn" class="mt-4 text-[var(--color-accent)] hover:opacity-90 transition-opacity underline">
                    Clear search and category filters
                </button>
            </div>
        `;
        document.getElementById('clear-search-btn')?.addEventListener('click', () => {
            state.searchTerm = '';
            state.filterCategory = 'All';
            document.getElementById('search-input').value = '';
            document.getElementById('category-select').value = 'All';
            renderProjects();
        });
        updateSortControls();
        return;
    }

    // Generate and insert HTML for all project cards
    container.innerHTML = projects.map(generateProjectCard).join('');

    // Update sort button active states
    updateSortControls();
}

/**
 * Updates the visual appearance of the sort buttons using CSS variables.
 */
function updateSortControls() {
    document.querySelectorAll('.sort-btn').forEach(button => {
        const sortBy = button.getAttribute('data-sort-by');
        const icon = button.querySelector('svg');

        button.className = 'sort-btn px-3 py-1 text-sm rounded-full transition-colors duration-200 flex items-center font-semibold ' +
            'bg-[var(--color-input-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]';

        if (state.sortBy === sortBy) {
            button.style.color = 'var(--color-accent-text)';
            button.style.backgroundColor = 'var(--color-accent)';

            icon.classList.remove('hidden', 'rotate-180');
            if (state.sortOrder === 'asc') {
                icon.classList.add('rotate-180');
            } else {
                icon.classList.remove('rotate-180');
            }
        } else {
            icon.classList.add('hidden');
            button.style.color = '';
            button.style.backgroundColor = '';
        }
    });
}


/**
 * Initializes all event listeners and performs initial data loading.
 */
function initialize() {
    // 0. Synchronously load project data from the variable defined in data.js
    // This is safe because data.js is loaded via a <script> tag which is not blocked.
    // PROJECT_DATA is a global variable created by data.js
    if (typeof PROJECT_DATA !== 'undefined') {
        ALL_PROJECTS = PROJECT_DATA;
    } else {
        console.error("Error: PROJECT_DATA is not defined. Ensure data.js is loaded.");
        // Handle error rendering if data is not available
        document.getElementById('projects-container').innerHTML = `<div class="p-4 text-red-500">Failed to load project data.</div>`;
        return;
    }


    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const budgetRangeInput = document.getElementById('budget-range-input');
    const budgetMinDisplay = document.getElementById('budget-min-display');
    const resetBtn = document.getElementById('reset-filters-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // 1. Populate Category Select
    categorySelect.innerHTML = CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    // 2. Theme Toggle Listener
    themeToggleBtn.addEventListener('click', toggleTheme);

    // 3. Event Listeners for Filters (Unchanged)
    searchInput.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        renderProjects();
    });

    categorySelect.addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        renderProjects();
    });

    budgetRangeInput.addEventListener('input', (e) => {
        state.filterBudgetMin = Number(e.target.value);
        budgetMinDisplay.textContent = state.filterBudgetMin.toLocaleString();
        document.getElementById('budget-max-display').textContent = state.filterBudgetMax.toLocaleString();
        renderProjects();
    });

    resetBtn.addEventListener('click', () => {
        state = {
            searchTerm: '',
            filterCategory: 'All',
            filterBudgetMin: 0,
            filterBudgetMax: 10000,
            sortBy: 'date',
            sortOrder: 'desc',
            theme: state.theme,
        };
        searchInput.value = '';
        categorySelect.value = 'All';
        budgetRangeInput.value = 0;
        budgetMinDisplay.textContent = '0';
        renderProjects();
    });

    // 4. Event Listeners for Sorting (Unchanged)
    document.querySelectorAll('.sort-btn').forEach(button => {
        button.addEventListener('click', () => {
            const newSortBy = button.getAttribute('data-sort-by');

            if (state.sortBy === newSortBy) {
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortBy = newSortBy;
                state.sortOrder = 'desc';
            }
            renderProjects();
        });
    });

    // 5. Initial Render
    applyTheme();
}

// Run initialization when the page loads
window.addEventListener('load', initialize);