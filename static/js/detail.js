document.addEventListener('DOMContentLoaded', ()=>{
    const btnDelete = document.getElementById('btn-delete');
    if(!btnDelete) return; // not on recipe detail page
    const btnEdit = document.getElementById('btn-edit');
    const confirmModal = document.getElementById('confirm-modal');
    const editModal = document.getElementById('edit-modal');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    const editCancel = document.getElementById('edit-cancel');
    const editForm = document.getElementById('edit-form');

    // delete flow
    btnDelete.addEventListener('click', ()=>{ confirmModal.classList.remove('hidden'); });
    cancelDelete.addEventListener('click', ()=>{ confirmModal.classList.add('hidden'); });
    confirmDelete.addEventListener('click', async ()=>{
        const res = await fetch('/api/recipes/'+RECIPE_ID, {method:'DELETE'});
        if(res.ok){ window.location.href = '/recipes'; }
        else{ alert('Error eliminando'); }
    });

    // edit flow - populate and open
    btnEdit.addEventListener('click', async ()=>{
        // fetch current recipe
        const res = await fetch('/api/recipes/'+RECIPE_ID);
        const data = await res.json();
        document.getElementById('edit-title').value = data.title || '';
        // ingredients: try parse JSON else fallback to comma-separated
        let ings = [];
        try{
            if(data.ingredients){
                const parsed = JSON.parse(data.ingredients);
                if(Array.isArray(parsed)) ings = parsed;
            }
        }catch(e){
            // fallback: treat as comma-separated strings
            ings = (data.ingredients||'').split(',').filter(s=>s.trim()).map(s=>({ title: s.trim(), quantity:'', unit:'', cost:0 }));
        }
        const steps = (data.steps||'').split('\n').filter(s=>s.trim());
        // populate ingredient list UI and set up editable array
        window._editIngredients = ings.slice();
        const ingList = document.getElementById('edit-ingredients-list'); ingList.innerHTML='';
        function renderEditIngredients(){
            ingList.innerHTML='';
            window._editIngredients.forEach((ing,i)=>{
                const li = document.createElement('li');
                const qtyPart = ing.quantity ? ` - ${ing.quantity}${ing.unit}` : '';
                li.textContent = `${ing.title}${qtyPart} ($${Number(ing.cost||0).toFixed(2)}) `;
                const x = document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px';
                x.addEventListener('click', ()=>{ window._editIngredients.splice(i,1); renderEditIngredients(); updateEditTotal(); });
                li.appendChild(x); ingList.appendChild(li);
            });
        }
        renderEditIngredients();
        // populate steps
        const stepList = document.getElementById('edit-steps-list'); stepList.innerHTML='';
        steps.forEach((v,i)=>{ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>{ li.remove(); }); li.appendChild(x); stepList.appendChild(li); });
        editModal.classList.remove('hidden');
        // set initial edit total
        function updateEditTotal(){ const total = (window._editIngredients||[]).reduce((s,it)=>s + (Number(it.cost)||0),0); document.getElementById('edit-total-cost').textContent = total.toFixed(2); }
        updateEditTotal();
    });

    // allow adding ingredients/steps in modal (prevent mobile "Next" behavior)
    const editStepInput = document.getElementById('edit-step-input');
    const editIngBtn = document.getElementById('btn-open-edit-ingredient');
    const editIngredientModal = document.getElementById('edit-ingredient-modal');
    const editIngredientForm = document.getElementById('edit-ingredient-form');
    const editIngredientCancel = document.getElementById('edit-ingredient-cancel');

    editStepInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const v=e.target.value.trim(); if(v){ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>li.remove()); li.appendChild(x); document.getElementById('edit-steps-list').appendChild(li); e.target.value=''; } } }, {capture:true});

    editCancel.addEventListener('click', ()=>{ editModal.classList.add('hidden'); });

    // Open edit-ingredient modal
    editIngBtn.addEventListener('click', ()=>{ editIngredientModal.classList.remove('hidden'); });
    editIngredientCancel.addEventListener('click', ()=>{ editIngredientModal.classList.add('hidden'); editIngredientForm.reset(); });
    editIngredientForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const title = document.getElementById('edit-ing-title').value.trim();
        if(!title) return alert('Título del ingrediente requerido');
        const quantity = document.getElementById('edit-ing-quantity').value.trim();
        const unit = document.getElementById('edit-ing-unit').value;
        const cost = Number(document.getElementById('edit-ing-cost').value) || 0;
        window._editIngredients = window._editIngredients || [];
        window._editIngredients.push({ title, quantity, unit, cost });
        // re-render
        const renderFn = ()=>{
            const ingList = document.getElementById('edit-ingredients-list'); ingList.innerHTML = '';
            (window._editIngredients||[]).forEach((ing,i)=>{
                const li = document.createElement('li');
                const qtyPart = ing.quantity ? ` - ${ing.quantity}${ing.unit}` : '';
                li.textContent = `${ing.title}${qtyPart} ($${Number(ing.cost||0).toFixed(2)}) `;
                const x = document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px';
                x.addEventListener('click', ()=>{ window._editIngredients.splice(i,1); renderFn(); updateEditTotal(); });
                li.appendChild(x); ingList.appendChild(li);
            });
        };
        renderFn();
        const updateEditTotal = ()=>{ const total = (window._editIngredients||[]).reduce((s,it)=>s + (Number(it.cost)||0),0); document.getElementById('edit-total-cost').textContent = total.toFixed(2); };
        updateEditTotal();
        editIngredientForm.reset();
        editIngredientModal.classList.add('hidden');
    });

    editForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const title = document.getElementById('edit-title').value.trim();
        const steps = Array.from(document.getElementById('edit-steps-list').children).map(li=>li.firstChild.textContent.trim());
        const ingredientsPayload = JSON.stringify(window._editIngredients || []);
        const payload = { title, ingredients: ingredientsPayload, steps: steps.join('\n') };
        const res = await fetch('/api/recipes/'+RECIPE_ID, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(res.ok){ editModal.classList.add('hidden'); window.location.reload(); }
        else{ alert('Error actualizando'); }
    });
});
