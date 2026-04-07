document.addEventListener('DOMContentLoaded', ()=>{
    const btnDelete = document.getElementById('btn-delete');
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
        // ingredients
        const ings = (data.ingredients||'').split(',').filter(s=>s.trim());
        const steps = (data.steps||'').split('\n').filter(s=>s.trim());
        // populate lists
        const ingList = document.getElementById('edit-ingredients-list'); ingList.innerHTML='';
        ings.forEach((v,i)=>{ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>{ li.remove(); }); li.appendChild(x); ingList.appendChild(li); });
        const stepList = document.getElementById('edit-steps-list'); stepList.innerHTML='';
        steps.forEach((v,i)=>{ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>{ li.remove(); }); li.appendChild(x); stepList.appendChild(li); });
        editModal.classList.remove('hidden');
    });

    // allow adding ingredients/steps in modal (prevent mobile "Next" behavior)
    const editIngInput = document.getElementById('edit-ingredient-input');
    const editStepInput = document.getElementById('edit-step-input');
    function addEditIngredient(v){ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>li.remove()); li.appendChild(x); document.getElementById('edit-ingredients-list').appendChild(li); }
    function addEditStep(v){ const li=document.createElement('li'); li.textContent=v; const x=document.createElement('button'); x.className='btn'; x.textContent='x'; x.style.marginLeft='8px'; x.addEventListener('click', ()=>li.remove()); li.appendChild(x); document.getElementById('edit-steps-list').appendChild(li); }

    const editIngHandler = (e)=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const v=e.target.value.trim(); if(v){ addEditIngredient(v); e.target.value=''; } } };
    const editStepHandler = (e)=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const v=e.target.value.trim(); if(v){ addEditStep(v); e.target.value=''; } } };
    editIngInput.addEventListener('keydown', editIngHandler, {capture:true});
    editIngInput.addEventListener('keypress', editIngHandler, {capture:true});
    editStepInput.addEventListener('keydown', editStepHandler, {capture:true});
    editStepInput.addEventListener('keypress', editStepHandler, {capture:true});

    editCancel.addEventListener('click', ()=>{ editModal.classList.add('hidden'); });

    editForm.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const title = document.getElementById('edit-title').value.trim();
        const ings = Array.from(document.getElementById('edit-ingredients-list').children).map(li=>li.firstChild.textContent.trim());
        const steps = Array.from(document.getElementById('edit-steps-list').children).map(li=>li.firstChild.textContent.trim());
        const payload = { title, ingredients: ings.join(','), steps: steps.join('\n') };
        const res = await fetch('/api/recipes/'+RECIPE_ID, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
        if(res.ok){ editModal.classList.add('hidden'); window.location.reload(); }
        else{ alert('Error actualizando'); }
    });
});
