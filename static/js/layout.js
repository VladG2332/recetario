document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    btn && btn.addEventListener('click', ()=>{
        if(sidebar.classList.contains('open')){
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-visible');
        } else {
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-visible');
        }
    });
    // close sidebar when clicking outside on small screens
    document.addEventListener('click', (e)=>{
        if(!sidebar) return;
        if(sidebar.classList.contains('open')){
            const inside = sidebar.contains(e.target) || (btn && btn.contains(e.target));
            if(!inside){ sidebar.classList.remove('open'); document.body.classList.remove('sidebar-visible'); }
        }
    });
});
