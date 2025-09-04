document.addEventListener('DOMContentLoaded', () => {
    const API = 'http://localhost:8080';
    const tbody = document.querySelector('#tbl tbody');
    const form = document.getElementById('modForm');
    const id = document.getElementById('id');
    const title = document.getElementById('title');
    const description = document.getElementById('description');
    const week = document.getElementById('week');
    const status = document.getElementById('status');
    const formTitle = document.getElementById('formTitle');
    const saveBtn = document.getElementById('saveBtn');

    async function loadModules() {
        try {
            const r = await fetch(`${API}/api/modules`);
            if (!r.ok) throw new Error('Error al cargar los módulos');
            const data = await r.json();
            tbody.innerHTML = '';
            for (const m of data) {
                const tr = document.createElement('tr');
                // Traducción de status para mostrar en el badge
                const statusText = m.status.replace('_', ' ');

                tr.innerHTML = `
                    <td>${m.id}</td>
                    <td>${m.title}</td>
                    <td>${m.week}</td>
                    <td>
                        <span class="status status-${m.status}">${statusText}</span>
                    </td>
                    <td class="row-actions">
                        <button class="action-btn edit" data-id="${m.id}" data-action="edit" title="Editar Módulo">
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                        </button>
                        <button class="action-btn delete" data-id="${m.id}" data-action="delete" title="Eliminar Módulo">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </td>`;
                tbody.appendChild(tr);
            }
        } catch (error) {
            console.error(error);
            tbody.innerHTML = `<tr><td colspan="5">Error al conectar con la API. Asegúrate de que esté en ejecución.</td></tr>`;
        }
    }

    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button.action-btn');
        if (!btn) return;

        const mid = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');

        if (action === 'edit') {
            const r = await fetch(`${API}/api/modules/${mid}`);
            const m = await r.json();
            id.value = m.id;
            title.value = m.title;
            description.value = m.description || '';
            week.value = m.week;
            status.value = m.status;
            formTitle.textContent = `Editando Módulo #${m.id}`;
            saveBtn.textContent = 'Actualizar Módulo';
            form.scrollIntoView({ behavior: 'smooth' });
        }

        if (action === 'delete') {
            if (!confirm('¿Estás seguro de que quieres eliminar este módulo?')) return;
            await fetch(`${API}/api/modules/${mid}`, { method: 'DELETE' });
            await loadModules();
            resetForm();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: title.value.trim(),
            description: description.value.trim(),
            week: Number(week.value),
            status: status.value
        };

        const method = id.value ? 'PUT' : 'POST';
        const url = id.value ? `${API}/api/modules/${id.value}` : `${API}/api/modules`;

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        await loadModules();
        resetForm();
    });

    document.getElementById('resetBtn').onclick = resetForm;

    function resetForm() {
        form.reset(); // Método más sencillo para limpiar el formulario
        id.value = '';
        formTitle.textContent = 'Crear Nuevo Módulo';
        saveBtn.textContent = 'Guardar Cambios';
    }

    // Carga inicial
    loadModules();
});

