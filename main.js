// Variables
const mealsEl = document.getElementById("meals");
const favoriteContainer = document.getElementById("fav-meals");
const searchTerm = document.getElementById("search-term");
const searchBtn = document.getElementById("search");
const mealInfoEl = document.getElementById("meal-info");
const mealPopup = document.getElementById("meal-popup");
const popupCloseBtn = document.getElementById("close-popup");

let currentSearchTerm = '';
let currentPage = 1;
const recipesPerLoad = 9;

// Create a container for meals with grid layout
const mealsContainer = document.createElement('div');
mealsContainer.classList.add('meals-container');
mealsEl.appendChild(mealsContainer);

// Create load more button
const loadMoreBtn = document.createElement('button');
loadMoreBtn.classList.add('load-more');
loadMoreBtn.textContent = 'Load More Recipes';
loadMoreBtn.style.display = 'none';
mealsEl.appendChild(loadMoreBtn);

// Utility Functions
async function getRandomMeal() {
    const response = await fetch(
        "https://www.themealdb.com/api/json/v1/1/random.php"
    );
    const respData = await response.json();
    return respData.meals[0];
}

async function getMealById(id) {
    const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );
    const data = await response.json();
    return data.meals[0];
}

async function getMealsBySearch(term, page = 1) {
    const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${term}`
    );
    const data = await response.json();
    const meals = data.meals || [];

    // Calculate pagination
    const startIndex = (page - 1) * recipesPerLoad;
    const endIndex = startIndex + recipesPerLoad;
    return {
        meals: meals.slice(startIndex, endIndex),
        hasMore: endIndex < meals.length
    };
}

function getMealsFromLs() {
    return JSON.parse(localStorage.getItem("mealIds")) || [];
}

function addMealToLs(mealId) {
    const mealIds = getMealsFromLs();
    localStorage.setItem("mealIds", JSON.stringify([...mealIds, mealId]));
}

function removeFromLs(mealId) {
    const mealIds = getMealsFromLs();
    localStorage.setItem(
        "mealIds",
        JSON.stringify(mealIds.filter((id) => id != mealId))
    );
}

function getIngredientsList(mealData) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = mealData[`strIngredient${i}`];
        const measure = mealData[`strMeasure${i}`];
        if (ingredient) {
            ingredients.push(`${ingredient} - ${measure}`);
        }
    }
    return ingredients;
}

// Core Functions
async function getRandomMeals() {
    mealsContainer.innerHTML = '';
    for (let i = 0; i < recipesPerLoad; i++) {
        try {
            const meal = await getRandomMeal();
            addMeal(meal);
        } catch (error) {
            console.error('Error fetching random meal:', error);
        }
    }
}

async function fetchFavMeals() {
    favoriteContainer.innerHTML = "";
    const mealIds = getMealsFromLs();

    for (const mealId of mealIds) {
        const meal = await getMealById(mealId);
        addMealToFav(meal);
    }
}

function addMeal(mealData, random = false) {
    const meal = document.createElement("div");
    meal.classList.add("meal");
    meal.dataset.mealId = mealData.idMeal;

    meal.innerHTML = `
        <div class="meal-header">
            ${random ? `<span class="random">Random Recipe</span>` : ""}
            <img
                src="${mealData.strMealThumb}"
                alt="${mealData.strMeal}"
            />
        </div>
        <div class="meal-body">
            <h4>${mealData.strMeal}</h4>
            <button class="fav-btn">
                <i class="fa fa-heart"></i>
            </button>
        </div>
    `;

    const btn = meal.querySelector(".meal-body .fav-btn");

    if (getMealsFromLs().includes(mealData.idMeal)) {
        btn.classList.add("active");
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (btn.classList.contains("active")) {
            removeFromLs(mealData.idMeal);
            btn.classList.remove("active");
        } else {
            addMealToLs(mealData.idMeal);
            btn.classList.add("active");
        }
        fetchFavMeals();
    });

    meal.addEventListener("click", async () => {
        const mealDetails = await getMealById(mealData.idMeal);
        showMealInfo(mealDetails);
    });

    mealsContainer.appendChild(meal);
}

function addMealToFav(mealData) {
    const favMeal = document.createElement("li");

    favMeal.innerHTML = `
        <img
            src="${mealData.strMealThumb}"
            alt="${mealData.strMeal}"
        />
        <span>${mealData.strMeal}</span>
        <button class="clear">&times;</button>
    `;

    favMeal.querySelector(".clear").addEventListener("click", () => {
        removeFromLs(mealData.idMeal);
        fetchFavMeals();
    });

    favMeal.addEventListener("click", () => {
        showMealInfo(mealData);
    });

    favoriteContainer.appendChild(favMeal);
}

function showMealInfo(mealData) {
    mealInfoEl.innerHTML = `
        <h1>${mealData.strMeal}</h1>
        <img src="${mealData.strMealThumb}" alt="${mealData.strMeal}" />
        <p>${mealData.strInstructions}</p>
        <h3>Ingredients:</h3>
        <ul>
            ${getIngredientsList(mealData).map(ingredient => `<li>${ingredient}</li>`).join('')}
        </ul>
    `;

    mealPopup.classList.remove("hidden");
}

// Event Listeners
searchBtn.addEventListener("click", async () => {
    const search = searchTerm.value;
    currentSearchTerm = search;
    currentPage = 1;
    await performSearch();
});

loadMoreBtn.addEventListener('click', async () => {
    currentPage++;
    await performSearch();
});

popupCloseBtn.addEventListener("click", () => {
    mealPopup.classList.add("hidden");
});

async function performSearch() {
    if (currentPage === 1) {
        mealsContainer.innerHTML = "";
    }

    const { meals, hasMore } = await getMealsBySearch(currentSearchTerm, currentPage);

    if (meals) {
        meals.forEach(addMeal);
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    } else {
        mealsContainer.innerHTML = '<p class="no-results">No meals found.</p>';
        loadMoreBtn.style.display = 'none';
    }
}

// Initialization
getRandomMeals();
fetchFavMeals();
