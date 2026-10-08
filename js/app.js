(function () {
  'use strict';

  const PHOTOS_BASE_PATH = 'fotos/';
  const STORAGE_KEY = 'ESTUDIANTES_DATA_CUSTOM_2026';
  const VERSION_KEY = 'ESTUDIANTES_DATA_VERSION_KEY';

  const SECTIONS_BY_GRADE = {
    '1ro': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '2do': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '3ro': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '4to': [
      'DISEÑO Y DESARROLLO DE APLICACIONES INFORMÁTICAS',
      'ENERGIAS RENOVABLES',
      'EQUIPOS ELECTROMEDICOS',
      'INSTALACIÓN Y MANTENIMIENTO DE EQUIPOS ELECTRÓNICOS',
      'INSTALACIÓN Y MANTENIMIENTO DE SISTEMAS DE REFRIGERACIÓN Y CLIMATIZACIÓN',
      'LOGÍSTICA Y TRANSPORTE',
      'MECANIZADO',
      'MULTIMEDIA Y COMUNICACIÓN VISUAL',
      'SERVICIOS CONTABLES, ADMINISTRATIVOS Y TRIBUTARIOS'
    ],
    '5to': [
      'DISEÑO Y DESARROLLO DE APLICACIONES INFORMÁTICAS',
      'ENERGIAS RENOVABLES',
      'EQUIPOS ELECTROMÉDICOS',
      'EQUIPOS ELECTRÓNICOS',
      'GESTIÓN ADMINISTRATIVA Y TRIBUTARIA',
      'LOGÍSTICA Y TRANSPORTE',
      'MECANIZADO',
      'MULTIMEDIA Y GRÁFICA',
      'REFRIGERACIÓN Y ACONDICIONAMIENTO DE AIRE'
    ],
    '6to': [
      'DESARROLLO Y ADMINISTRACIÓN DE APLICACIONES INFORMÁTICAS',
      'ENERGÍAS RENOVABLES',
      'EQUIPOS ELECTROMÉDICOS',
      'EQUIPOS ELECTRÓNICOS',
      'GESTIÓN ADMINISTRATIVA Y TRIBUTARIA',
      'LOGÍSTICA Y TRANSPORTE',
      'MECANIZADO',
      'MULTIMEDIA Y GRÁFICA',
      'REFRIGERACIÓN Y AIRE ACONDICIONADO'
    ]
  };

  const state = {
    students: [],
    filteredList: [],
    selectedGrade: 'ALL',
    selectedSection: 'ALL',
    searchQuery: '',
    currentIndex: -1,
    editingStudent: null,
    tempPhotoBase64: null,
    isLightboxOpen: false
  };

  const dom = {
    gradeSelect: document.getElementById('gradeSelect'),
    sectionSelect: document.getElementById('sectionSelect'),
    btnRenameCurrentSection: document.getElementById('btnRenameCurrentSection'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    studentsList: document.getElementById('studentsList'),
    resultsCount: document.getElementById('resultsCount'),
    activeGradePill: document.getElementById('activeGradePill'),
    activeSectionPill: document.getElementById('activeSectionPill'),
    modalOverlay: document.getElementById('studentModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalBackBtn: document.getElementById('modalBackBtn'),
    modalPrevBtn: document.getElementById('modalPrevBtn'),
    modalNextBtn: document.getElementById('modalNextBtn'),
    btnEditStudent: document.getElementById('btnEditStudent'),
    btnDeleteStudent: document.getElementById('btnDeleteStudent'),
    photoContainer: document.getElementById('photoContainer'),
    detailName: document.getElementById('detailName'),
    detailId: document.getElementById('detailId'),
    detailGrade: document.getElementById('detailGrade'),
    detailSection: document.getElementById('detailSection'),
    lightboxOverlay: document.getElementById('lightboxOverlay'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    btnOpenAddModal: document.getElementById('btnOpenAddModal'),
    btnExportData: document.getElementById('btnExportData'),
    formModal: document.getElementById('formModal'),
    formModalTitle: document.getElementById('formModalTitle'),
    formModalCloseBtn: document.getElementById('formModalCloseBtn'),
    formCancelBtn: document.getElementById('formCancelBtn'),
    studentForm: document.getElementById('studentForm'),
    formStudentId: document.getElementById('formStudentId'),
    formApellido: document.getElementById('formApellido'),
    formNombre: document.getElementById('formNombre'),
    formGrado: document.getElementById('formGrado'),
    formSeccion: document.getElementById('formSeccion'),
    customSectionGroup: document.getElementById('customSectionGroup'),
    formCustomSeccion: document.getElementById('formCustomSeccion'),
    formFotoInput: document.getElementById('formFotoInput'),
    formPhotoPreview: document.getElementById('formPhotoPreview'),
    renameSectionModal: document.getElementById('renameSectionModal'),
    renameSectionForm: document.getElementById('renameSectionForm'),
    renameGradeDisplay: document.getElementById('renameGradeDisplay'),
    renameNewSectionName: document.getElementById('renameNewSectionName'),
    renameCloseBtn: document.getElementById('renameCloseBtn'),
    renameCancelBtn: document.getElementById('renameCancelBtn')
  };

  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

  async function init() {
    loadData();
    populateGradeFilter();
    updateSectionFilter();
    setupEventListeners();
    render();
  }

  function loadData() {
    const currentVersion = window.DATA_VERSION || '1.0';
    const savedVersion = localStorage.getItem(VERSION_KEY);

    if (savedVersion !== currentVersion) {
      if (window.ESTUDIANTES_DATA && Array.isArray(window.ESTUDIANTES_DATA)) {
        state.students = sanitizeStudents(window.ESTUDIANTES_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
        localStorage.setItem(VERSION_KEY, currentVersion);
        return;
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        state.students = JSON.parse(saved);
        return;
      } catch (e) {}
    }

    if (window.ESTUDIANTES_DATA && Array.isArray(window.ESTUDIANTES_DATA)) {
      state.students = sanitizeStudents(window.ESTUDIANTES_DATA);
    } else {
      state.students = [];
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
    if (window.DATA_VERSION) localStorage.setItem(VERSION_KEY, window.DATA_VERSION);
  }

  function sanitizeStudents(data) {
    return data.map((st, idx) => ({
      id: st.id || String(idx + 1).padStart(3, '0'),
      nombre: (st.nombre || '').trim(),
      apellido: (st.apellido || '').trim(),
      grado: (st.grado || '4to').trim(),
      seccion: (st.seccion || 'GENERAL').trim(),
      foto: (st.foto || '').trim()
    }));
  }

  function populateGradeFilter() {
    const grades = ['1ro', '2do', '3ro', '4to', '5to', '6to'].filter(g => 
      state.students.some(s => s.grado === g)
    );

    dom.gradeSelect.innerHTML = '<option value="ALL">Todos los grados</option>';
    grades.forEach(grado => {
      const option = document.createElement('option');
      option.value = grado;
      option.textContent = grado;
      dom.gradeSelect.appendChild(option);
    });
  }

  function updateSectionFilter() {
    let relevant = state.students;
    if (state.selectedGrade !== 'ALL') {
      relevant = state.students.filter(s => s.grado === state.selectedGrade);
    }

    const uniqueSections = Array.from(new Set(relevant.map(s => s.seccion))).filter(Boolean);
    uniqueSections.sort((a, b) => collator.compare(a, b));

    const currentVal = dom.sectionSelect.value;
    dom.sectionSelect.innerHTML = '<option value="ALL">Todas las secciones</option>';
    
    uniqueSections.forEach(sec => {
      const option = document.createElement('option');
      option.value = sec;
      option.textContent = sec;
      dom.sectionSelect.appendChild(option);
    });

    if (uniqueSections.includes(currentVal)) {
      dom.sectionSelect.value = currentVal;
      state.selectedSection = currentVal;
    } else {
      dom.sectionSelect.value = 'ALL';
      state.selectedSection = 'ALL';
    }

    updateRenameButtonVisibility();
  }

  function updateRenameButtonVisibility() {
    if (state.selectedSection !== 'ALL') {
      dom.btnRenameCurrentSection.style.display = 'inline-flex';
      dom.btnRenameCurrentSection.textContent = `✏️ Renombrar`;
    } else {
      dom.btnRenameCurrentSection.style.display = 'none';
    }
  }

  function updateFormSections(selectedSectionVal = '') {
    const grado = dom.formGrado.value;
    const defaultSecs = SECTIONS_BY_GRADE[grado] || ['A', 'B', 'C'];
    const existingSecsInGrade = state.students.filter(s => s.grado === grado).map(s => s.seccion);
    const combinedSecs = Array.from(new Set([...defaultSecs, ...existingSecsInGrade])).filter(Boolean);
    combinedSecs.sort((a, b) => collator.compare(a, b));

    dom.formSeccion.innerHTML = '';
    combinedSecs.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      dom.formSeccion.appendChild(opt);
    });

    const newSecOpt = document.createElement('option');
    newSecOpt.value = '__NEW_SECTION__';
    newSecOpt.textContent = '➕ Agregar nueva sección...';
    dom.formSeccion.appendChild(newSecOpt);

    if (selectedSectionVal && combinedSecs.includes(selectedSectionVal)) {
      dom.formSeccion.value = selectedSectionVal;
      dom.customSectionGroup.style.display = 'none';
    } else {
      dom.customSectionGroup.style.display = 'none';
    }
  }

  function getFilteredStudents() {
    const q = state.searchQuery.toLowerCase().trim();

    const filtered = state.students.filter(st => {
      if (state.selectedGrade !== 'ALL' && st.grado !== state.selectedGrade) return false;
      if (state.selectedSection !== 'ALL' && st.seccion !== state.selectedSection) return false;
      
      if (q) {
        const fullName = `${st.apellido} ${st.nombre}`.toLowerCase();
        const invName = `${st.nombre} ${st.apellido}`.toLowerCase();
        const tag = `${st.grado} ${st.seccion}`.toLowerCase();
        const idMatch = st.id.toLowerCase().includes(q);
        return fullName.includes(q) || invName.includes(q) || tag.includes(q) || idMatch;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const comp = collator.compare(a.apellido, b.apellido);
      return comp !== 0 ? comp : collator.compare(a.nombre, b.nombre);
    });
  }

  function render() {
    state.filteredList = getFilteredStudents();

    dom.resultsCount.textContent = state.filteredList.length;
    dom.activeGradePill.textContent = state.selectedGrade === 'ALL' ? 'Todos los grados' : `Grado: ${state.selectedGrade}`;
    dom.activeSectionPill.textContent = state.selectedSection === 'ALL' ? 'Todas las secciones' : state.selectedSection;
    dom.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';

    updateRenameButtonVisibility();

    if (state.filteredList.length === 0) {
      dom.studentsList.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; background:white; border-radius:12px; border:1px dashed var(--border);">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
          <h3>No se encontraron estudiantes</h3>
          <p style="color:var(--text-muted); margin-bottom:1rem;">No hay resultados con los filtros actuales.</p>
          <button type="button" class="btn-primary" id="btnResetAll" style="margin:0 auto;">Restablecer filtros</button>
        </div>
      `;
      const btnReset = document.getElementById('btnResetAll');
      if (btnReset) btnReset.addEventListener('click', resetFilters);
      return;
    }

    dom.studentsList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    state.filteredList.forEach((student, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'student-card';

      const initials = getInitials(student.nombre, student.apellido);
      const photoSrc = getPhotoUrl(student.foto);

      card.innerHTML = `
        <div class="student-mini-avatar">
          ${photoSrc ? `<img src="${photoSrc}" alt="${student.nombre}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
          <div style="${photoSrc ? 'display:none;' : 'display:flex;'} width:100%; height:100%; align-items:center; justify-content:center;">
            ${initials}
          </div>
        </div>
        <div class="student-info">
          <div class="student-name-main">${escapeHtml(student.apellido)}</div>
          <div class="student-name-sub">${escapeHtml(student.nombre)}</div>
          <div class="student-meta">
            <span class="student-meta-tag">${escapeHtml(student.grado)} - ${escapeHtml(student.seccion)}</span>
          </div>
        </div>
        <div class="student-arrow">›</div>
      `;

      card.addEventListener('click', () => openStudentModalByIndex(index));
      fragment.appendChild(card);
    });

    dom.studentsList.appendChild(fragment);
  }

  function getPhotoUrl(foto) {
    if (!foto) return '';
    if (foto.startsWith('data:image')) return foto;
    return `${PHOTOS_BASE_PATH}${encodeURIComponent(foto).replace(/%2F/g, '/')}`;
  }

  function openStudentModalByIndex(index) {
    if (index < 0 || index >= state.filteredList.length) return;
    state.currentIndex = index;
    const student = state.filteredList[index];

    dom.detailName.textContent = `${student.apellido}, ${student.nombre}`;
    dom.detailId.textContent = `Estudiante ${index + 1} de ${state.filteredList.length}`;
    dom.detailGrade.textContent = `Grado: ${student.grado}`;
    dom.detailSection.textContent = student.seccion;

    dom.photoContainer.innerHTML = '';
    const photoSrc = getPhotoUrl(student.foto);

    if (photoSrc) {
      const img = document.createElement('img');
      img.src = photoSrc;
      img.alt = student.nombre;
      img.className = 'photo-img';
      img.onerror = () => showPhotoPlaceholder(student);
      dom.photoContainer.appendChild(img);
    } else {
      showPhotoPlaceholder(student);
    }

    if (dom.modalPrevBtn) dom.modalPrevBtn.disabled = index === 0;
    if (dom.modalNextBtn) dom.modalNextBtn.disabled = index === state.filteredList.length - 1;

    dom.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function showPhotoPlaceholder(student) {
    const initials = getInitials(student.nombre, student.apellido);
    dom.photoContainer.innerHTML = `
      <div style="text-align:center; color:var(--text-light);">
        <div style="font-size:3rem;">👤</div>
        <div style="font-size:1.4rem; font-weight:700; color:var(--primary);">${initials}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Fotografía no disponible</div>
      </div>
    `;
  }

  function closeStudentModal() {
    dom.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    state.currentIndex = -1;
  }

  function deleteCurrentStudent() {
    if (state.currentIndex === -1) return;
    const student = state.filteredList[state.currentIndex];

    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar al estudiante "${student.apellido}, ${student.nombre}" del registro escolar?\n\nEsta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    const originalIndex = state.students.findIndex(s => s.id === student.id);
    if (originalIndex !== -1) {
      state.students.splice(originalIndex, 1);
    }

    saveToLocalStorage();
    closeStudentModal();
    populateGradeFilter();
    updateSectionFilter();
    render();
  }

  function openRenameSectionModal() {
    if (state.selectedSection === 'ALL') return;

    dom.renameGradeDisplay.value = state.selectedGrade === 'ALL' ? 'Todos los grados' : state.selectedGrade;
    dom.renameNewSectionName.value = state.selectedSection;
    dom.renameSectionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    dom.renameNewSectionName.focus();
  }

  function closeRenameSectionModal() {
    dom.renameSectionModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handleRenameSectionSubmit(e) {
    e.preventDefault();
    const oldSection = state.selectedSection;
    const newSection = dom.renameNewSectionName.value.trim().toUpperCase();

    if (!newSection) {
      alert('Por favor escribe el nuevo nombre de la sección.');
      return;
    }

    if (oldSection === newSection) {
      closeRenameSectionModal();
      return;
    }

    let count = 0;
    state.students.forEach(st => {
      const matchGrade = state.selectedGrade === 'ALL' || st.grado === state.selectedGrade;
      if (matchGrade && st.seccion === oldSection) {
        st.seccion = newSection;
        count++;
      }
    });

    if (state.selectedGrade !== 'ALL' && SECTIONS_BY_GRADE[state.selectedGrade]) {
      const idx = SECTIONS_BY_GRADE[state.selectedGrade].indexOf(oldSection);
      if (idx !== -1) SECTIONS_BY_GRADE[state.selectedGrade][idx] = newSection;
      else SECTIONS_BY_GRADE[state.selectedGrade].push(newSection);
    }

    saveToLocalStorage();
    state.selectedSection = newSection;
    closeRenameSectionModal();
    updateSectionFilter();
    dom.sectionSelect.value = newSection;
    render();

    alert(`✅ Se actualizó la sección "${oldSection}" a "${newSection}" para ${count} estudiante(s).`);
  }

  function openLightbox() {
    if (state.currentIndex === -1) return;
    const student = state.filteredList[state.currentIndex];
    const photoSrc = getPhotoUrl(student.foto);
    if (!photoSrc) return;

    dom.lightboxImg.src = photoSrc;
    dom.lightboxCaption.textContent = `${student.apellido}, ${student.nombre} (${student.grado} - ${student.seccion})`;
    dom.lightboxOverlay.classList.add('active');
    state.isLightboxOpen = true;
  }

  function closeLightbox() {
    dom.lightboxOverlay.classList.remove('active');
    dom.lightboxImg.src = '';
    state.isLightboxOpen = false;
  }

  function openAddModal() {
    state.editingStudent = null;
    state.tempPhotoBase64 = null;
    dom.formModalTitle.textContent = 'Agregar Nuevo Estudiante';
    dom.formStudentId.value = '';
    dom.formApellido.value = '';
    dom.formNombre.value = '';
    dom.formGrado.value = state.selectedGrade !== 'ALL' ? state.selectedGrade : '4to';
    updateFormSections();
    dom.formCustomSeccion.value = '';
    dom.formFotoInput.value = '';
    dom.formPhotoPreview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-light);">Sin foto</span>';

    dom.formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openEditModal() {
    if (state.currentIndex === -1) return;
    const student = state.filteredList[state.currentIndex];
    state.editingStudent = student;
    state.tempPhotoBase64 = student.foto || null;

    closeStudentModal();

    dom.formModalTitle.textContent = 'Editar Información del Estudiante';
    dom.formStudentId.value = student.id;
    dom.formApellido.value = student.apellido;
    dom.formNombre.value = student.nombre;
    dom.formGrado.value = student.grado;
    updateFormSections(student.seccion);
    dom.formCustomSeccion.value = '';
    dom.formFotoInput.value = '';

    const photoSrc = getPhotoUrl(student.foto);
    if (photoSrc) {
      dom.formPhotoPreview.innerHTML = `<img src="${photoSrc}" alt="Vista previa">`;
    } else {
      dom.formPhotoPreview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-light);">Sin foto</span>';
    }

    dom.formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeFormModal() {
    dom.formModal.classList.remove('active');
    document.body.style.overflow = '';
    state.editingStudent = null;
    state.tempPhotoBase64 = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const apellido = dom.formApellido.value.trim();
    const nombre = dom.formNombre.value.trim();
    const grado = dom.formGrado.value;
    
    let seccion = dom.formSeccion.value;
    if (seccion === '__NEW_SECTION__') {
      const customVal = dom.formCustomSeccion.value.trim().toUpperCase();
      if (!customVal) {
        alert('Por favor escribe el nombre de la nueva sección.');
        dom.formCustomSeccion.focus();
        return;
      }
      seccion = customVal;
      
      if (!SECTIONS_BY_GRADE[grado]) SECTIONS_BY_GRADE[grado] = [];
      if (!SECTIONS_BY_GRADE[grado].includes(seccion)) {
        SECTIONS_BY_GRADE[grado].push(seccion);
      }
    }

    const foto = state.tempPhotoBase64 || (state.editingStudent ? state.editingStudent.foto : '');

    if (!apellido || !nombre) {
      alert('Por favor completa nombre y apellido.');
      return;
    }

    if (state.editingStudent) {
      state.editingStudent.apellido = apellido;
      state.editingStudent.nombre = nombre;
      state.editingStudent.grado = grado;
      state.editingStudent.seccion = seccion;
      if (foto) state.editingStudent.foto = foto;
    } else {
      const newId = String(state.students.length + 1).padStart(3, '0');
      const newStudent = {
        id: newId,
        apellido: apellido,
        nombre: nombre,
        grado: grado,
        seccion: seccion,
        foto: foto
      };
      state.students.push(newStudent);
    }

    saveToLocalStorage();
    populateGradeFilter();
    updateSectionFilter();
    render();
    closeFormModal();
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      state.tempPhotoBase64 = evt.target.result;
      dom.formPhotoPreview.innerHTML = `<img src="${state.tempPhotoBase64}" alt="Vista previa">`;
    };
    reader.readAsDataURL(file);
  }

  function exportDataFile() {
    const content = `// Base de datos escolar IPIDBOSCO\nwindow.DATA_VERSION = '${Date.now()}';\nwindow.ESTUDIANTES_DATA = ${JSON.stringify(state.students, null, 2)};\n`;
    const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estudiantes.js';
    a.click();
    URL.revokeObjectURL(url);
  }

  function setupEventListeners() {
    dom.gradeSelect.addEventListener('change', (e) => {
      state.selectedGrade = e.target.value;
      updateSectionFilter();
      render();
    });

    dom.sectionSelect.addEventListener('change', (e) => {
      state.selectedSection = e.target.value;
      render();
    });

    dom.btnRenameCurrentSection.addEventListener('click', openRenameSectionModal);
    dom.renameCloseBtn.addEventListener('click', closeRenameSectionModal);
    dom.renameCancelBtn.addEventListener('click', closeRenameSectionModal);
    dom.renameSectionForm.addEventListener('submit', handleRenameSectionSubmit);

    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      render();
    });

    dom.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      dom.searchInput.value = '';
      dom.searchInput.focus();
      render();
    });

    dom.modalCloseBtn.addEventListener('click', closeStudentModal);
    dom.modalBackBtn.addEventListener('click', closeStudentModal);
    dom.btnEditStudent.addEventListener('click', openEditModal);
    dom.btnDeleteStudent.addEventListener('click', deleteCurrentStudent);
    
    dom.photoContainer.addEventListener('click', openLightbox);
    dom.lightboxCloseBtn.addEventListener('click', closeLightbox);
    dom.lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === dom.lightboxOverlay) closeLightbox();
    });

    if (dom.modalPrevBtn) {
      dom.modalPrevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) openStudentModalByIndex(state.currentIndex - 1);
      });
    }

    if (dom.modalNextBtn) {
      dom.modalNextBtn.addEventListener('click', () => {
        if (state.currentIndex < state.filteredList.length - 1) {
          openStudentModalByIndex(state.currentIndex + 1);
        }
      });
    }

    dom.btnOpenAddModal.addEventListener('click', openAddModal);
    dom.formModalCloseBtn.addEventListener('click', closeFormModal);
    dom.formCancelBtn.addEventListener('click', closeFormModal);
    dom.formGrado.addEventListener('change', () => updateFormSections());
    
    dom.formSeccion.addEventListener('change', (e) => {
      if (e.target.value === '__NEW_SECTION__') {
        dom.customSectionGroup.style.display = 'block';
        dom.formCustomSeccion.focus();
      } else {
        dom.customSectionGroup.style.display = 'none';
      }
    });

    dom.formFotoInput.addEventListener('change', handlePhotoUpload);
    dom.studentForm.addEventListener('submit', handleFormSubmit);
    dom.btnExportData.addEventListener('click', exportDataFile);

    document.addEventListener('keydown', (e) => {
      if (state.isLightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
      } else if (state.currentIndex !== -1) {
        if (e.key === 'Escape') closeStudentModal();
        else if (e.key === 'ArrowLeft' && state.currentIndex > 0) openStudentModalByIndex(state.currentIndex - 1);
        else if (e.key === 'ArrowRight' && state.currentIndex < state.filteredList.length - 1) openStudentModalByIndex(state.currentIndex + 1);
      }
    });
  }

  function resetFilters() {
    state.selectedGrade = 'ALL';
    state.selectedSection = 'ALL';
    state.searchQuery = '';
    dom.gradeSelect.value = 'ALL';
    dom.searchInput.value = '';
    updateSectionFilter();
    render();
  }

  function getInitials(nombre, apellido) {
    const n = (nombre || '').trim().charAt(0);
    const a = (apellido || '').trim().charAt(0);
    return `${a}${n}`.toUpperCase() || 'E';
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
