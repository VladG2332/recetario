document.addEventListener('DOMContentLoaded', function(){
    const cards = document.getElementById('cards');
    const btnNew = document.getElementById('btn-new');
    const modal = document.getElementById('modal');
    const form = document.getElementById('recipe-form');
    const btnCancel = document.getElementById('btn-cancel');
    const modalTitle = document.getElementById('modal-title');

    function openModal(edit=false){
        modal.classList.remove('hidden');
        modal.querySelector('input,textarea').focus();
        modalTitle.textContent = edit ? 'Editar receta' : 'Crear receta';
    }
    function closeModal(){
        modal.classList.add('hidden');
        form.reset();
        document.getElementById('recipe-id').value = '';
    }

    btnNew.addEventListener('click', ()=> openModal(false));
    btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });

    async function fetchRecipes(){
        const res = await fetch('/api/recipes');
        const data = await res.json();
        renderCards(data);
    }

    function renderCards(list){
        cards.innerHTML = '';
        if(!list.length){
            cards.innerHTML = '<p>No hay recetas todavía. Crea la primera con "Nueva receta".</p>';
            return;
        }
        list.forEach(r=>{
            const el = document.createElement('article');
            el.className = 'card';
            el.innerHTML = `
                <h3>${escapeHtml(r.title)}</h3>
                <div class="meta">Creada: ${new Date(r.created_at).toLocaleString()}</div>
                <p>${escapeHtml(r.description || '')}</p>
                <div class="pill">Ingredientes: ${escapeHtml((r.ingredients||'').split(',').slice(0,3).join(', '))}</div>
                <div style="height:8px"></div>
                <div class="actions">
                    <button class="btn" data-edit="${r.id}">Editar</button>
                    <button class="btn" data-delete="${r.id}">Eliminar</button>
                </div>
            `;
            cards.appendChild(el);
        });
        // bind buttons
        cards.querySelectorAll('[data-edit]').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
                const id = btn.getAttribute('data-edit');
                const res = await fetch('/api/recipes/'+id);
                const data = await res.json();
                document.getElementById('recipe-id').value = data.id;
                document.getElementById('title').value = data.title||'';
                document.getElementById('description').value = data.description||'';
                document.getElementById('ingredients').value = data.ingredients||'';
                document.getElementById('steps').value = data.steps||'';
                openModal(true);
            });
        });
        cards.querySelectorAll('[data-delete]').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
                const id = btn.getAttribute('data-delete');
                if(!confirm('¿Eliminar esta receta?')) return;
                await fetch('/api/recipes/'+id, {method:'DELETE'});
                fetchRecipes();
            });
        });
    }

    form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const id = document.getElementById('recipe-id').value;
        const payload = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            ingredients: document.getElementById('ingredients').value.trim(),
            steps: document.getElementById('steps').value.trim()
        };
        if(!payload.title){ alert('El título es obligatorio.'); return; }
        if(id){
            await fetch('/api/recipes/'+id, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        } else {
            await fetch('/api/recipes', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        }
        closeModal();
        fetchRecipes();
    });

    function escapeHtml(s){
        return String(s).replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});
    }

    // initial load
    fetchRecipes();
});
