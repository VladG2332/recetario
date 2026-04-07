document.addEventListener('DOMContentLoaded', ()=>{
    const ingredientInput = document.getElementById('ingredient-input');
    const ingredientsList = document.getElementById('ingredients-list');
    const stepInput = document.getElementById('step-input');
    const stepsList = document.getElementById('steps-list');
    const form = document.getElementById('new-recipe-form');
    let ingredients = [];
    let steps = [];

    function renderIngredients(){
        ingredientsList.innerHTML = '';
        ingredients.forEach((ing,i)=>{
            const li = document.createElement('li');
            li.textContent = ing + ' ';
            const x = document.createElement('button');
            x.className = 'btn';
            x.textContent = 'x';
            x.style.marginLeft='8px';
            x.addEventListener('click', ()=>{ ingredients.splice(i,1); renderIngredients(); });
            li.appendChild(x);
            ingredientsList.appendChild(li);
        });
    }

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

    ingredientInput.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
            e.preventDefault();
            const v = ingredientInput.value.trim();
            if(v){ ingredients.push(v); ingredientInput.value=''; renderIngredients(); }
        }
    });

    stepInput.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
            e.preventDefault();
            const v = stepInput.value.trim();
            if(v){ steps.push(v); stepInput.value=''; renderSteps(); }
        }
    });

    form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        if(!title){ alert('El título es obligatorio'); return; }
        const payload = {
            title,
            ingredients: ingredients.join(','),
            steps: steps.join('\n'),
            description: ''
        };
        const res = await fetch('/api/recipes', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(res.ok){ window.location.href = '/recipes'; }
        else{ const err = await res.json(); alert(err.error || 'Error creando receta'); }
    });
});
