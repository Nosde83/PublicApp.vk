document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registrado com sucesso:', registration);
            }).catch(error => {
                console.log('Falha ao registrar o Service Worker:', error);
            });
        });
    }

    const views = {
        'login': document.getElementById('login-view'),
        'campo': document.getElementById('campo-view'),
        'revisitas': document.getElementById('revisitas-view'),
        'estudantes': document.getElementById('estudantes-view'),
        'relatorio': document.getElementById('relatorio-view'),
        'definicoes': document.getElementById('definicoes-view')
    };
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item, .menu-grid .menu-item');
    const modal = document.querySelectorAll('.modal');
    const closeModalBtns = document.querySelectorAll('.close-btn');
    const appContentWrapper = document.querySelector('.app-content-wrapper');

    let currentView = 'login';
    let userProfile = 'publicador';
    let storedData = {
        publisherName: '',
        hours: {},
        revisitas: [],
        students: [],
        profile: 'publicador',
        currentTheme: 'theme-default'
    };
    let myChart = null;

    const loadData = () => {
        try {
            const data = localStorage.getItem('pregapp_data');
            if (data) {
                const parsedData = JSON.parse(data);
                storedData = { ...storedData, ...parsedData };
                userProfile = storedData.profile || 'publicador';
                // Carrega o tema salvo
                if (storedData.currentTheme) {
                    document.body.className = storedData.currentTheme;
                }
            }
        } catch (e) {
            console.error("Could not load data from localStorage", e);
        }
    };

    const saveData = () => {
        localStorage.setItem('pregapp_data', JSON.stringify(storedData));
    };

    const renderView = (viewName) => {
        Object.values(views).forEach(v => v.style.display = 'none');
        const targetView = views[viewName];
        
        if (viewName === 'login') {
            appContentWrapper.style.display = 'none';
            targetView.style.display = 'flex';
        } else {
            appContentWrapper.style.display = 'flex';
            targetView.style.display = 'block';
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        targetView.classList.add('active');

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.bottom-nav .nav-item[href="#${viewName}"]`);
        if (activeLink) activeLink.classList.add('active');

        currentView = viewName;
        
        if (viewName === 'campo') {
            renderCalendar(new Date());
        }
        if (viewName === 'revisitas') {
            renderRevisitas();
        }
        if (viewName === 'estudantes') {
            renderStudents();
        }
        if (viewName === 'relatorio') {
            renderReport();
        }
        if (viewName === 'definicoes') {
            document.getElementById('profile-select').value = storedData.profile;
            document.getElementById('publisher-name-input').value = storedData.publisherName;
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('href').substring(1);
            renderView(viewName);
        });
    });

    document.getElementById('login-btn').addEventListener('click', () => {
        renderView('campo');
        const activeLink = document.querySelector(`.bottom-nav .nav-item[href="#campo"]`);
        if (activeLink) activeLink.classList.add('active');
    });

    const syncBtn = document.getElementById('sync-btn');
    const syncStatus = document.getElementById('sync-status');
    syncBtn.addEventListener('click', () => {
        syncStatus.textContent = "Sincronizando...";
        syncStatus.style.color = "var(--secondary-color)";
        syncStatus.style.fontWeight = "600";
        syncBtn.disabled = true;
        setTimeout(() => {
            syncStatus.textContent = "Sincronização concluída!";
            syncStatus.style.color = "green";
            syncBtn.disabled = false;
        }, 2000);
    });
    
    // Lógica para o modal de temas
    const themeBtn = document.getElementById('theme-btn');
    const themeModal = document.getElementById('theme-modal');
    themeBtn.addEventListener('click', () => {
        openModal('theme-modal');
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            document.body.className = theme;
            storedData.currentTheme = theme;
            saveData();
            closeModal(themeModal);
        });
    });

    const openModal = (id) => {
        const m = document.getElementById(id);
        if (m) m.style.display = 'flex';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        modal.forEach(m => {
            if (e.target === m) {
                closeModal(m);
            }
        });
    });

    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    let currentMonth = new Date();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const renderCalendar = (date) => {
        currentMonth = date;
        monthYearEl.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        calendarEl.innerHTML = '';

        dayNames.forEach(day => {
            const weekdayEl = document.createElement('div');
            weekdayEl.className = 'weekday';
            weekdayEl.textContent = day;
            calendarEl.appendChild(weekdayEl);
        });

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();

        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty-day';
            calendarEl.appendChild(emptyDay);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = i;
            const fullDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            dayEl.dataset.date = fullDate;

            if (i === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
                dayEl.classList.add('current-day');
            }
            
            if (storedData.hours[fullDate]) {
                dayEl.classList.add('has-hours');
            }

            dayEl.addEventListener('click', () => {
                openHoursModal(fullDate);
            });
            calendarEl.appendChild(dayEl);
        }
    };

    const openHoursModal = (date) => {
        const modalTitle = document.getElementById('modal-hours-title');
        const hourInputContainer = document.getElementById('hours-input-container');
        const saveHoursBtn = document.getElementById('save-hours-btn');
        
        modalTitle.textContent = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        hourInputContainer.innerHTML = '';
        if (userProfile === 'publicador') {
            const participated = storedData.hours[date] !== undefined;
            hourInputContainer.innerHTML = `
                <div class="form-group">
                    <label for="participou-checkbox">Participou do campo hoje?</label>
                    <input type="checkbox" id="participou-checkbox" ${participated ? 'checked' : ''} style="width: auto;">
                </div>
            `;
             saveHoursBtn.innerHTML = '✅';
        } else {
             hourInputContainer.innerHTML = `
                <div class="form-group">
                    <label for="hora-input">Horas (hh:mm)</label>
                    <input type="time" id="hora-input" value="${storedData.hours[date] || '00:00'}">
                </div>
            `;
             saveHoursBtn.innerHTML = '✅';
        }
        
        if (storedData.hours[date]) {
             const removeBtn = document.createElement('button');
             removeBtn.innerHTML = '🗑️';
             removeBtn.className = 'btn-primary btn-accent icon-only-btn';
             removeBtn.style.marginTop = '10px';
             removeBtn.onclick = () => {
                 delete storedData.hours[date];
                 saveData();
                 renderCalendar(currentMonth);
                 closeModal(document.getElementById('add-hours-modal'));
             };
             hourInputContainer.appendChild(removeBtn);
        }

        saveHoursBtn.onclick = () => {
            if (userProfile === 'publicador') {
                const participated = document.getElementById('participou-checkbox').checked;
                if (participated) {
                    storedData.hours[date] = '00:00';
                } else {
                    delete storedData.hours[date];
                }
            } else {
                storedData.hours[date] = document.getElementById('hora-input').value;
            }
            saveData();
            renderCalendar(currentMonth);
            closeModal(document.getElementById('add-hours-modal'));
        };

        openModal('add-hours-modal');
    };

    prevMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar(currentMonth);
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar(currentMonth);
    });

    const addRevisitaBtn = document.getElementById('add-revisita-btn');
    const revisitaForm = document.getElementById('revisita-form');
    const revisitasList = document.getElementById('revisitas-list');

    const renderRevisitas = () => {
        revisitasList.innerHTML = '';
        if (storedData.revisitas.length === 0) {
            revisitasList.innerHTML = '<p style="text-align: center; color: var(--light-text-color);">Nenhuma revisita cadastrada.</p>';
        }
        storedData.revisitas.forEach((rev, index) => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="student-info">
                    <h3>${rev.nome}</h3>
                    <p>${rev.assunto ? `Assunto: ${rev.assunto}` : ''}</p>
                    <p>${rev.data ? `Próxima: ${new Date(rev.data + 'T00:00:00').toLocaleDateString('pt-BR')} às ${rev.hora}` : ''}</p>
                </div>
                <div class="student-actions">
                    <button class="edit-btn" data-index="${index}">✏️</button>
                    <button class="delete-btn btn-accent" data-index="${index}">🗑️</button>
                </div>
            `;
            revisitasList.appendChild(card);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const rev = storedData.revisitas[index];
                document.getElementById('revisita-nome').value = rev.nome;
                document.getElementById('revisita-endereco').value = rev.endereco;
                document.getElementById('revisita-telefone').value = rev.telefone;
                document.getElementById('revisita-assunto').value = rev.assunto;
                document.getElementById('revisita-data').value = rev.data;
                document.getElementById('revisita-hora').value = rev.hora;
                revisitaForm.dataset.editIndex = index;
                openModal('add-revisita-modal');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                storedData.revisitas.splice(index, 1);
                saveData();
                renderRevisitas();
            });
        });
    };

    addRevisitaBtn.addEventListener('click', () => {
        revisitaForm.reset();
        delete revisitaForm.dataset.editIndex;
        openModal('add-revisita-modal');
    });

    revisitaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRevisita = {
            nome: document.getElementById('revisita-nome').value,
            endereco: document.getElementById('revisita-endereco').value,
            telefone: document.getElementById('revisita-telefone').value,
            assunto: document.getElementById('revisita-assunto').value,
            data: document.getElementById('revisita-data').value,
            hora: document.getElementById('revisita-hora').value
        };
        const editIndex = revisitaForm.dataset.editIndex;
        if (editIndex !== undefined) {
            storedData.revisitas[editIndex] = newRevisita;
        } else {
            storedData.revisitas.push(newRevisita);
        }
        saveData();
        renderRevisitas();
        closeModal(document.getElementById('add-revisita-modal'));
    });

    const addStudentBtn = document.getElementById('add-student-btn');
    const studentForm = document.getElementById('student-form');
    const studentList = document.getElementById('student-list');
    const studentSearchInput = document.getElementById('student-search');

    const renderStudents = (searchTerm = '') => {
        studentList.innerHTML = '';
        const filteredStudents = storedData.students.filter(student =>
            student.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredStudents.length === 0) {
            studentList.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Nenhum estudante encontrado.</p>`;
        }
        
        filteredStudents.forEach((student, index) => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <div class="student-info" data-index="${index}">
                    <h3>${student.nome}</h3>
                    <p>Livro: ${student.livro || 'Nenhum'}</p>
                    <p>Progresso: Capítulo ${student.capitulo || '?'}, Parágrafo ${student.paragrafo || '?'}</p>
                </div>
                <div class="student-actions">
                    <button class="edit-student-btn" data-index="${index}">✏️</button>
                    <button class="delete-student-btn btn-accent" data-index="${index}">🗑️</button>
                </div>
            `;
            studentList.appendChild(card);
        });

        document.querySelectorAll('.student-info').forEach(infoDiv => {
            infoDiv.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const student = storedData.students[index];
                
                document.getElementById('edit-student-title').textContent = `Editar ${student.nome}`;
                document.getElementById('edit-student-livro').value = student.livro;
                document.getElementById('edit-student-capitulo').value = student.capitulo;
                document.getElementById('edit-student-paragrafo').value = student.paragrafo;
                document.getElementById('edit-student-form').dataset.editIndex = index;
                openModal('edit-student-modal');
            });
        });

        document.querySelectorAll('.delete-student-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                storedData.students.splice(index, 1);
                saveData();
                renderStudents(studentSearchInput.value);
            });
        });
    };

    addStudentBtn.addEventListener('click', () => {
        studentForm.reset();
        openModal('add-student-modal');
    });

    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newStudent = {
            nome: document.getElementById('student-nome').value,
            livro: document.getElementById('student-livro').value,
            capitulo: 1,
            paragrafo: 1,
            lastUpdated: new Date().toISOString()
        };
        storedData.students.push(newStudent);
        saveData();
        renderStudents();
        closeModal(document.getElementById('add-student-modal'));
    });

    studentSearchInput.addEventListener('input', (e) => {
        renderStudents(e.target.value);
    });

    const editStudentForm = document.getElementById('edit-student-form');
    editStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = editStudentForm.dataset.editIndex;
        if (index !== undefined) {
            storedData.students[index].livro = document.getElementById('edit-student-livro').value;
            storedData.students[index].capitulo = document.getElementById('edit-student-capitulo').value;
            storedData.students[index].paragrafo = document.getElementById('edit-student-paragrafo').value;
            storedData.students[index].lastUpdated = new Date().toISOString();
            saveData();
            renderStudents(studentSearchInput.value);
            closeModal(document.getElementById('edit-student-modal'));
        }
    });

    const renderReport = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        let monthlyStudiesCount = 0;
        let revisitsCount = storedData.revisitas.length;
        let totalHours = 0;

        for (const date in storedData.hours) {
            const [year, month, day] = date.split('-').map(Number);
            if (year === currentYear && (month - 1) === currentMonth) {
                if (storedData.hours[date] === '00:00' && storedData.profile === 'publicador') {
                } else {
                    const [hours, minutes] = storedData.hours[date].split(':').map(Number);
                    totalHours += hours + (minutes / 60);
                }
            }
        }

        storedData.students.forEach(student => {
            if (student.lastUpdated) {
                const updatedDate = new Date(student.lastUpdated);
                if (updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear) {
                    monthlyStudiesCount++;
                }
            }
        });

        document.getElementById('monthly-studies-count').textContent = monthlyStudiesCount;
        document.getElementById('monthly-hours-count').textContent = totalHours.toFixed(1).replace('.', ',');
        
        renderReportChart(totalHours, monthlyStudiesCount, revisitsCount);
    };

    const renderReportChart = (hours, studies, revisits) => {
        const ctx = document.getElementById('monthly-chart').getContext('2d');
        if (myChart) {
            myChart.destroy();
        }
        myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Horas de Campo', 'Estudos Bíblicos', 'Revisitas'],
                datasets: [{
                    data: [hours, studies, revisits],
                    backgroundColor: [
                        'rgba(240, 155, 58, 0.7)',
                        'rgba(40, 94, 110, 0.7)',
                        'rgba(224, 95, 48, 0.7)'
                    ],
                    borderColor: [
                        'rgba(240, 155, 58, 1)',
                        'rgba(40, 94, 110, 1)',
                        'rgba(224, 95, 48, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Atividade Mensal'
                    }
                }
            },
        });
    };

    const publisherNameInput = document.getElementById('publisher-name-input');
    const profileSelect = document.getElementById('profile-select');

    profileSelect.addEventListener('change', (e) => {
        userProfile = e.target.value;
        storedData.profile = userProfile;
        saveData();
        renderView('definicoes');
    });

    publisherNameInput.addEventListener('input', (e) => {
        storedData.publisherName = e.target.value;
        saveData();
    });

    const updateDateHeader = () => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        document.getElementById('current-date').textContent = formattedDate;
    };

    loadData();
    updateDateHeader();
    renderView('login');
});