document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('new-recipe-form');
    if(!form) return; // not on new-recipe page
    const btnOpenIng = document.getElementById('btn-open-ingredient-modal');
    const ingredientModal = document.getElementById('ingredient-modal');
    const ingredientForm = document.getElementById('ingredient-form');
    const ingredientCancel = document.getElementById('ingredient-cancel');
    const ingredientsList = document.getElementById('ingredients-list');
    const totalCostEl = document.getElementById('total-cost');
    const stepInput = document.getElementById('step-input');
    const stepsList = document.getElementById('steps-list');

    let ingredients = [];
    let steps = [];

    function formatIngredient(ing){
        const qtyPart = ing.quantity ? ` - ${ing.quantity}${ing.unit || ''}` : '';
        const costPart = ` ($${Number(ing.cost||0).toFixed(2)})`;
        return `${ing.title}${qtyPart}${costPart}`;
    }

    function renderIngredients(){
        ingredientsList.innerHTML = '';
        ingredients.forEach((ing,i)=>{
            const li = document.createElement('li');
            li.textContent = formatIngredient(ing) + ' ';
            const x = document.createElement('button');
            x.className = 'btn';
            x.textContent = 'x';
            x.style.marginLeft='8px';
            x.addEventListener('click', ()=>{ ingredients.splice(i,1); renderIngredients(); updateTotal(); });
            li.appendChild(x);
            ingredientsList.appendChild(li);
        });
    }

    function updateTotal(){
        const total = ingredients.reduce((s,it)=>s + (Number(it.cost)||0), 0);
        totalCostEl.textContent = total.toFixed(2);
    }

    function addStep(v){ steps.push(v); renderSteps(); }
    function renderSteps(){
        stepsList.innerHTML = '';
        steps.forEach((st,i)=>{
            const li = document.createElement('li');
            li.textContent = st + ' ';
            const x = document.createElement('button');
            x.className = 'btn';
            x.textContent = 'x';
            x.style.marginLeft='8px';
            x.addEventListener('click', ()=>{ steps.splice(i,1); renderSteps(); });
            li.appendChild(x);
            stepsList.appendChild(li);
        });
    }

    // Open modal
    btnOpenIng.addEventListener('click', ()=>{ ingredientModal.classList.remove('hidden'); });
    ingredientCancel.addEventListener('click', ()=>{ ingredientModal.classList.add('hidden'); ingredientForm.reset(); });

    ingredientForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const title = document.getElementById('ing-title').value.trim();
        if(!title){ alert('Título del ingrediente requerido'); return; }
        const quantity = document.getElementById('ing-quantity').value.trim();
        const unit = document.getElementById('ing-unit').value;
        const cost = Number(document.getElementById('ing-cost').value) || 0;
        ingredients.push({ title, quantity, unit, cost });
        ingredientForm.reset();
        ingredientModal.classList.add('hidden');
        renderIngredients();
        updateTotal();
    });

    // Steps: keep Enter behavior
    const stepHandler = (e)=>{
        if(e.key === 'Enter'){
            e.preventDefault(); e.stopPropagation(); const v = e.target.value.trim(); if(v){ addStep(v); e.target.value=''; }
        }
    };
    stepInput.addEventListener('keydown', stepHandler, {capture:true});
    stepInput.addEventListener('keypress', stepHandler, {capture:true});

    form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        if(!title){ alert('El título es obligatorio'); return; }
        const payload = {
            title,
            ingredients: JSON.stringify(ingredients),
            steps: steps.join('\n'),
            description: ''
        };
        const res = await fetch('/api/recipes', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(res.ok){ window.location.href = '/recipes'; }
        else{ const err = await res.json(); alert(err.error || 'Error creando receta'); }
    });
});
