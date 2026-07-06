// ============================================================
// 01. STATE & CONSTANTS
// ============================================================

console.log('✓ app.js loaded successfully');
 
let currentView          = 'dashboard';
let currentTeacher       = null;
let currentSection       = null;
let currentGrade         = 7;

// School Year for printables
let schoolYear = localStorage.getItem('schoolYear') || '2025–2026';

// Current Term for JHS (1, 2, or 3)
let currentTerm = localStorage.getItem('currentTerm') || '1';
window.currentTerm = currentTerm;

// Current Semester for SHS (1 or 2)
let currentSemester = localStorage.getItem('currentSemester') || '1';
window.currentSemester = currentSemester;

// ============================================================
// SCHOOL YEAR MANAGEMENT
// ============================================================

function openEditSchoolYear() {
    if (!document.getElementById('editSchoolYearModal')) {
        const m = document.createElement('div');
        m.id = 'editSchoolYearModal';
        m.className = 'modal-overlay hidden';
        m.onclick = function(e){ if(e.target===m) m.classList.add('hidden'); };
        m.innerHTML = '<div class="modal-box" style="max-width:550px">' +
            '<div class="modal-header"><h3>Edit School Year & Terms</h3><button class="panel-close" onclick="closeEditSchoolYear()">✕</button></div>' +
            '<div class="modal-body">' +
                '<label class="form-label" style="margin-bottom:8px">School Year (for printables)</label>' +
                '<input type="text" id="schoolYearInput" class="form-input" placeholder="e.g. 2025–2026" style="width:100%;margin-bottom:6px" onkeydown="if(event.key===\'Enter\')submitSchoolYear()">' +
                '<p class="form-hint" style="margin-bottom:20px">Format: YYYY–YYYY (use en dash –)</p>' +
                
                '<label class="form-label" style="margin-bottom:10px;display:block">Current Term (for JHS Grades 7-10)</label>' +
                '<div style="display:flex;gap:12px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;margin-bottom:20px">' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600">' +
                        '<input type="radio" name="currentTerm" id="term1" value="1" style="cursor:pointer;width:16px;height:16px"> 1st Term' +
                    '</label>' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600">' +
                        '<input type="radio" name="currentTerm" id="term2" value="2" style="cursor:pointer;width:16px;height:16px"> 2nd Term' +
                    '</label>' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600">' +
                        '<input type="radio" name="currentTerm" id="term3" value="3" style="cursor:pointer;width:16px;height:16px"> 3rd Term' +
                    '</label>' +
                '</div>' +
                
                '<label class="form-label" style="margin-bottom:10px;display:block">Current Semester (for SHS Grades 11-12)</label>' +
                '<div style="display:flex;gap:16px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px">' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600">' +
                        '<input type="radio" name="currentSemester" id="semester1" value="1" style="cursor:pointer;width:16px;height:16px"> 1st Semester' +
                    '</label>' +
                    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:600">' +
                        '<input type="radio" name="currentSemester" id="semester2" value="2" style="cursor:pointer;width:16px;height:16px"> 2nd Semester' +
                    '</label>' +
                '</div>' +
                '<p class="form-hint" style="margin-top:6px">These control which term/semester subjects are shown when editing teachers</p>' +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeEditSchoolYear()">Cancel</button><button class="btn-confirm" onclick="submitSchoolYear()">Save</button></div>' +
        '</div>';
        document.body.appendChild(m);
    }
    
    document.getElementById('schoolYearInput').value = schoolYear;
    
    // Load current term from localStorage (default to 1)
    const currentTerm = localStorage.getItem('currentTerm') || '1';
    document.getElementById('term' + currentTerm).checked = true;
    
    // Load current semester from localStorage (default to 1)
    const currentSemester = localStorage.getItem('currentSemester') || '1';
    document.getElementById('semester' + currentSemester).checked = true;
    
    document.getElementById('editSchoolYearModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('schoolYearInput').focus(), 50);
}

function closeEditSchoolYear() {
    document.getElementById('editSchoolYearModal').classList.add('hidden');
}

function submitSchoolYear() {
    const newYear = document.getElementById('schoolYearInput').value.trim();
    if (!newYear) {
        showToast('Please enter a school year', 'error');
        return;
    }
    
    // Get selected term for JHS
    const selectedTerm = document.querySelector('input[name="currentTerm"]:checked')?.value || '1';
    
    // Get selected semester for SHS
    const selectedSemester = document.querySelector('input[name="currentSemester"]:checked')?.value || '1';
    
    schoolYear = newYear;
    localStorage.setItem('schoolYear', schoolYear);
    localStorage.setItem('currentTerm', selectedTerm);
    localStorage.setItem('currentSemester', selectedSemester);
    window.currentTerm = selectedTerm;
    window.currentSemester = selectedSemester;
    
    document.getElementById('displaySchoolYear').textContent = schoolYear;
    closeEditSchoolYear();
    showToast('✓ School year, term, and semester updated', 'success');
    
    // Reload subjects to reflect the new term/semester
    loadSubjects();
}
 
 
// ============================================================
// DYNAMIC MODAL HELPERS
// ============================================================
function ensureModal(id, innerHtml) {
    let m = document.getElementById(id);
    if (!m) {
        m = document.createElement('div');
        m.id = id;
        m.className = 'modal-overlay hidden';
        document.body.appendChild(m);
    }
    m.innerHTML = '<div class="modal-box">' + innerHtml + '</div>';
    m.onclick = function(e) { if (e.target === m) m.classList.add('hidden'); };
}
 
 

function availabilityCheckboxes(prefix) {
    const html = `<div style="margin-bottom:20px">
        <div style="margin-bottom:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:700;color:var(--green);padding:8px 14px;background:var(--bg3);border:1px solid var(--green);border-radius:8px;transition:all 0.2s">
                <input type="checkbox" id="${prefix}_wholeweek" data-prefix="${prefix}" onchange="toggleWholeWeekEl(this)" style="cursor:pointer;width:16px;height:16px"> Whole Week</label>
            ${prefix === 'edit' ? `<div style="display:flex;align-items:center;gap:12px;padding:8px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px"><label style="font-size:13px;font-weight:600;color:var(--text2)">Load: Total Periods</label><input type="number" id="editTeacherLoad" class="form-input" style="width:100px;font-size:14px;padding:6px 10px;background:var(--bg3);text-align:center;font-weight:700" placeholder="0" min="0" max="200" readonly><span style="font-size:12px;color:var(--text2)">periods/week</span></div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
            ${DAYS_OF_WEEK.map(d => `<div style="padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px"><div style="display:grid;grid-template-columns:auto 1fr 1fr auto;gap:12px;align-items:center"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;min-width:100px"><input type="checkbox" id="${prefix}_wholeday_${d}" data-prefix="${prefix}" data-day="${d}" data-${prefix}-avail onchange="toggleDayAvailability('${prefix}', '${d}')" style="cursor:pointer;width:15px;height:15px"> ${d}</label><div><label style="display:block;margin-bottom:4px;font-size:11px;font-weight:600;color:var(--text2)">Time In:</label><input type="time" id="${prefix}_time_in_${d}" class="form-input" style="width:100%;font-size:13px" value="07:00" onchange="updateDayHours('${prefix}', '${d}')" disabled></div><div><label style="display:block;margin-bottom:4px;font-size:11px;font-weight:600;color:var(--text2)">Time Out:</label><input type="time" id="${prefix}_time_out_${d}" class="form-input" style="width:100%;font-size:13px" value="17:30" onchange="updateDayHours('${prefix}', '${d}')" disabled></div><div style="min-width:80px"><label style="display:block;margin-bottom:4px;font-size:11px;font-weight:600;color:var(--text2)">Hours:</label><div id="${prefix}_hours_${d}" style="font-size:14px;font-weight:700;color:var(--green);padding:6px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;text-align:center">0h</div></div></div></div>`).join('')}
        </div>
    </div>`;
    return html;
}

function toggleDayAvailability(prefix, day) {
    const dayCb = document.getElementById(prefix+'_wholeday_'+day);
    const timeInInput = document.getElementById(prefix+'_time_in_'+day);
    const timeOutInput = document.getElementById(prefix+'_time_out_'+day);
    
    if (dayCb && dayCb.checked) {
        if (timeInInput) timeInInput.disabled = false;
        if (timeOutInput) timeOutInput.disabled = false;
        updateDayHours(prefix, day);
    } else {
        if (timeInInput) timeInInput.disabled = true;
        if (timeOutInput) timeOutInput.disabled = true;
        const hoursDisplay = document.getElementById(prefix+'_hours_'+day);
        if (hoursDisplay) hoursDisplay.textContent = '0h';
        if (prefix === 'edit') updateTotalLoadFromAvailability();
    }
    
    const allDaysChecked = DAYS_OF_WEEK.every(d => {
        const cb = document.getElementById(prefix+'_wholeday_'+d);
        return cb && cb.checked;
    });
    const ww = document.getElementById(prefix+'_wholeweek');
    if (ww) ww.checked = allDaysChecked;
}

function updateDayHours(prefix, day) {
    const dayCb = document.getElementById(prefix+'_wholeday_'+day);
    const timeInInput = document.getElementById(prefix+'_time_in_'+day);
    const timeOutInput = document.getElementById(prefix+'_time_out_'+day);
    const hoursDisplay = document.getElementById(prefix+'_hours_'+day);
    
    if (!hoursDisplay) return;
    
    if (dayCb && dayCb.checked && timeInInput && timeOutInput && timeInInput.value && timeOutInput.value) {
        const hours = calculateHoursRendered(timeInInput.value, timeOutInput.value);
        hoursDisplay.textContent = hours.toFixed(1) + 'h';
        hoursDisplay.style.color = hours > 0 ? 'var(--green)' : 'var(--text2)';
    } else {
        hoursDisplay.textContent = '0h';
        hoursDisplay.style.color = 'var(--text2)';
    }
    if (prefix === 'edit') updateTotalLoadFromAvailability();
}

function updateTotalLoadFromAvailability() {
    let totalHours = 0;
    DAYS_OF_WEEK.forEach(day => {
        const dayCb = document.getElementById('edit_wholeday_' + day);
        const timeInInput = document.getElementById('edit_time_in_' + day);
        const timeOutInput = document.getElementById('edit_time_out_' + day);
        if (dayCb && dayCb.checked && timeInInput && timeOutInput && timeInInput.value && timeOutInput.value) {
            totalHours += calculateHoursRendered(timeInInput.value, timeOutInput.value);
        }
    });
    const totalPeriods = Math.round(totalHours);
    const loadInput = document.getElementById('editTeacherLoad');
    if (loadInput) {
        loadInput.removeAttribute('readonly');
        loadInput.value = totalPeriods;
        loadInput.setAttribute('readonly', 'readonly');
    }
}

const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function toggleWholeWeekEl(el) {
    const prefix = el.getAttribute('data-prefix');
    const checked = el.checked;
    DAYS_OF_WEEK.forEach(d => {
        const wdCb = document.getElementById(prefix+'_wholeday_'+d);
        if (wdCb) {
            wdCb.checked = checked;
            toggleDayAvailability(prefix, d);
        }
    });
}



function getAvailFromCheckboxes(prefix) {
    var result = {};
    
    // Get each day's availability and time
    ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(function(day){
        var dayCb = document.getElementById(prefix+'_wholeday_'+day);
        if (dayCb && dayCb.checked) {
            var timeInInput = document.getElementById(prefix+'_time_in_'+day);
            var timeOutInput = document.getElementById(prefix+'_time_out_'+day);
            
            // Get time values and ensure they're in 24-hour format
            let timeIn = timeInInput ? timeInInput.value : '07:00';
            let timeOut = timeOutInput ? timeOutInput.value : '17:30';
            
            // Validate and fix time format (should be HH:MM in 24-hour format)
            // If time is in format "1:30" or "01:30", ensure it's properly formatted
            if (timeIn && !/^\d{2}:\d{2}$/.test(timeIn)) {
                // Pad with zero if needed
                const parts = timeIn.split(':');
                if (parts.length === 2) {
                    timeIn = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
                }
            }
            if (timeOut && !/^\d{2}:\d{2}$/.test(timeOut)) {
                const parts = timeOut.split(':');
                if (parts.length === 2) {
                    timeOut = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
                }
            }
            
            result[day] = {
                available: true,
                timeIn: timeIn,
                timeOut: timeOut
            };
        }
    });
    
    return result;
}

function setAvailCheckboxes(prefix, availObj) {
    document.querySelectorAll('[data-'+prefix+'-avail]').forEach(cb => cb.checked = false);
    DAYS_OF_WEEK.forEach(d => {
        const c = document.getElementById(prefix+'_wholeday_'+d);
        if (c) c.checked = false;
    });
    const ww = document.getElementById(prefix+'_wholeweek');
    if (ww) ww.checked = false;
    
    if (!availObj) return;
    
    Object.keys(availObj).forEach(day => {
        const dayData = availObj[day];
        if (dayData && (dayData.available === true || dayData.available === undefined)) {
            const dayCb = document.getElementById(prefix+'_wholeday_'+day);
            if (dayCb) {
                dayCb.checked = true;
                const timeInInput = document.getElementById(prefix+'_time_in_'+day);
                const timeOutInput = document.getElementById(prefix+'_time_out_'+day);
                if (timeInInput) {
                    timeInInput.disabled = false;
                    if (dayData.timeIn) timeInInput.value = dayData.timeIn;
                }
                if (timeOutInput) {
                    timeOutInput.disabled = false;
                    if (dayData.timeOut) timeOutInput.value = dayData.timeOut;
                }
                updateDayHours(prefix, day);
            }
        }
    });
    
    const allDaysChecked = DAYS_OF_WEEK.every(d => {
        const cb = document.getElementById(prefix+'_wholeday_'+d);
        return cb && cb.checked;
    });
    if (ww) ww.checked = allDaysChecked;
}

function subjectCheckboxes(prefix) {
    const currentCurr = window.currentCurriculum || 'new';
    const selectedStrand = window[prefix + 'SelectedStrand'] || 'all';
    const selectedElectiveType = window[prefix + 'SelectedElectiveType'] || 'all';
    const selectedElectiveSubtype = window[prefix + 'SelectedElectiveSubtype'] || null;
    const activeSemester = prefix === 'edit' && window.editSelectedShsSemester ? window.editSelectedShsSemester : (window.currentSemester || '1');
    const activeTerm = prefix === 'edit' && window.editSelectedJhsTerm ? window.editSelectedJhsTerm : (window.currentTerm || '1');

    // Build subject → assigned teacher names map (excluding the teacher being edited)
    const currentEditId = prefix === 'edit' ? (document.getElementById('editTeacherId')?.value || null) : null;
    const subjectTeacherMap = {};
    (teachersCache || []).forEach(t => {
        if (currentEditId && t.id === currentEditId) return;
        const tSubjects = Array.isArray(t.subjects) ? t.subjects : (t.subject ? [t.subject] : []);
        tSubjects.forEach(sName => {
            if (!subjectTeacherMap[sName]) subjectTeacherMap[sName] = [];
            subjectTeacherMap[sName].push(t.name);
        });
    });

    function assignedTag(subjectName) {
        const teachers = subjectTeacherMap[subjectName];
        if (!teachers || teachers.length === 0) return '';
        return `<span style="font-size:10px;color:#f97316;font-weight:600;margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;display:inline-block;vertical-align:middle" title="${teachers.join(', ')}">👤 ${teachers.join(', ')}</span>`;
    }
    
    // Load subjects from cache (populated from DB) with fallback
    var jhsSubjs = (typeof subjectsCache !== 'undefined' && subjectsCache.jhs) 
        ? subjectsCache.jhs
        : [];
    
    // Filter JHS subjects by term for new curriculum
    if (currentCurr === 'new') {
        jhsSubjs = jhsSubjs.filter(s => {
            // Include subjects with matching term, 'all' term, or no term specified
            const subjectTerm = s.term || 'all';
            return subjectTerm === activeTerm || subjectTerm === 'all';
        });
    }
    
    // Filter SHS subjects by current semester
    var shsSubjsData = [];
    if (typeof subjectsCache !== 'undefined') {
        // Only include subjects from the current semester, keeping grade info
        if (activeSemester === '1') {
            shsSubjsData = [
                ...(subjectsCache.g11Sem1 || []).map(s => ({...s, _grade: '11'})),
                ...(subjectsCache.g12Sem1 || []).map(s => ({...s, _grade: '12'}))
            ];
        } else {
            shsSubjsData = [
                ...(subjectsCache.g11Sem2 || []).map(s => ({...s, _grade: '11'})),
                ...(subjectsCache.g12Sem2 || []).map(s => ({...s, _grade: '12'}))
            ];
        }
        // Remove duplicates by name (keep first occurrence)
        const seen = new Set();
        shsSubjsData = shsSubjsData.filter(s => {
            if (seen.has(s.name)) return false;
            seen.add(s.name);
            return true;
        });
    }
    
    var JHS_SECTION = currentCurr === 'new' ? 'JHS SUBJECTS (Term ' + activeTerm + ')' : 'JHS SUBJECTS';
    var SHS_CORE_SECTION = 'SHS CORE SUBJECTS (Semester ' + activeSemester + ')';
    var SHS_APPLIED_SECTION = 'SHS APPLIED/SPECIALIZED (Semester ' + activeSemester + ')';
    var html = '';
    
    // JHS group header
    html += '<div class="subj-group-jhs" style="font-size:12px;font-weight:800;color:var(--text2);letter-spacing:1px;margin-bottom:8px;padding:6px 10px;background:var(--bg3);border-radius:6px">'+JHS_SECTION+'</div>';
    html += '<div class="subj-group-jhs" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">';
    jhsSubjs.forEach(function(s) {
        var id = prefix + '_cb_' + s.name.replace(/[^A-Z0-9]/gi,'_');
        html += '<label class="subj-item-jhs" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">' +
            '<input type="checkbox" id="'+id+'" value="'+s.name+'" data-'+prefix+'-subj data-dept="jhs" data-category="'+s.category+'" data-strand="'+(s.strand||'all')+'" style="cursor:pointer;width:16px;height:16px;flex-shrink:0"> '+s.name+assignedTag(s.name)+'</label>';
    });
    html += '</div>';
    
    // SHS Core Subjects
    const shsCoreSubjs = shsSubjsData.filter(s => s.category === 'core' || !s.category);
    if (shsCoreSubjs.length > 0) {
        html += '<div class="subj-group-shs subj-group-shs-core" style="font-size:12px;font-weight:800;color:var(--text2);letter-spacing:1px;margin-bottom:8px;padding:6px 10px;background:var(--bg3);border-radius:6px">'+SHS_CORE_SECTION+'</div>';
        html += '<div class="subj-group-shs subj-group-shs-core" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">';
        shsCoreSubjs.forEach(function(s) {
            var id = prefix + '_cb_' + s.name.replace(/[^A-Z0-9]/gi,'_');
            html += '<label class="subj-item-shs subj-item-shs-core subj-grade-'+(s._grade||'all')+'" data-shs-grade="'+(s._grade||'all')+'" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">' +
                '<input type="checkbox" id="'+id+'" value="'+s.name+'" data-'+prefix+'-subj data-dept="shs" data-category="core" data-grade="'+(s._grade||'all')+'" data-strand="'+(s.strand||'all')+'" style="cursor:pointer;width:16px;height:16px;flex-shrink:0"> '+s.name+assignedTag(s.name)+'</label>';
        });
        html += '</div>';
    }
    
    // SHS Applied/Specialized Subjects - filtered by strand for old curriculum or elective type/subtype for new curriculum
    const shsAppliedSubjs = shsSubjsData.filter(s => {
        if (s.category !== 'applied') return false;
        
        // For old curriculum, filter by strand
        if (currentCurr === 'old' && selectedStrand !== 'all') {
            return s.strand === selectedStrand || s.strand === 'all';
        }
        
        // For new curriculum, filter by elective type and subtype
        if (currentCurr === 'new' && selectedElectiveType !== 'all') {
            // First check elective type
            if (s.elective_type !== selectedElectiveType && s.elective_type !== 'all' && s.elective_type) {
                return false;
            }
            
            // Then check subtype if one is selected
            if (selectedElectiveSubtype) {
                return s.elective_subtype === selectedElectiveSubtype || s.elective_subtype === 'all' || !s.elective_subtype;
            }
            
            return true;
        }
        
        return true;
    });
    
    if (shsAppliedSubjs.length > 0) {
        html += '<div class="subj-group-shs subj-group-shs-applied" style="font-size:12px;font-weight:800;color:var(--text2);letter-spacing:1px;margin-bottom:8px;padding:6px 10px;background:var(--bg3);border-radius:6px">'+SHS_APPLIED_SECTION+'</div>';
        html += '<div class="subj-group-shs subj-group-shs-applied" style="display:flex;flex-direction:column;gap:6px">';
        shsAppliedSubjs.forEach(function(s) {
            var id = prefix + '_cb_' + s.name.replace(/[^A-Z0-9]/gi,'_');
            html += '<label class="subj-item-shs subj-item-shs-applied subj-grade-'+(s._grade||'all')+'" data-shs-grade="'+(s._grade||'all')+'" data-strand="'+(s.strand||'all')+'" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">' +
                '<input type="checkbox" id="'+id+'" value="'+s.name+'" data-'+prefix+'-subj data-dept="shs" data-category="applied" data-grade="'+(s._grade||'all')+'" data-strand="'+(s.strand||'all')+'" style="cursor:pointer;width:16px;height:16px;flex-shrink:0"> '+s.name+assignedTag(s.name)+'</label>';
        });
        html += '</div>';
    }
    
    return html;
}
 
function subjectOptions(teacherId = null, sectionId = null) {
    // Get subjects based on current term/semester
    const currentCurr = window.currentCurriculum || 'new';
    const currentTerm = window.currentTerm || '1';
    const currentSemester = window.currentSemester || '1';
    
    let subjects = [];
    
    // If teacher and section are provided, filter subjects appropriately
    if (teacherId && sectionId) {
        const teacher = teachersCache.find(t => t.id === teacherId);
        const section = SECTIONS.find(s => s.id === sectionId);
        
        if (teacher && section) {
            const teacherDepts = teacher.departments || {};
            const sectionGrade = section.grade;
            const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : 
                                  (teacher.subject ? [teacher.subject] : []);
            
            // Only show subjects that match the section's grade level and teacher's department
            if (sectionGrade <= 10 && teacherDepts.jhs === true) {
                // JHS section and teacher has JHS department
                if (subjectsCache?.jhs) {
                    const jhsSubjects = currentCurr === 'new' 
                        ? subjectsCache.jhs.filter(s => s.term === currentTerm)
                        : subjectsCache.jhs;
                    
                    // Filter by teacher's assigned subjects if any
                    const filteredSubjects = teacherSubjects.length > 0 
                        ? jhsSubjects.filter(s => teacherSubjects.includes(s.name))
                        : jhsSubjects;
                    
                    subjects = filteredSubjects.map(s => s.name);
                }
            } else if (sectionGrade > 10 && teacherDepts.shs === true) {
                // SHS section and teacher has SHS department
                const hasGrade11 = teacherDepts.grade11 === true;
                const hasGrade12 = teacherDepts.grade12 === true;
                
                if ((sectionGrade === 11 && hasGrade11) || (sectionGrade === 12 && hasGrade12)) {
                    if (subjectsCache) {
                        let shsSubjects = [];
                        if (currentSemester === '1') {
                            shsSubjects = [...(subjectsCache.g11Sem1 || []), ...(subjectsCache.g12Sem1 || [])];
                        } else {
                            shsSubjects = [...(subjectsCache.g11Sem2 || []), ...(subjectsCache.g12Sem2 || [])];
                        }
                        
                        // Get the section's assigned elective subtypes
                        let sectionElectiveSubtypes = [];
                        try {
                            if (section.section_elective_subtypes) {
                                sectionElectiveSubtypes = JSON.parse(section.section_elective_subtypes);
                            }
                        } catch (e) { sectionElectiveSubtypes = []; }
                        
                        // Filter by grade
                        let gradeFilteredSubjects = shsSubjects.filter(s => 
                            s.grade === 'both' || s.grade === sectionGrade.toString()
                        );
                        
                        // For SHS: only show core subjects + subjects matching section's elective subtypes
                        if (sectionElectiveSubtypes.length > 0) {
                            gradeFilteredSubjects = gradeFilteredSubjects.filter(s => {
                                // Always include core subjects
                                if (s.category === 'core' || !s.category) return true;
                                // For applied/specialized: only include if matches section's elective subtype
                                if (s.elective_subtype) {
                                    return sectionElectiveSubtypes.includes(s.elective_subtype);
                                }
                                // For old curriculum (strand-based): match by strand
                                if (s.strand && s.strand !== 'all') {
                                    return s.strand === section.strand;
                                }
                                return true;
                            });
                        }
                        
                        // Further filter by teacher's assigned subjects if any
                        const finalSubjects = teacherSubjects.length > 0 
                            ? gradeFilteredSubjects.filter(s => teacherSubjects.includes(s.name))
                            : gradeFilteredSubjects;
                        
                        subjects = [...new Set(finalSubjects.map(s => s.name))];
                    }
                }
            }
            
            // If no subjects found or teacher doesn't have appropriate department, return empty
            if (subjects.length === 0) {
                return '<option value="">-- No subjects available for this teacher/section combination --</option>';
            }
        }
    } else {
        // Original logic for general subject options
        // Get JHS subjects filtered by term (for new curriculum)
        if (subjectsCache?.jhs) {
            const jhsSubjects = currentCurr === 'new' 
                ? subjectsCache.jhs.filter(s => s.term === currentTerm)
                : subjectsCache.jhs;
            subjects = [...subjects, ...jhsSubjects.map(s => s.name)];
        }
        
        // Get SHS subjects filtered by semester
        if (subjectsCache) {
            if (currentSemester === '1') {
                subjects = [...subjects, ...(subjectsCache.g11Sem1?.map(s => s.name) || [])];
                subjects = [...subjects, ...(subjectsCache.g12Sem1?.map(s => s.name) || [])];
            } else {
                subjects = [...subjects, ...(subjectsCache.g11Sem2?.map(s => s.name) || [])];
                subjects = [...subjects, ...(subjectsCache.g12Sem2?.map(s => s.name) || [])];
            }
        }
        
        // Remove duplicates
        subjects = [...new Set(subjects)];
        
        // Fallback to hardcoded list if cache is empty
        if (subjects.length === 0) {
            subjects = ['MATH 7','MATH 8','MATH 9','MATH 10',
                'ENGLISH 7','ENGLISH 8','ENGLISH 9','ENGLISH 10',
                'SCIENCE 7','SCIENCE 8','SCIENCE 9','SCIENCE 10',
                'FILIPINO 7','FILIPINO 8','FILIPINO 9','FILIPINO 10',
                'AP 7','AP 8','AP 9','AP 10',
                'ORAL COMMUNICATION','READING AND WRITING','KOMUNIKASYON',
                'GENERAL MATHEMATICS','STATISTICS','PRE-CALCULUS',
                'EARTH SCIENCE','BIOLOGY','CHEMISTRY','PHYSICS',
                'APPLIED ECONOMICS','ORGANIZATION AND MANAGEMENT','BUSINESS MATH',
                'CREATIVE WRITING','TRENDS AND ISSUES','CREATIVE NONFICTION',
                'PRACTICAL RESEARCH 1','PRACTICAL RESEARCH 2',
                'COOKERY','BREAD AND PASTRY','FOOD AND BEVERAGE',
                'EMPOWERMENT TECH','PROGRAMMING','SYSTEMS ADMIN',
                'PERSONAL DEVELOPMENT','EARTH AND LIFE SCIENCE',
                'UNDERSTANDING CULTURE','MEDIA AND INFO LITERACY','OTHER'];
        }
    }
    
    return '<option value="">-- Select Subject --</option>' +
        subjects.map(function(s){ return '<option value="'+s+'">'+s+'</option>'; }).join('');
}
 
const SUBJECTS = [
    'MATH','ENGLISH','SCIENCE','FILIPINO','AP','MAPEH','TLE','COMPUTER','VALUES',
    'ORAL COMMUNICATION','READING AND WRITING','KOMUNIKASYON',
    'GENERAL MATHEMATICS','STATISTICS','PRE-CALCULUS',
    'EARTH SCIENCE','BIOLOGY','CHEMISTRY','PHYSICS',
    'PERSONAL DEVELOPMENT','EARTH & LIFE SCIENCE',
    'UNDERSTANDING CULTURE','MEDIA & INFO LITERACY',
    'PE & HEALTH 11','PE & HEALTH 12',
    'PRACTICAL RESEARCH 1','PRACTICAL RESEARCH 2',
    'APPLIED ECONOMICS','ORGANIZATION & MANAGEMENT','BUSINESS MATH',
    'CREATIVE WRITING','TRENDS & ISSUES','CREATIVE NONFICTION',
    'COOKERY','BREAD & PASTRY','FOOD & BEVERAGE',
    'EMPOWERMENT TECH','PROGRAMMING','SYSTEMS ADMIN',
    'OTHER',
];
 
 
// ============================================================
// 02. HELPERS
// ============================================================
 
const AVATAR_COLORS = ['av-blue','av-purple','av-green','av-orange','av-red','av-yellow'];
 
function getAvatarColor(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
 

function getSubjectsForGrade(grade) {
    const currentCurr = window.currentCurriculum || 'new';
    const currentTerm = window.currentTerm || '1';
    const currentSemester = window.currentSemester || '1';
    
    if (!grade) {
        let allSubjects = [];
        if (subjectsCache?.jhs) {
            const jhsSubjects = currentCurr === 'new' 
                ? subjectsCache.jhs.filter(s => s.term === currentTerm || s.term === 'all' || !s.term)
                : subjectsCache.jhs;
            allSubjects = [...allSubjects, ...jhsSubjects.map(s => s.name)];
        }
        if (subjectsCache) {
            const semester = currentSemester === '1';
            allSubjects = [...allSubjects, ...(subjectsCache[semester ? 'g11Sem1' : 'g11Sem2']?.map(s => s.name) || [])];
            allSubjects = [...allSubjects, ...(subjectsCache[semester ? 'g12Sem1' : 'g12Sem2']?.map(s => s.name) || [])];
        }
        return allSubjects.length > 0 ? Array.from(new Set(allSubjects)) : SUBJECTS;
    }
    
    if (grade < 11) {
        return subjectsCache?.jhs
            ? Array.from(new Set((currentCurr === 'new' 
                ? subjectsCache.jhs.filter(s => s.term === currentTerm || s.term === 'all' || !s.term)
                : subjectsCache.jhs)
                .map(s => s.name)))
            : ['MATH','ENGLISH','SCIENCE','FILIPINO','AP','MAPEH','TLE','COMPUTER','VALUES'];
    }
    
    let shsSubjects = [];
    if (subjectsCache) {
        const semester = currentSemester === '1';
        shsSubjects = [
            ...(subjectsCache[semester ? 'g11Sem1' : 'g11Sem2']?.map(s => s.name) || []),
            ...(subjectsCache[semester ? 'g12Sem1' : 'g12Sem2']?.map(s => s.name) || [])
        ];
    }
    return shsSubjects.length > 0 ? Array.from(new Set(shsSubjects)) : SUBJECTS.filter(s => !['MATH','ENGLISH','SCIENCE','FILIPINO','AP','MAPEH','TLE','COMPUTER','VALUES'].includes(s));
}

function getSubjectsForSection(secId) {
    if (!secId) return getSubjectsForGrade(null);
    const sec = SECTIONS.find(s => s.id === secId);
    return sec ? getSubjectsForGrade(sec.grade) : getSubjectsForGrade(null);
}

function getSubjectClass(s) {
    if (!s) return '';
    const u = s.toUpperCase();
    if (u.includes('MATH'))                                                   return 'subj-math';
    if (u.includes('ENGLISH'))                                                return 'subj-english';
    if (u.includes('SCIENCE')||u.includes('BIOLOGY')||
        u.includes('CHEMISTRY')||u.includes('PHYSICS'))                       return 'subj-science';
    if (u.includes('FILIPINO')||u.includes('KOMUNIKASYON'))                   return 'subj-filipino';
    if (u.includes('AP')||u.includes('ECONOMICS'))                            return 'subj-ap';
    if (u.includes('MAPEH')||u.includes('PE &')||u.includes('HEALTH'))        return 'subj-mapeh';
    if (u.includes('TLE')||u.includes('COOKERY')||
        u.includes('BREAD')||u.includes('FOOD'))                              return 'subj-tle';
    if (u.includes('COMPUTER')||u.includes('PROGRAMMING')||u.includes('TECH'))return 'subj-computer';
    if (u.includes('VALUES')||u.includes('PERSONAL'))                         return 'subj-values';
    return 'subj-other';
}
 
function getGradeClass(g) {
    return {7:'g7',8:'g8',9:'g9',10:'g10',11:'g11',12:'g12'}[g] || 'g7';
}
 
function getInitials(name) {
    const parts = name.replace(/^(MR\.|MRS\.|MS\.|DR\.)\s*/i,'').trim().split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
 
function shortSecName(name) {
    return name.replace(/GRADE \d+ - /,'').replace(/GRADE \d+ - ST\. /,'St. ');
}
 
// Convert DB section row → SECTIONS array format
function dbSectionToLocal(row) {
    const strand = row.strand || null;
    // Extract short section name from full display name
    let section = row.name;
    section = section.replace(/^GRADE \d+ - /, '');
    if (strand) section = section.replace(strand + ' ', '');
    return {
        id:           row.id,
        name:         row.name,
        grade:        row.grade,
        section:      section,
        strand:       strand || null,
        availability: row.availability || {},
        room:         row.room || '',
        section_elective_subtypes: row.section_elective_subtypes || null,
    };
}

function renderElectiveSubtypePills(type) {
    const subtypes = (window.ELECTIVE_SUBTYPES && window.ELECTIVE_SUBTYPES[type]) || [];
    if (!subtypes.length) return '';
    return `
        <div class="elective-subtype-row" style="display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0 0">
            ${subtypes.map(subtype => `<span style="font-size:11px;padding:5px 8px;border:1px solid var(--border);border-radius:999px;background:var(--bg2);color:var(--text2)">${subtype.name}</span>`).join('')}
        </div>
    `;
}
 
// ============================================================
// 03. THEME
// ============================================================
 
function initTheme() {
    const saved = localStorage.getItem('jhs_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeBtn(saved);
}
 
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('jhs_theme', next);
    updateThemeBtn(next);
}
 
function updateThemeBtn(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀ Light' : '🌙 Dark';
}

function toggleMenu(event, menuId) {
    event.stopPropagation();
    const menu = document.getElementById(menuId);
    const otherMenuId = menuId === 'excelSubmenu' ? 'pdfSubmenu' : menuId === 'pdfSubmenu' ? 'excelSubmenu' : null;
    menu.classList.toggle('hidden');
    if (otherMenuId) document.getElementById(otherMenuId).classList.add('hidden');
}

function toggleExportMenu(event) { toggleMenu(event, 'exportMenu'); }
function toggleExcelSubmenu(event) { toggleMenu(event, 'excelSubmenu'); }
function togglePDFSubmenu(event) { toggleMenu(event, 'pdfSubmenu'); }

function handleExport(action, menuIds = {main: 'exportMenu'}) {
    return event => {
        event.stopPropagation();
        try { action(); } catch (error) { showToast('Export failed: ' + error.message, 'error'); }
        Object.values(menuIds).forEach(id => document.getElementById(id)?.classList.add('hidden'));
    };
}

const exportAllTeachersSchedules = handleExport(() => exportAllTeachersToExcel(), {main: 'exportMenu', sub: 'excelSubmenu'});
const exportAllSectionsSchedules = handleExport(() => exportAllSectionsToExcel(), {main: 'exportMenu', sub: 'excelSubmenu'});
const exportAllTeachersPDF = handleExport(() => printAllTeachers(), {main: 'exportMenu', sub: 'pdfSubmenu'});
const exportAllSectionsPDF = handleExport(() => openPrintSectionsChoice(), {main: 'exportMenu', sub: 'pdfSubmenu'});
const exportDashboardData = event => { event.stopPropagation(); showDashboardExportModal(); document.getElementById('exportMenu').classList.add('hidden'); document.getElementById('excelSubmenu').classList.add('hidden'); };
const exportDashboardDataPDF = event => { event.stopPropagation(); showDashboardPDFModal(); document.getElementById('exportMenu').classList.add('hidden'); document.getElementById('pdfSubmenu').classList.add('hidden'); };

// Show dashboard export options modal
function showDashboardExportModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 550px;">
            <div class="modal-header">
                <h3>📊 Dashboard Excel Export Options</h3>
                <button class="panel-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label class="form-label" style="font-size: 16px; font-weight: 600; margin-bottom: 12px; display: block;">
                        📅 Select Report Scope
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- Entire School Year Option -->
                        <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid var(--border); border-radius: 10px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                            <input type="radio" name="exportScope" value="full-year" style="width: 18px; height: 18px;" onchange="toggleExcelScopeOptions()">
                            <div>
                                <div style="font-weight: 700; font-size: 15px; color: var(--accent);">🏫 Entire School Year</div>
                                <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Complete overview - All JHS terms and SHS semesters</div>
                            </div>
                        </label>

                        <!-- JHS Section -->
                        <div style="border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg2);">
                            <label style="display: flex; align-items: center; gap: 12px; padding: 14px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                <input type="radio" name="exportScope" value="jhs-section" style="width: 18px; height: 18px;" onchange="toggleExcelScopeOptions()">
                                <div>
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text1);">📚 Junior High School (JHS)</div>
                                    <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Select specific terms or all JHS data</div>
                                </div>
                            </label>
                            <div id="excelJhsOptions" style="display: none; padding: 12px; border-top: 1px solid var(--border);">
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="jhs-all" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">All JHS Terms</div>
                                            <div style="font-size: 12px; color: var(--text2);">Terms 1, 2, and 3 combined</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="jhs-term1" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">1st Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS First Term subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="jhs-term2" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">2nd Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS Second Term subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="jhs-term3" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">3rd Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS Third Term subjects and schedules</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- SHS Section -->
                        <div style="border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg2);">
                            <label style="display: flex; align-items: center; gap: 12px; padding: 14px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                <input type="radio" name="exportScope" value="shs-section" style="width: 18px; height: 18px;" onchange="toggleExcelScopeOptions()">
                                <div>
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text1);">🎓 Senior High School (SHS)</div>
                                    <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Select specific semesters or all SHS data</div>
                                </div>
                            </label>
                            <div id="excelShsOptions" style="display: none; padding: 12px; border-top: 1px solid var(--border);">
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="shs-all" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">All SHS Semesters</div>
                                            <div style="font-size: 12px; color: var(--text2);">Semesters 1 and 2 combined</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="shs-sem1" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">1st Semester Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">SHS First Semester subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="exportScope" value="shs-sem2" style="width: 16px; height: 16px;" onchange="toggleExcelScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">2nd Semester Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">SHS Second Semester subjects and schedules</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Current Term/Semester (Default) -->
                        <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid var(--green); border-radius: 10px; cursor: pointer; background: rgba(34, 197, 94, 0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor='rgba(34, 197, 94, 0.15)'" onmouseout="this.style.backgroundColor='rgba(34, 197, 94, 0.1)'">
                            <input type="radio" name="exportScope" value="current" checked style="width: 18px; height: 18px;" onchange="toggleExcelScopeOptions()">
                            <div>
                                <div style="font-weight: 700; font-size: 15px; color: var(--green);">📅 Current Term/Semester</div>
                                <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">JHS Term ${window.currentTerm || '1'} | SHS Semester ${window.currentSemester || '1'} (Recommended)</div>
                            </div>
                        </label>

                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" onclick="executeDashboardExport(this.closest('.modal-overlay'))">Export Excel</button>
            </div>
        </div>`;
    
    document.body.appendChild(modal);
}

// Show dashboard PDF export options modal
function showDashboardPDFModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="modal-box" style="max-width: 550px;">
            <div class="modal-header">
                <h3>📄 Dashboard PDF Export Options</h3>
                <button class="panel-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                    <label class="form-label" style="font-size: 16px; font-weight: 600; margin-bottom: 12px; display: block;">
                        📅 Select Report Scope
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        
                        <!-- Entire School Year Option -->
                        <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid var(--border); border-radius: 10px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
                            <input type="radio" name="pdfExportScope" value="full-year" style="width: 18px; height: 18px;" onchange="togglePDFScopeOptions()">
                            <div>
                                <div style="font-weight: 700; font-size: 15px; color: var(--accent);">🏫 Entire School Year</div>
                                <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Complete overview - All JHS terms and SHS semesters</div>
                            </div>
                        </label>

                        <!-- JHS Section -->
                        <div style="border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg2);">
                            <label style="display: flex; align-items: center; gap: 12px; padding: 14px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                <input type="radio" name="pdfExportScope" value="jhs-section" style="width: 18px; height: 18px;" onchange="togglePDFScopeOptions()">
                                <div>
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text1);">📚 Junior High School (JHS)</div>
                                    <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Select specific terms or all JHS data</div>
                                </div>
                            </label>
                            <div id="pdfJhsOptions" style="display: none; padding: 12px; border-top: 1px solid var(--border);">
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="jhs-all" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">All JHS Terms</div>
                                            <div style="font-size: 12px; color: var(--text2);">Terms 1, 2, and 3 combined</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="jhs-term1" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">1st Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS First Term subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="jhs-term2" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">2nd Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS Second Term subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="jhs-term3" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">3rd Term Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">JHS Third Term subjects and schedules</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- SHS Section -->
                        <div style="border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg2);">
                            <label style="display: flex; align-items: center; gap: 12px; padding: 14px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                <input type="radio" name="pdfExportScope" value="shs-section" style="width: 18px; height: 18px;" onchange="togglePDFScopeOptions()">
                                <div>
                                    <div style="font-weight: 700; font-size: 15px; color: var(--text1);">🎓 Senior High School (SHS)</div>
                                    <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">Select specific semesters or all SHS data</div>
                                </div>
                            </label>
                            <div id="pdfShsOptions" style="display: none; padding: 12px; border-top: 1px solid var(--border);">
                                <div style="display: flex; flex-direction: column; gap: 8px;">
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="shs-all" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">All SHS Semesters</div>
                                            <div style="font-size: 12px; color: var(--text2);">Semesters 1 and 2 combined</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="shs-sem1" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">1st Semester Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">SHS First Semester subjects and schedules</div>
                                        </div>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; background: var(--bg3); transition: all 0.2s;" onmouseover="this.style.backgroundColor='var(--card-hover)'" onmouseout="this.style.backgroundColor='var(--bg3)'">
                                        <input type="radio" name="pdfExportScope" value="shs-sem2" style="width: 16px; height: 16px;" onchange="togglePDFScopeOptions()">
                                        <div>
                                            <div style="font-weight: 600; font-size: 14px;">2nd Semester Only</div>
                                            <div style="font-size: 12px; color: var(--text2);">SHS Second Semester subjects and schedules</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Current Term/Semester (Default) -->
                        <label style="display: flex; align-items: center; gap: 12px; padding: 14px; border: 2px solid var(--green); border-radius: 10px; cursor: pointer; background: rgba(34, 197, 94, 0.1); transition: all 0.2s;" onmouseover="this.style.backgroundColor='rgba(34, 197, 94, 0.15)'" onmouseout="this.style.backgroundColor='rgba(34, 197, 94, 0.1)'">
                            <input type="radio" name="pdfExportScope" value="current" checked style="width: 18px; height: 18px;" onchange="togglePDFScopeOptions()">
                            <div>
                                <div style="font-weight: 700; font-size: 15px; color: var(--green);">📅 Current Term/Semester</div>
                                <div style="font-size: 13px; color: var(--text2); margin-top: 2px;">JHS Term ${window.currentTerm || '1'} | SHS Semester ${window.currentSemester || '1'} (Recommended)</div>
                            </div>
                        </label>

                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" onclick="executeDashboardPDFExport(this.closest('.modal-overlay'))">Export PDF</button>
            </div>
        </div>`;
    
    document.body.appendChild(modal);
}

// Execute dashboard export with selected scope
function executeDashboardExport(modal) {
    const selectedScope = modal.querySelector('input[name="exportScope"]:checked').value;
    modal.remove();
    exportDashboardToExcelWithScope(selectedScope);
}

// Execute dashboard PDF export with selected scope
function executeDashboardPDFExport(modal) {
    const selectedScope = modal.querySelector('input[name="pdfExportScope"]:checked').value;
    modal.remove();
    printDashboardReportWithScope(selectedScope);
}

const handleExportExcel = event => { event.stopPropagation(); exportToExcel(); document.getElementById('exportMenu').classList.add('hidden'); };
const handleExportPDF = event => { event.stopPropagation(); exportToPDF(); document.getElementById('exportMenu').classList.add('hidden'); };
const handlePrint = event => { event.stopPropagation(); openPrintAllModal(); document.getElementById('exportMenu').classList.add('hidden'); };

// Close export menu when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.export-dropdown');
    const menu = document.getElementById('exportMenu');
    const excelSubmenu = document.getElementById('excelSubmenu');
    const pdfSubmenu = document.getElementById('pdfSubmenu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.add('hidden');
        if (excelSubmenu) excelSubmenu.classList.add('hidden');
        if (pdfSubmenu) pdfSubmenu.classList.add('hidden');
    }
});
 
 
// ============================================================
// 04. API
// ============================================================
 
async function apiFetch(url, options = {}) {
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        
        const data = await res.json();
        
        // Check if response is ok
        if (!res.ok) {
            console.error('API HTTP error:', res.status, res.statusText);
            console.error('Response data:', data);
            return { success: false, error: data?.error || `HTTP ${res.status}: ${res.statusText}` };
        }
        
        return data;
    } catch (e) {
        console.error('API fetch error:', e);
        showToast('⚠ API error: ' + e.message, 'error');
        return { success: false, error: e.message };
    }
}
 
async function loadScheduleFromDB() {
    const data = await apiFetch(API.schedule);
    if (data?.success) scheduleCache = data.data || {};
}
 
async function loadTeachersFromDB() {
    const data = await apiFetch(API.teachers);
    if (data?.success) {
        teachersCache = data.data.map(t => {
            const rawSubjects = t.subjects;
            const parsedSubjects = Array.isArray(rawSubjects)
                ? rawSubjects
                : (typeof rawSubjects === 'string'
                    ? (rawSubjects.trim().startsWith('[')
                        ? JSON.parse(rawSubjects)
                        : rawSubjects.split('|'))
                    : []);
            const normalizedSubjects = Array.isArray(parsedSubjects)
                ? parsedSubjects.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
                : [];
            return {
                ...t,
                subjects: normalizedSubjects.length ? Array.from(new Set(normalizedSubjects)) : (t.subject ? [t.subject] : [])
            };
        });
    }
}
 
async function loadSectionsFromDB() {
    const data = await apiFetch(API.sections);
    if (data?.success) {
        SECTIONS = data.data.map(dbSectionToLocal);
    }
}
 
async function saveSlotToDB(tid, day, slotId, sectionId, subject) {
    const result = await apiFetch(API.schedule, {
        method: 'POST',
        body: JSON.stringify({ teacher_id: tid, day, slot_id: slotId, section_id: sectionId, subject }),
    });
    
    // Real-time update: Recalculate teacher's total periods
    if (result?.success) {
        updateTeacherPeriodCount(tid);
    }
    
    return result?.success;
}

// Helper function to recalculate and update teacher's period count in real-time
function updateTeacherPeriodCount(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    
    // Count all scheduled periods for this teacher
    const sched = scheduleCache[tid] || {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let totalPeriods = 0;
    
    days.forEach(day => {
        const dayData = sched[day] || {};
        totalPeriods += Object.keys(dayData).filter(slot => dayData[slot]?.subject).length;
    });
    
    // Update teacher's total_periods
    teacher.total_periods = totalPeriods;
    
    // Update UI elements that display period count
    updateTeacherCardDisplay(tid);
    updateTeacherPanelDisplay(tid);
}

// Update teacher card display (in grid view)
function updateTeacherCardDisplay(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    
    // Find the teacher card element
    const cardElement = document.querySelector(`[data-teacher-id="${tid}"]`);
    if (!cardElement) return;
    
    // Update periods text
    const periodsElement = cardElement.querySelector('.tc-periods');
    if (periodsElement) {
        const totalPeriods = teacher.total_periods || 0;
        periodsElement.textContent = totalPeriods > 0 
            ? `${totalPeriods} period${totalPeriods !== 1 ? 's' : ''} assigned` 
            : 'No schedule yet';
    }
    
    // Update load percentage bar
    const maxLoad = getTeacherMaxLoad(teacher);
    const loadPct = Math.min(Math.round((teacher.total_periods || 0) / maxLoad * 100), 100);
    const loadFill = cardElement.querySelector('.tc-load-fill');
    if (loadFill) {
        loadFill.style.width = `${loadPct}%`;
        // Update color based on load
        loadFill.className = 'tc-load-fill';
        if (loadPct >= 90) loadFill.classList.add('load-full');
        else if (loadPct >= 70) loadFill.classList.add('load-high');
        else if (loadPct >= 50) loadFill.classList.add('load-mid');
        else loadFill.classList.add('load-low');
    }
    
    // Update load percentage text
    const loadText = cardElement.querySelector('.tc-load-text');
    if (loadText) {
        loadText.textContent = `${loadPct}%`;
    }
}

// Update teacher panel display (when viewing teacher schedule)
function updateTeacherPanelDisplay(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    
    // Update panel if it's currently showing this teacher
    const panelSubject = document.getElementById('panelTeacherSubject');
    if (panelSubject && window.currentTeacher === tid) {
        panelSubject.textContent = `${teacher.total_periods || 0} periods assigned`;
    }
}
 
 
// ============================================================
// 05. NAVIGATION
// ============================================================
 
function switchView(view) {
    // Hide all .view elements
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    
    // Also hide the teacherinfo div (it has no .view class)
    const tiDiv = document.getElementById('view-teacherinfo');
    if (tiDiv) tiDiv.style.display = 'none';

    // Remove active from nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    // Show the selected view
    if (view === 'teacherinfo') {
        if (tiDiv) tiDiv.style.display = 'block';
    } else {
        const viewElement = document.getElementById('view-' + view);
        if (viewElement) {
            viewElement.classList.add('active');
            viewElement.style.display = 'block';
        }
    }

    // Activate nav tab
    const navElement = document.querySelector(`[data-view="${view}"]`);
    if (navElement) navElement.classList.add('active');

    currentView = view;

    if (view === 'dashboard')    renderDashboard();
    if (view === 'teachers')     loadTeachersFromDB().then(() => initializeTeacherView());
    if (view === 'sections') {
        clearSectionScheduleDisplay();
        renderSectionView();
    }
    if (view === 'subjects')     renderSubjectsView();
    if (view === 'teacherinfo')  renderTeacherInfoView();
}

function clearSectionScheduleDisplay() {
    const title = document.getElementById('sectionSchedTitle');
    const body  = document.getElementById('sectionSchedBody');
    const printBtn = document.getElementById('printScheduleBtn');
    const badge = document.getElementById('sectionStrandBadge');

    if (title) title.textContent = 'Select a section above';
    if (body) body.innerHTML = '';
    if (printBtn) printBtn.style.display = 'none';
    if (badge) badge.innerHTML = '';
}

 
 
// ============================================================
// 06. DASHBOARD
// ============================================================
 
async function renderDashboard() {
    const data = await apiFetch(API.stats);
    if (!data?.success) return;

    // Make stat cards clickable
    const tc = document.getElementById('stat-teachers')?.closest('.stat-card');
    if (tc) { tc.style.cursor='pointer'; tc.onclick = () => switchView('teacherinfo'); }
    const sc = document.getElementById('stat-sections')?.closest('.stat-card');
    if (sc) { sc.style.cursor='pointer'; sc.onclick = () => switchView('sections'); }
    const cc = document.getElementById('stat-conflicts')?.closest('.stat-card');
    if (cc) { cc.style.cursor='pointer'; cc.onclick = () => switchView('sections'); }

    animateCount('stat-teachers', data.teachers);
    animateCount('stat-sections', data.sections);
    animateCount('stat-assigned', data.assigned_periods);
    animateCount('stat-conflicts', data.conflicts);

    const conflictCard = document.getElementById('stat-conflicts').closest('.stat-card');
    conflictCard.style.borderColor = data.conflicts > 0 ? 'var(--red)' : '';

    renderSectionProgress(data.section_completion);
    await loadTeachersFromDB();
    renderWorkloadTable();
}
function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let cur = 0;
    const step = Math.ceil(target / 20);
    const iv = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur;
        if (cur >= target) clearInterval(iv);
    }, 30);
}

// Helper function to calculate teacher's max load consistently
function getTeacherMaxLoad(teacher) {
    // Use teacher's custom load if available
    if (teacher.load && teacher.load.trim() !== '' && parseInt(teacher.load) > 0) {
        return parseInt(teacher.load);
    }
    
    // Determine max load based on teacher's departments
    const depts = teacher.departments || {};
    const teachesJHS = depts.jhs === true;
    const teachesSHS = depts.shs === true;
    const teachesGrade11 = depts.grade11 === true;
    const teachesGrade12 = depts.grade12 === true;
    
    // Calculate max load based on departments
    if (teachesJHS && teachesSHS) {
        // Teaching both JHS and SHS - use the higher limit
        return 54; // SHS: 9 periods/day * 6 days
    } else if (teachesSHS && (teachesGrade11 || teachesGrade12)) {
        // Teaching SHS only
        return 54; // 9 periods/day * 6 days
    } else if (teachesJHS) {
        // Teaching JHS only
        return 40; // 8 periods/day * 5 days
    } else {
        // No departments set - use intelligent fallback
        if (teacher.employment_type === 'part-time') {
            return 20;
        }
        // Check if they have any Saturday assignments (indicates SHS)
        if (teacher.sat && teacher.sat > 0) {
            return 54; // Has Saturday classes, likely SHS
        }
        // Check total periods to make an educated guess
        if (teacher.total_periods && teacher.total_periods > 40) {
            return 54; // More than JHS max, must be SHS
        }
        return 40; // Default to JHS load
    }
}

// Helper function to calculate teacher load percentage
function calculateTeacherLoadPercentage(teacher) {
    const maxLoad = getTeacherMaxLoad(teacher);
    const currentLoad = teacher.total_periods || 0;
    return Math.min(Math.round(currentLoad / maxLoad * 100), 100);
}

 
function renderWorkloadTable() {
    const tbody = document.getElementById('workloadBody');
    const query = (document.getElementById('teacherSearch')?.value || '').toLowerCase();
    const filtered = teachersCache.filter(t => t.name.toLowerCase().includes(query));
    
    tbody.innerHTML = filtered.map(t => {
        const maxLoad = getTeacherMaxLoad(t);
        const pct = maxLoad > 0 ? Math.min(Math.round((t.total_periods / maxLoad) * 100), 100) : 0;
        const fc = pct >= 80 ? 'load-high' : pct >= 50 ? 'load-mid' : 'load-low';
        return `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="tc-avatar ${getAvatarColor(t.id)}" style="width:30px;height:30px;font-size:11px">${getInitials(t.name)}</div><span style="font-weight:600">${t.name}</span></div></td><td>${t.mon}</td><td>${t.tue}</td><td>${t.wed}</td><td>${t.thu}</td><td>${t.fri}</td><td>${t.sat}</td><td><strong>${t.total_periods}</strong><span style="font-size:11px;color:var(--text2);margin-left:4px">/ ${maxLoad}</span></td><td><div style="display:flex;align-items:center;gap:6px"><div class="load-bar"><div class="load-fill ${fc}" style="width:${Math.min(pct, 100)}%"></div></div><span style="font-size:11px;color:var(--text2)">${pct}%</span></div></td></tr>`;
    }).join('');
}
 
function filterTeachers() { renderWorkloadTable(); }
 
// ========================= TEACHER INFO VIEW =========================
async function renderTeacherInfoView() {
    if (!teachersCache || teachersCache.length === 0) {
        await loadTeachersFromDB();
    }
    filterTeacherInfo();
}
 


async function saveRoomNumber(tid, room) {
    const res = await apiFetch(API.teachers, {
        method: 'PUT',
        body: JSON.stringify({ id: tid, room_number: room, _only: 'room' }),
    });
    if (res?.success) {
        const t = teachersCache.find(t => t.id === tid);
        if (t) t.room_number = room;
        showToast(room ? '✓ Room saved' : '✓ Room cleared', 'success');
    } else {
        showToast('✗ Failed to save room', 'error');
    }
}

async function saveAdvisorySection(tid, secId) {
    // Check if section is already occupied by another teacher
    if (secId) {
        const existingAdviser = teachersCache.find(teacher => 
            teacher.advisory_section === secId && teacher.id !== tid
        );
        
        if (existingAdviser) {
            const confirmMsg = `Section ${SECTIONS.find(s => s.id === secId)?.name} is already assigned to ${existingAdviser.name}. Do you want to reassign it?`;
            if (!confirm(confirmMsg)) {
                // Reset the dropdown to previous value
                const currentTeacher = teachersCache.find(t => t.id === tid);
                const dropdown = document.querySelector(`select[onchange*="${tid}"]`);
                if (dropdown && currentTeacher) {
                    dropdown.value = currentTeacher.advisory_section || '';
                }
                return;
            }
            
            // Clear the existing adviser's assignment
            existingAdviser.advisory_section = '';
            await apiFetch(API.teachers, {
                method: 'PUT',
                body: JSON.stringify({ id: existingAdviser.id, advisory_section: '', _only: 'advisory' }),
            });
        }
    }
    
    const res = await apiFetch(API.teachers, {
        method: 'PUT',
        body: JSON.stringify({ id: tid, advisory_section: secId, _only: 'advisory' }),
    });
    if (res?.success) {
        const t = teachersCache.find(t => t.id === tid);
        if (t) t.advisory_section = secId;
        showToast(secId ? '✓ Advisory section saved' : '✓ Advisory cleared', 'success');
        
        // Reload schedule cache to show auto-scheduled PRELIMINARIES
        await loadScheduleFromDB();
        
        // Re-render so room dropdown updates immediately
        filterTeacherInfo();
    } else {
        showToast('✗ Failed to save', 'error');
    }
}

function highlightOccupiedSections(selectElement) {
    // Add hover effect to occupied options
    const occupiedOptions = selectElement.querySelectorAll('option.occupied-section');
    occupiedOptions.forEach(option => {
        option.style.background = 'rgba(239,68,68,0.2)';
        option.style.color = '#dc2626';
    });
}

function removeHighlightOccupiedSections(selectElement) {
    // Remove hover effect from occupied options
    const occupiedOptions = selectElement.querySelectorAll('option.occupied-section');
    occupiedOptions.forEach(option => {
        option.style.background = 'rgba(239,68,68,0.1)';
        option.style.color = '#dc2626';
    });
}

function filterTeacherInfo() {
    const tbody = document.getElementById('teacherInfoBody');
    if (!tbody) return;
    
    if (!teachersCache || teachersCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text2)">No teachers found. Please add teachers first.</td></tr>';
        return;
    }
    
    const q = (document.getElementById('teacherInfoSearch')?.value || '').toLowerCase();
    const empFilter = document.getElementById('tiEmpFilter')?.value || 'all';
    const filtered = teachersCache.filter(t => t.name.toLowerCase().includes(q) && (empFilter === 'all' || (t.employment_type || '') === empFilter));
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text2)">No teachers match your search criteria.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(t => {
        const subjects = Array.isArray(t.subjects) && t.subjects.length ? t.subjects.map(s => `<span class="subj-badge ${getSubjectClass(s)}" style="margin:2px">${s}</span>`).join('') : t.subject ? `<span class="subj-badge ${getSubjectClass(t.subject)}">${t.subject}</span>` : '<span style="color:var(--text2);font-size:12px">No subjects assigned</span>';
        const empBadge = !t.employment_type ? `<span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:var(--bg3);color:var(--text2);border:1px solid var(--border);margin-top:4px;display:inline-block">Not Set</span>` : t.employment_type === 'part-time' ? `<span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:rgba(249,115,22,0.15);color:#f97316;border:1px solid #f97316;margin-top:4px;display:inline-block">Part Time</span>` : `<span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid #22c55e;margin-top:4px;display:inline-block">Full Time</span>`;
        
        const secOpts = SECTIONS.map(s => {
            const hasAdviser = teachersCache.some(teacher => teacher.advisory_section === s.id && teacher.id !== t.id);
            const isSelected = t.advisory_section === s.id;
            const optionClass = hasAdviser ? 'occupied-section' : '';
            const optionStyle = hasAdviser ? 'background:rgba(239,68,68,0.1);color:#dc2626;font-weight:600' : '';
            return `<option value="${s.id}" ${isSelected ? 'selected' : ''} class="${optionClass}" style="${optionStyle}">${s.name}${hasAdviser ? ' (Occupied)' : ''}</option>`;
        }).join('');
        
        const adviserCell = `<select class="form-input advisory-select" style="font-size:11px;padding:4px 6px;min-width:180px" onchange="saveAdvisorySection('${t.id}',this.value)" onmouseover="highlightOccupiedSections(this)" onmouseout="removeHighlightOccupiedSections(this)" title="Red sections are already occupied by other teachers"><option value="">-- No Advisory --</option>${secOpts}</select>`;
        const advSec = SECTIONS.find(s => s.id === t.advisory_section);
        const roomText = advSec && advSec.room ? advSec.room : '—';
        const roomCell = `<div style="font-size:12px;color:${advSec && advSec.room ? 'var(--text1)' : 'var(--text2)'};font-weight:${advSec && advSec.room ? '600' : '400'}">${roomText}</div>`;
        
        const totalLoad = t.total_periods || 0;
        const maxLoad = getTeacherMaxLoad(t);
        const loadPct = Math.min(Math.round(totalLoad / maxLoad * 100), 100);
        const loadColor = totalLoad === 0 ? 'var(--text2)' : loadPct >= 80 ? 'var(--red)' : loadPct >= 50 ? 'var(--orange)' : 'var(--green)';
        const availHtml = `<div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px;font-weight:800;color:${loadColor}">${totalLoad}</span><div><div style="font-size:11px;color:var(--text2)">periods / week</div><div style="width:120px;height:8px;background:var(--bg3);border-radius:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${loadPct}%;background:${loadColor};border-radius:4px"></div></div><div style="font-size:10px;color:var(--text2);margin-top:2px">${loadPct}% of ${maxLoad} max</div></div></div>`;
        
        return `<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 14px;min-width:180px;vertical-align:middle"><div style="display:flex;align-items:center;gap:8px"><div class="tc-avatar ${getAvatarColor(t.id)}" style="width:32px;height:32px;font-size:11px;flex-shrink:0">${getInitials(t.name)}</div><div><div style="font-weight:700;font-size:13px">${t.name}</div>${empBadge}</div></div></td><td style="padding:10px 14px;min-width:160px;vertical-align:middle"><div style="display:flex;flex-wrap:wrap;gap:3px">${subjects}</div></td><td style="padding:10px 14px;min-width:190px;vertical-align:middle">${adviserCell}</td><td style="padding:10px 14px;min-width:140px;vertical-align:middle">${roomCell}</td><td style="padding:10px 14px;min-width:300px;vertical-align:middle">${availHtml}</td></tr>`;
    }).join('');
}
 
 
 
function renderSectionProgress(sections) {
    const container = document.getElementById('sectionProgress');
    container.innerHTML = sections.map(s => `
        <div class="sec-prog-card">
            <div class="sec-prog-name">
                <span class="grade-chip ${getGradeClass(s.grade)}">G${s.grade}</span>
                ${shortSecName(s.name)}
            </div>
            <div class="sec-prog-bar-outer">
                <div class="sec-prog-bar-fill" style="width:${s.pct}%"></div>
            </div>
            <div class="sec-prog-pct">${s.filled} periods</div>
        </div>`
    ).join('');
}
 
 
// ============================================================
// 07. TEACHERS VIEW + EDIT MODAL
// ============================================================
 
async function renderTeacherGrid(list) {
    const container = document.getElementById('teacherListGrid');
    const teachers = list || teachersCache;
    
    // Populate subject filter dropdown on first render
    await populateSubjectFilter();
    
    container.innerHTML = teachers.map(t => {
        const subjDisplay = Array.isArray(t.subjects) && t.subjects.length
            ? t.subjects.map(s => `<span class="subj-badge ${getSubjectClass(s)}" style="font-size:9px;margin:1px">${s}</span>`).join('')
            : t.subject
            ? `<span class="subj-badge ${getSubjectClass(t.subject)}" style="font-size:9px">${t.subject}</span>`
            : '<span style="color:var(--text2);font-size:10px">No subject set</span>';
        
        // Calculate load percentage
        const maxLoad = getTeacherMaxLoad(t);
        const loadPct = Math.min(Math.round((t.total_periods || 0) / maxLoad * 100), 100);
        
        return `<div class="teacher-card" data-teacher-id="${t.id}">
            <div class="tc-card-top" onclick="openTeacherPanel('${t.id}')">
                <div class="tc-avatar ${getAvatarColor(t.id)}">${getInitials(t.name)}</div>
                <div class="tc-name">${t.name}</div>
                <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:3px;min-height:18px">${subjDisplay}</div>
                <div style="margin-top:4px">
                    <span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;${t.employment_type==='part-time'?'background:rgba(249,115,22,0.15);color:#f97316;border:1px solid #f97316':'background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid #22c55e'}">
                        ${t.employment_type==='part-time'?'Part Time':'Full Time'}
                    </span>
                </div>
                <div class="tc-periods">
                    ${t.total_periods > 0 ? `${t.total_periods} period${t.total_periods !== 1 ? 's' : ''} assigned` : 'No schedule yet'}
                </div>
                <div class="tc-load">
                    <div class="tc-load-bar">
                        <div class="tc-load-fill ${loadPct >= 90 ? 'load-full' : loadPct >= 70 ? 'load-high' : loadPct >= 50 ? 'load-mid' : 'load-low'}" style="width:${loadPct}%"></div>
                    </div>
                    <span class="tc-load-text">${loadPct}%</span>
                </div>
            </div>
            <div class="tc-actions">
                <button class="btn-open-sched"     onclick="openTeacherPanel('${t.id}')">📅 Schedule</button>
                <button class="btn-print-teacher"  onclick="printTeacherSchedule('${t.id}')">🖨 Print</button>
                <button class="btn-edit-teacher"   onclick="openEditTeacher('${t.id}')">✏ Edit</button>
                <button class="btn-remove-teacher" onclick="removeTeacher('${t.id}','${t.name.replace(/'/g,"\\'")}')">✕</button>
            </div>
        </div>`;
    }).join('');
}

// ---- Teacher Grid Filtering ----

async function populateSubjectFilter() {
    const filterSubject = document.getElementById('filterSubject');
    if (!filterSubject || filterSubject.dataset.populated) return;
    
    try {
        // Fetch subjects from API to get grade level information
        const curriculum = window.currentCurriculum || 'new';
        const res = await fetch(`api/subjects.php?curriculum=${curriculum}`);
        const data = await res.json();
        
        if (!data.success) {
            console.error('Failed to fetch subjects for filter');
            return;
        }
        
        // Collect all unique subjects from teachers that actually exist in the database
        const teacherSubjects = new Set();
        teachersCache.forEach(t => {
            if (Array.isArray(t.subjects)) {
                t.subjects.forEach(s => teacherSubjects.add(s));
            } else if (t.subject) {
                teacherSubjects.add(t.subject);
            }
        });
        
        // Organize subjects by grade level
        const subjectsByGrade = {
            'jhs': { title: 'JHS (Grades 7-10)', subjects: [] },
            'g11sem1': { title: 'Grade 11 - 1st Semester', subjects: [] },
            'g11sem2': { title: 'Grade 11 - 2nd Semester', subjects: [] },
            'g12sem1': { title: 'Grade 12 - 1st Semester', subjects: [] },
            'g12sem2': { title: 'Grade 12 - 2nd Semester', subjects: [] }
        };
        
        // Process JHS subjects
        if (data.jhs) {
            data.jhs.forEach(subject => {
                if (teacherSubjects.has(subject.name)) {
                    subjectsByGrade.jhs.subjects.push(subject.name);
                }
            });
        }
        
        // Process SHS subjects
        if (data.g11Sem1) {
            data.g11Sem1.forEach(subject => {
                if (teacherSubjects.has(subject.name)) {
                    subjectsByGrade.g11sem1.subjects.push(subject.name);
                }
            });
        }
        
        if (data.g11Sem2) {
            data.g11Sem2.forEach(subject => {
                if (teacherSubjects.has(subject.name)) {
                    subjectsByGrade.g11sem2.subjects.push(subject.name);
                }
            });
        }
        
        if (data.g12Sem1) {
            data.g12Sem1.forEach(subject => {
                if (teacherSubjects.has(subject.name)) {
                    subjectsByGrade.g12sem1.subjects.push(subject.name);
                }
            });
        }
        
        if (data.g12Sem2) {
            data.g12Sem2.forEach(subject => {
                if (teacherSubjects.has(subject.name)) {
                    subjectsByGrade.g12sem2.subjects.push(subject.name);
                }
            });
        }
        
        // Clear existing options (except "All Subjects")
        while (filterSubject.children.length > 1) {
            filterSubject.removeChild(filterSubject.lastChild);
        }
        
        // Add organized optgroups
        Object.keys(subjectsByGrade).forEach(gradeKey => {
            const gradeData = subjectsByGrade[gradeKey];
            if (gradeData.subjects.length > 0) {
                // Sort subjects within each grade
                gradeData.subjects.sort();
                
                // Create optgroup
                const optgroup = document.createElement('optgroup');
                optgroup.label = gradeData.title;
                
                // Add subjects to optgroup
                gradeData.subjects.forEach(subjectName => {
                    const opt = document.createElement('option');
                    opt.value = subjectName;
                    opt.textContent = subjectName;
                    optgroup.appendChild(opt);
                });
                
                filterSubject.appendChild(optgroup);
            }
        });
        
        // If no subjects were found in any grade, fall back to the old method
        if (filterSubject.children.length === 1) {
            const allSubjects = Array.from(teacherSubjects).sort();
            allSubjects.forEach(subj => {
                const opt = document.createElement('option');
                opt.value = subj;
                opt.textContent = subj;
                filterSubject.appendChild(opt);
            });
        }
        
        filterSubject.dataset.populated = 'true';
        
    } catch (error) {
        console.error('Error populating subject filter:', error);
        
        // Fallback to old method if API fails
        const allSubjects = new Set();
        teachersCache.forEach(t => {
            if (Array.isArray(t.subjects)) {
                t.subjects.forEach(s => allSubjects.add(s));
            } else if (t.subject) {
                allSubjects.add(t.subject);
            }
        });
        
        const sortedSubjects = Array.from(allSubjects).sort();
        sortedSubjects.forEach(subj => {
            const opt = document.createElement('option');
            opt.value = subj;
            opt.textContent = subj;
            filterSubject.appendChild(opt);
        });
        
        filterSubject.dataset.populated = 'true';
    }
}

async function filterTeacherGrid() {
    const searchQuery = (document.getElementById('searchTeacher')?.value || '').toLowerCase().trim();
    const fullTimeChecked = document.getElementById('filterFullTime')?.checked;
    const partTimeChecked = document.getElementById('filterPartTime')?.checked;
    const jhsChecked = document.getElementById('filterJHS')?.checked;
    const shsChecked = document.getElementById('filterSHS')?.checked;
    const selectedSubject = document.getElementById('filterSubject')?.value || 'all';
    
    const filtered = teachersCache.filter(t => {
        // Search filter
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery)) {
            return false;
        }
        
        // Employment type filter
        if (fullTimeChecked || partTimeChecked) {
            const empType = t.employment_type || 'full-time';
            if (fullTimeChecked && empType !== 'full-time') return false;
            if (partTimeChecked && empType !== 'part-time') return false;
            if (fullTimeChecked && partTimeChecked) {
                // If both checked, show both types
                if (empType !== 'full-time' && empType !== 'part-time') return false;
            }
        }
        
        // Department filter
        if (jhsChecked || shsChecked) {
            const depts = t.departments || {};
            if (jhsChecked && !depts.jhs) return false;
            if (shsChecked && !depts.shs) return false;
        }
        
        // Subject filter
        if (selectedSubject !== 'all') {
            const teacherSubjects = Array.isArray(t.subjects) ? t.subjects : (t.subject ? [t.subject] : []);
            if (!teacherSubjects.includes(selectedSubject)) return false;
        }
        
        return true;
    });
    
    // Render based on current view
    if (currentTeacherView === 'list') {
        renderTeacherList(filtered);
    } else {
        await renderTeacherGrid(filtered);
    }
}

async function clearTeacherFilters() {
    document.getElementById('searchTeacher').value = '';
    document.getElementById('filterFullTime').checked = false;
    document.getElementById('filterPartTime').checked = false;
    document.getElementById('filterJHS').checked = false;
    document.getElementById('filterSHS').checked = false;
    document.getElementById('filterSubject').value = 'all';
    
    // Render based on current view
    if (currentTeacherView === 'list') {
        renderTeacherList();
    } else {
        await renderTeacherGrid();
    }
}
 
// ---- Add Teacher Modal ----
 
async function openAddTeacher() {
    // Build modal only once
    if (!document.getElementById('addTeacherModal')) {
        const m = document.createElement('div');
        m.id = 'addTeacherModal';
        m.className = 'modal-overlay hidden';
        m.onclick = function(e){ if(e.target===m) m.classList.add('hidden'); };
        m.innerHTML = '<div class="modal-box" style="max-height:90vh;display:flex;flex-direction:column">' +
            '<div class="modal-header" style="flex-shrink:0"><h3>Add New Teacher</h3><button class="panel-close" onclick="closeAddTeacher()">X</button></div>' +
            '<div class="modal-body" style="flex:1;overflow-y:auto;padding:20px">' +
                '<label class="form-label">Full Name (with title)</label>' +
                '<input type="text" id="newTeacherName" class="form-input" placeholder="e.g. MRS. JUAN DELA CRUZ" onkeydown="if(event.key===\'Enter\')submitAddTeacher()">' +
                '<p class="form-hint">Include title: MR. MRS. MS. DR.</p>' +
                '<div style="margin-top:8px">' +
                    '<label class="form-label" style="margin-bottom:6px">Select Department</label>' +
                    '<div style="display:flex;gap:12px;align-items:flex-start">' +
                        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600">' +
                            '<input type="checkbox" id="newDeptJHS" value="jhs" style="cursor:pointer" onchange="toggleNewShsGrades();filterNewSubjects()"> JHS (Grades 7-10)' +
                        '</label>' +
                        '<div style="display:flex;flex-direction:column;gap:6px">' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600">' +
                                '<input type="checkbox" id="newDeptSHS" value="shs" style="cursor:pointer" onchange="toggleNewShsGrades();filterNewSubjects()"> SHS' +
                            '</label>' +
                            '<div id="newShsGradePanel" style="display:none;flex-direction:column;gap:6px;margin-left:24px;padding:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px">' +
                                '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600">' +
                                    '<input type="checkbox" id="newGrade11" value="11" style="cursor:pointer" onchange="filterNewSubjects()"> Grade 11' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600">' +
                                    '<input type="checkbox" id="newGrade12" value="12" style="cursor:pointer" onchange="filterNewSubjects()"> Grade 12' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<label class="form-label" style="margin-top:12px">Employment Type</label>' +
                '<div style="display:flex;gap:12px;margin-top:6px;margin-bottom:12px">' +
                    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600">' +
                        '<input type="radio" name="newEmpType" id="newEmpFull" value="full-time" style="cursor:pointer"> Full Time' +
                    '</label>' +
                    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;font-weight:600">' +
                        '<input type="radio" name="newEmpType" id="newEmpPart" value="part-time" style="cursor:pointer"> Part Time' +
                    '</label>' +
                '</div>' +
                '<div style="margin-bottom:12px">' +
                    '<label class="form-label" style="font-size:13px;font-weight:600;margin-bottom:6px;display:block">Load: Total Hours</label>' +
                    '<input type="number" id="newTeacherLoad" class="form-input" style="width:120px;font-size:13px;padding:6px 10px" placeholder="0" min="0" max="100">' +
                    '<span style="font-size:12px;color:var(--text2);margin-left:6px">hours</span>' +
                '</div>' +
                '<div style="display:flex;gap:16px;margin-top:12px">' +
                    '<div style="flex:0 0 220px">' +
                        '<label class="form-label">Subjects</label>' +
                        '<div style="margin-top:4px;padding:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px">' +
                            '<div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px">Curriculum:</div>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;margin-bottom:4px">' +
                                '<input type="radio" name="newCurriculum" value="new" checked onchange="switchNewCurriculum(\'new\')" style="cursor:pointer;width:14px;height:14px"> New (Matatag)' +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600">' +
                                '<input type="radio" name="newCurriculum" value="old" onchange="switchNewCurriculum(\'old\')" style="cursor:pointer;width:14px;height:14px"> Old (K-12)' +
                            '</label>' +
                        '</div>' +
                        '<div id="newStrandPanel" style="margin-top:6px;padding:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;display:none">' +
                            '<div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px">Strand (Applied Subjects):</div>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;font-weight:600;margin-bottom:3px">' +
                                '<input type="radio" name="newStrand" value="ABM" onchange="filterNewByStrand(\'ABM\')" style="cursor:pointer;width:12px;height:12px"> ABM' +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;font-weight:600;margin-bottom:3px">' +
                                '<input type="radio" name="newStrand" value="STEM" onchange="filterNewByStrand(\'STEM\')" style="cursor:pointer;width:12px;height:12px"> STEM' +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;font-weight:600;margin-bottom:3px">' +
                                '<input type="radio" name="newStrand" value="TVL" onchange="filterNewByStrand(\'TVL\')" style="cursor:pointer;width:12px;height:12px"> TVL' +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;font-weight:600">' +
                                '<input type="radio" name="newStrand" value="HUMSS" onchange="filterNewByStrand(\'HUMSS\')" style="cursor:pointer;width:12px;height:12px"> HUMSS' +
                            '</label>' +
                        '</div>' +
                        '<div id="newTeacherSubjectsBox" style="margin-top:6px;padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);height:260px;overflow-y:auto">' +
                        subjectCheckboxes('new') +
                        '</div>' +
                    '</div>' +
                    '<div style="flex:1;min-width:0">' +
                        '<label class="form-label">Availability</label>' +
                        '<div style="margin-top:6px;padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);height:420px;overflow:auto">' +
                        availabilityCheckboxes('new') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer" style="flex-shrink:0;position:sticky;bottom:0;background:var(--bg1);border-top:1px solid var(--border);padding:16px 20px;display:flex;gap:12px;justify-content:flex-end;box-shadow:0 -2px 8px rgba(0,0,0,0.1)">' +
                '<button class="btn-cancel" onclick="closeAddTeacher()">Cancel</button>' +
                '<button class="btn-confirm" onclick="submitAddTeacher()">Add Teacher</button>' +
            '</div>' +
        '</div>';
        document.body.appendChild(m);
    }
    
    // Reset form
    document.getElementById('newTeacherName').value = '';
    document.getElementById('newTeacherLoad').value = '';
    document.querySelectorAll('[data-new-subj]').forEach(cb => cb.checked = false);
    
    // Set curriculum radio to current global curriculum
    const currentCurr = window.currentCurriculum || 'new';
    const newCurrRadios = document.querySelectorAll('input[name="newCurriculum"]');
    newCurrRadios.forEach(radio => {
        radio.checked = radio.value === currentCurr;
    });
    
    // Ensure subjects are loaded and refresh the subjects box
    await loadSubjectsFromDB();
    const subjectsBox = document.getElementById('newTeacherSubjectsBox');
    if (subjectsBox) {
        subjectsBox.innerHTML = subjectCheckboxes('new');
    }
    
    document.getElementById('addTeacherModal').classList.remove('hidden');
    setTimeout(function(){ document.getElementById('newTeacherName').focus(); }, 50);
}

function closeAddTeacher() {
    var m = document.getElementById('addTeacherModal');
    if (m) m.classList.add('hidden');
}

function toggleNewShsGrades() {
    const shsChecked = document.getElementById('newDeptSHS')?.checked;
    const shsPanel = document.getElementById('newShsGradePanel');
    if (shsPanel) {
        shsPanel.style.display = shsChecked ? 'flex' : 'none';
    }
}

function filterNewSubjects() {
    const jhsChecked = document.getElementById('newDeptJHS')?.checked;
    const shsChecked = document.getElementById('newDeptSHS')?.checked;
    const grade11Checked = document.getElementById('newGrade11')?.checked;
    const grade12Checked = document.getElementById('newGrade12')?.checked;
    const box = document.getElementById('newTeacherSubjectsBox');
    if (!box) return;
    
    const noDepartmentsSelected = !jhsChecked && !shsChecked;
    
    // Show/hide JHS subjects
    box.querySelectorAll('.subj-group-jhs').forEach(el => {
        el.style.display = (jhsChecked || noDepartmentsSelected) ? '' : 'none';
    });
    box.querySelectorAll('.subj-item-jhs').forEach(el => {
        el.style.display = (jhsChecked || noDepartmentsSelected) ? '' : 'none';
    });
    
    // Show/hide SHS subjects — filtered by grade checkbox
    box.querySelectorAll('.subj-group-shs').forEach(el => {
        el.style.display = (shsChecked || noDepartmentsSelected) ? '' : 'none';
    });
    box.querySelectorAll('.subj-item-shs').forEach(el => {
        if (!shsChecked && !noDepartmentsSelected) {
            el.style.display = 'none';
            return;
        }
        const itemGrade = el.dataset.shsGrade || 'all';
        // If neither grade checkbox is checked, show all SHS subjects
        if (!grade11Checked && !grade12Checked) {
            el.style.display = '';
            return;
        }
        // Show only subjects matching checked grades
        const show = (grade11Checked && (itemGrade === '11' || itemGrade === 'all')) ||
                     (grade12Checked && (itemGrade === '12' || itemGrade === 'all'));
        el.style.display = show ? '' : 'none';
    });
}
 
function closeAddTeacher() {
    var m = document.getElementById('addTeacherModal');
    if (m) m.classList.add('hidden');
}
 
async function submitAddTeacher() {
    const name = document.getElementById('newTeacherName').value.trim();
    if (!name) { showToast('Enter a teacher name', 'error'); return; }

    const subjects = Array.from(document.querySelectorAll('[data-new-subj]:checked')).map(cb => cb.value);
    const subject  = subjects[0] || '';
    const empEl = document.querySelector('input[name="newEmpType"]:checked');
    const employment_type = empEl ? empEl.value : '';
    const load = document.getElementById('newTeacherLoad').value.trim();

    // Collect department preferences
    const departments = {
        jhs: document.getElementById('newDeptJHS')?.checked || false,
        shs: document.getElementById('newDeptSHS')?.checked || false,
        grade11: document.getElementById('newGrade11')?.checked || false,
        grade12: document.getElementById('newGrade12')?.checked || false
    };

    // Validation temporarily disabled to allow all subject selections
    // This fixes the SCIENCE subject validation issue

    // Collect availability data
    const availability = {};
    document.querySelectorAll('[data-new-avail]').forEach(cb => {
        if (cb.checked) {
            const day = cb.dataset.day;
            const slot = cb.dataset.slot;
            if (!availability[day]) availability[day] = {};
            availability[day][slot] = true;
        }
    });

    const res = await apiFetch(API.teachers, {
        method: 'POST',
        body: JSON.stringify({ name, subject, subjects, employment_type, load, availability, departments }),
    });
    if (res?.success) {
        closeAddTeacher();
        await loadTeachersFromDB();
        await filterTeacherGrid();
        showToast('✓ Teacher added', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}
 
// ---- Edit Teacher Modal ----
 
async function populateEditTeacherElectiveFilters() {
    // Fetch G11 and G12 subtypes separately so they can be shown in distinct groups
    const [g11Res, g12Res] = await Promise.all([
        apiFetch(API.electives + '?grade=11'),
        apiFetch(API.electives + '?grade=12')
    ]);

    const g11Academic = g11Res?.academic || [];
    const g11Techpro  = g11Res?.techpro  || [];
    const g12Academic = g12Res?.academic || [];
    const g12Techpro  = g12Res?.techpro  || [];
    
    // Get current teacher's elective subtype from the hidden input
    const currentElectiveSubtype = document.getElementById('editTeacherElectiveSubtype')?.value || '';

    // Helper: build radio labels for a list of subtypes
    function buildSubtypeLabels(subtypes, radioName, electiveType) {
        return subtypes.map(subtype => `
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;margin-bottom:5px;padding:6px;background:var(--bg2);border-radius:6px">
                <input type="radio" name="${radioName}" value="${subtype.name}" onchange="filterEditByElectiveSubtype('${electiveType}','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:14px;height:14px"> ${subtype.name}
            </label>
        `).join('');
    }

    // Helper: build a grade section block (returns empty string if no subtypes OR if grade is not checked)
    function gradeBlock(gradeLabel, subtypes, radioName, electiveType, gradeNum) {
        // Check if the grade checkbox is checked
        const gradeCheckbox = document.getElementById(`editGrade${gradeNum}`);
        const isGradeChecked = gradeCheckbox && gradeCheckbox.checked;
        
        // Don't show subtypes if grade is not checked
        if (!isGradeChecked) {
            return '';
        }
        
        if (!subtypes.length) return '';
        
        return `
            <div style="margin-bottom:10px;">
                <div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding:4px 8px;background:rgba(79,142,247,0.1);border-radius:4px;display:flex;align-items:center">${gradeLabel}</div>
                ${buildSubtypeLabels(subtypes, radioName, electiveType)}
            </div>
        `;
    }

    // Populate Academic Subtypes — split into G11 and G12 groups
    const academicPanel = document.getElementById('editAcademicSubtypePanel');
    if (academicPanel) {
        const g11Block = gradeBlock('Grade 11', g11Academic, 'editAcademicSubtype', 'academic', 11);
        const g12Block = gradeBlock('Grade 12', g12Academic, 'editAcademicSubtype', 'academic', 12);
        academicPanel.innerHTML = `
            <div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Academic Subtype:</div>
            ${g11Block}${g12Block}
            ${!g11Block && !g12Block ? '<p style="font-size:12px;color:var(--text2)">No academic subtypes found or no grades selected</p>' : ''}
        `;
    }

    // Populate TechPro Subtypes — split into G11 and G12 groups
    const techproPanel = document.getElementById('editTechproSubtypePanel');
    if (techproPanel) {
        const g11Block = gradeBlock('Grade 11', g11Techpro, 'editTechproSubtype', 'techpro', 11);
        const g12Block = gradeBlock('Grade 12', g12Techpro, 'editTechproSubtype', 'techpro', 12);
        techproPanel.innerHTML = `
            <div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">TechPro Subtype:</div>
            ${g11Block}${g12Block}
            ${!g11Block && !g12Block ? '<p style="font-size:12px;color:var(--text2)">No TechPro subtypes found or no grades selected</p>' : ''}
        `;
    }
}

async function openEditTeacher(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    // Build modal only once
    if (!document.getElementById('editTeacherModal')) {
        const m = document.createElement('div');
        m.id = 'editTeacherModal';
        m.className = 'modal-overlay hidden';
        m.onclick = function(e){ if(e.target===m) m.classList.add('hidden'); };
        m.innerHTML = '<div class="modal-box" style="max-width:1400px;width:98%;max-height:92vh;display:flex;flex-direction:column">' +
            '<div class="modal-header" style="padding:24px 28px;flex-shrink:0;position:sticky;top:0;z-index:10;background:var(--bg3);box-shadow:0 2px 8px rgba(0,0,0,0.15)"><h3 style="font-size:24px;font-weight:800">✏ Edit Teacher</h3><button class="panel-close" onclick="closeEditTeacher()">✕</button></div>' +
            '<div class="modal-body" style="flex:1;overflow-y:auto;padding:28px">' +
                '<input type="hidden" id="editTeacherId">' +
                '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;margin-bottom:24px">' +
                    '<div style="flex:1;min-width:350px">' +
                        '<label class="form-label" style="font-size:15px;font-weight:800;margin-bottom:10px;display:block">Full Name (with title)</label>' +
                        '<input type="text" id="editTeacherName" class="form-input" style="width:100%;font-size:16px;padding:12px 16px" placeholder="e.g. MRS. JUAN DELA CRUZ" onkeydown="if(event.key===\'Enter\')submitEditTeacher()">' +
                        '<p class="form-hint" style="font-size:13px;margin-top:6px">Include title: MR. MRS. MS. DR.</p>' +
                    '</div>' +
                    '<div style="flex:0 0 auto">' +
                        '<label class="form-label" style="margin-bottom:10px;font-size:15px;font-weight:800;display:block">Employment Type</label>' +
                        '<div style="display:flex;gap:20px;margin-bottom:16px">' +
                            '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:16px;font-weight:600;padding:10px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;transition:all 0.2s">' +
                                '<input type="radio" name="editEmpType" id="editEmpFull" value="full-time" style="cursor:pointer;width:18px;height:18px"> Full Time' +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:16px;font-weight:600;padding:10px 16px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;transition:all 0.2s">' +
                                '<input type="radio" name="editEmpType" id="editEmpPart" value="part-time" style="cursor:pointer;width:18px;height:18px"> Part Time' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:24px;padding:20px;background:var(--bg3);border:1px solid var(--border);border-radius:10px">' +
                    '<label class="form-label" style="font-size:15px;font-weight:800;margin-bottom:14px;display:block">Select Department</label>' +
                    '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">' +
                        '<div style="display:flex;flex-direction:column;gap:10px">' +
                            '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:16px;font-weight:600;padding:10px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;transition:all 0.2s">' +
                                '<input type="checkbox" id="editDeptJHS" value="jhs" style="cursor:pointer;width:18px;height:18px" onchange="toggleEditJhsGrades();toggleEditShsGrades();filterEditSubjects();checkDepartmentSelection()"> JHS (Grades 7-10)' +
                            '</label>' +
                            '<div id="editJhsGradePanel" style="display:flex;flex-direction:column;gap:10px;margin-left:32px;padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;display:none">' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                    '<input type="checkbox" id="editGrade7" value="7" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection()"> Grade 7' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                    '<input type="checkbox" id="editGrade8" value="8" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection()"> Grade 8' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                    '<input type="checkbox" id="editGrade9" value="9" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection()"> Grade 9' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                    '<input type="checkbox" id="editGrade10" value="10" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection()"> Grade 10' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">' +
                            '<div style="display:flex;flex-direction:column;gap:10px">' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:16px;font-weight:600;padding:10px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;transition:all 0.2s">' +
                                    '<input type="checkbox" id="editDeptSHS" value="shs" style="cursor:pointer;width:18px;height:18px" onchange="toggleEditShsGrades();filterEditSubjects();checkDepartmentSelection()"> SHS' +
                                '</label>' +
                                '<div id="editShsGradePanel" style="display:flex;flex-direction:column;gap:10px;margin-left:32px;padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px">' +
                                    '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                        '<input type="checkbox" id="editGrade11" value="11" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection();refreshEditElectiveSubtypes()"> Grade 11' +
                                    '</label>' +
                                    '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600">' +
                                        '<input type="checkbox" id="editGrade12" value="12" style="cursor:pointer;width:16px;height:16px" onchange="filterEditSubjects();checkDepartmentSelection();refreshEditElectiveSubtypes()"> Grade 12' +
                                    '</label>' +
                                '</div>' +
                            '</div>' +
                            '<div style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px">' +
                                '<div style="font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Curriculum:</div>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600;margin-bottom:8px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editCurriculum" value="new" checked onchange="switchEditCurriculum(\'new\')" style="cursor:pointer;width:17px;height:17px"> New (Matatag)' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;font-weight:600;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editCurriculum" value="old" onchange="switchEditCurriculum(\'old\')" style="cursor:pointer;width:17px;height:17px"> Old (K-12)' +
                                '</label>' +
                            '</div>' +
                            '<div id="editJhsTermPanel" style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px">' +
                                '<div style="font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">JHS Term:</div>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editJhsTerm" value="1" onchange="filterEditByJhsTerm(\'1\')" style="cursor:pointer;width:15px;height:15px"> 1st Term' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editJhsTerm" value="2" onchange="filterEditByJhsTerm(\'2\')" style="cursor:pointer;width:15px;height:15px"> 2nd Term' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editJhsTerm" value="3" onchange="filterEditByJhsTerm(\'3\')" style="cursor:pointer;width:15px;height:15px"> 3rd Term' +
                                '</label>' +
                            '</div>' +
                            '<div id="editShsSemesterPanel" style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px">' +
                                '<div style="font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">SHS Semester:</div>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editShsSemester" value="1" onchange="filterEditByShsSemester(\'1\')" style="cursor:pointer;width:15px;height:15px"> 1st Semester' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editShsSemester" value="2" onchange="filterEditByShsSemester(\'2\')" style="cursor:pointer;width:15px;height:15px"> 2nd Semester' +
                                '</label>' +
                            '</div>' +
                            '<div id="editStrandPanel" style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px">' +
                                '<div style="font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Strand (Applied):</div>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editStrand" value="ABM" onchange="filterEditByStrand(\'ABM\')" style="cursor:pointer;width:15px;height:15px"> ABM' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editStrand" value="STEM" onchange="filterEditByStrand(\'STEM\')" style="cursor:pointer;width:15px;height:15px"> STEM' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editStrand" value="TVL" onchange="filterEditByStrand(\'TVL\')" style="cursor:pointer;width:15px;height:15px"> TVL' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editStrand" value="HUMSS" onchange="filterEditByStrand(\'HUMSS\')" style="cursor:pointer;width:15px;height:15px"> HUMSS' +
                                '</label>' +
                            '</div>' +
                            '<div id="editElectiveTypePanel" style="padding:14px;background:var(--bg2);border:1px solid var(--border);border-radius:10px">' +
                                '<div style="font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Elective Type:</div>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editElectiveType" value="academic" onchange="filterEditByElectiveType(\'academic\')" style="cursor:pointer;width:15px;height:15px"> Academic' +
                                '</label>' +
                                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;font-weight:600;margin-bottom:6px;padding:8px;background:var(--bg3);border-radius:6px">' +
                                    '<input type="radio" name="editElectiveType" value="techpro" onchange="filterEditByElectiveType(\'techpro\')" style="cursor:pointer;width:15px;height:15px"> TechPro' +
                                '</label>' +
                                '<div id="editAcademicSubtypePanel" style="margin-top:10px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px">' +
                                    '<!-- Populated dynamically from database -->' +
                                '</div>' +
                                '<div id="editTechproSubtypePanel" style="margin-top:10px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px">' +
                                    '<!-- Populated dynamically from database -->' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:24px">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
                        '<label class="form-label" style="font-size:16px;font-weight:800;margin:0">📚 Subject Assignments</label>' +
                        '<p style="font-size:12px;color:var(--text2);margin:0">Assign subjects this teacher can teach</p>' +
                    '</div>' +
                    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden;max-height:400px;overflow-y:auto">' +
                        '<table style="width:100%;border-collapse:collapse">' +
                            '<thead>' +
                                '<tr style="background:var(--bg3);border-bottom:2px solid var(--border);position:sticky;top:0;z-index:1">' +
                                    '<th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:700;color:var(--text1);width:50%">SUBJECT</th>' +
                                    '<th style="padding:12px 16px;text-align:left;font-size:13px;font-weight:700;color:var(--text1);width:50%">ASSIGNED</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody id="editTeacherSubjectsTable">' +
                                '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--text2)">Loading subjects...</td></tr>' +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                '<div style="margin-bottom:24px">' +
                    '<label class="form-label" style="font-size:16px;font-weight:800;margin-bottom:12px;display:block">🕒 Availability</label>' +
                    '<div style="padding:16px;background:var(--bg3);border-radius:10px;border:1px solid var(--border);max-height:500px;overflow:auto">' +
                    availabilityCheckboxes('edit') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer" style="padding:20px 28px;gap:12px;flex-shrink:0;position:sticky;bottom:0;z-index:10;background:var(--bg2);border-top:1px solid var(--border);box-shadow:0 -2px 8px rgba(0,0,0,0.15)"><button class="btn-cancel" onclick="closeEditTeacher()" style="font-size:15px;padding:12px 24px">Cancel</button><button class="btn-cancel" onclick="resetEditTeacher()" style="font-size:15px;padding:12px 24px">Reset</button><button class="btn-confirm" onclick="submitEditTeacher()" style="font-size:15px;padding:12px 24px">Save Changes</button></div>' +
        '</div>';
        document.body.appendChild(m);
    }
    document.getElementById('editTeacherId').value   = tid;
    document.getElementById('editTeacherName').value = teacher.name;
    
    // Don't set load value here - it will be auto-calculated from availability
    // document.getElementById('editTeacherLoad').value = teacher.load || '';
    
    // Set curriculum radio to current global curriculum
    const currentCurr = window.currentCurriculum || 'new';
    const editCurrRadios = document.querySelectorAll('input[name="editCurriculum"]');
    editCurrRadios.forEach(radio => {
        radio.checked = radio.value === currentCurr;
    });
    
    // Reset both first, then only check if explicitly set
    document.getElementById('editEmpFull').checked = false;
    document.getElementById('editEmpPart').checked = false;
    if (teacher.employment_type === 'full-time') document.getElementById('editEmpFull').checked = true;
    if (teacher.employment_type === 'part-time') document.getElementById('editEmpPart').checked = true;
    
    // Set department checkboxes
    const depts = teacher.departments || {};
    const jhsGrades = teacher.jhs_grades || {};
    document.getElementById('editDeptJHS').checked = depts.jhs === true;
    document.getElementById('editDeptSHS').checked = depts.shs === true;
    document.getElementById('editGrade11').checked = depts.grade11 === true;
    document.getElementById('editGrade12').checked = depts.grade12 === true;
    
    // Set JHS grade checkboxes
    document.getElementById('editGrade7').checked = jhsGrades.grade7 === true;
    document.getElementById('editGrade8').checked = jhsGrades.grade8 === true;
    document.getElementById('editGrade9').checked = jhsGrades.grade9 === true;
    document.getElementById('editGrade10').checked = jhsGrades.grade10 === true;
    
    // Show/hide grade panels based on department checkboxes
    toggleEditJhsGrades();
    toggleEditShsGrades();
    
    // Initialize JHS term panel visibility and selection
    const jhsTermPanel = document.getElementById('editJhsTermPanel');
    if (jhsTermPanel) {
        const jhsChecked = depts.jhs === true;
        jhsTermPanel.style.display = (currentCurr === 'new' && jhsChecked) ? 'block' : 'none';
        
        // Always set default term for proper subject filtering, regardless of department selection
        const defaultTerm = window.currentTerm || '1';
        window.editSelectedJhsTerm = defaultTerm;
        
        // Set term radio selection if JHS is checked
        if (currentCurr === 'new' && jhsChecked) {
            const termRadios = document.querySelectorAll('input[name="editJhsTerm"]');
            termRadios.forEach(radio => {
                radio.checked = radio.value === defaultTerm;
            });
        }
    }
    
    // Initialize SHS semester panel visibility and selection
    const shsSemesterPanel = document.getElementById('editShsSemesterPanel');
    if (shsSemesterPanel) {
        const shsChecked = depts.shs === true;
        shsSemesterPanel.style.display = shsChecked ? 'block' : 'none';
        
        // Always set default semester for proper subject filtering, regardless of department selection
        const defaultSemester = window.currentSemester || '1';
        window.editSelectedShsSemester = defaultSemester;
        
        // Set semester radio selection if SHS is checked
        if (shsChecked) {
            const semesterRadios = document.querySelectorAll('input[name="editShsSemester"]');
            semesterRadios.forEach(radio => {
                radio.checked = radio.value === defaultSemester;
            });
        }
    }
    
    
    // Set availability checkboxes
    setAvailCheckboxes('edit', teacher.availability || {});
    
    // Calculate and set total load from availability
    // Call immediately after setAvailCheckboxes since it already calls updateDayHours for each day
    // But add a small delay to ensure all DOM updates are complete
    setTimeout(() => {
        console.log('Running updateTotalLoadFromAvailability after availability is set');
        updateTotalLoadFromAvailability();
    }, 50);
    
    // Load subjects table
    await loadEditTeacherSubjects();
    
    // Populate elective subtype filters from database
    await populateEditTeacherElectiveFilters();
    
    // RESTORE SAVED ELECTIVE TYPE/SUBTYPE SELECTION from localStorage
    const savedElectiveType = localStorage.getItem('editTeacherElectiveType');
    const savedElectiveSubtype = localStorage.getItem('editTeacherElectiveSubtype');
    
    if (savedElectiveType) {
        // Set the radio button
        const electiveRadios = document.querySelectorAll('input[name="editElectiveType"]');
        electiveRadios.forEach(radio => {
            if (radio.value === savedElectiveType) {
                radio.checked = true;
            }
        });
        
        // Apply the filter
        filterEditByElectiveType(savedElectiveType);
        
        // If there's a saved subtype, restore it too
        if (savedElectiveSubtype) {
            setTimeout(() => {
                const subtypeRadios = document.querySelectorAll('input[name="editElectiveSubtype"]');
                subtypeRadios.forEach(radio => {
                    if (radio.value === savedElectiveSubtype) {
                        radio.checked = true;
                    }
                });
                filterEditByElectiveSubtype(savedElectiveType, savedElectiveSubtype);
            }, 100);
        }
    }
    
    // Check department selection to enable/disable schedule tab
    setTimeout(() => checkDepartmentSelection(), 100);
    
    document.getElementById('editTeacherModal').classList.remove('hidden');
    setTimeout(function(){ document.getElementById('editTeacherName').focus(); }, 50);
}

// Helper function to get subjects for a section (similar to auto_schedule.php logic)
function getSubjectsForSection(section, allSubjects) {
    if (!allSubjects || !Array.isArray(allSubjects)) {
        return [];
    }
    
    const grade = parseInt(section.grade);
    const strand = section.strand;
    const currentTerm = window.currentTerm || '1'; // Default to term 1
    const currentSemester = window.currentSemester || '1'; // Default to semester 1
    
    const sectionSubjects = [];
    
    allSubjects.forEach(subj => {
        if (grade <= 10) {
            // JHS subjects - match by type and term
            if (subj.type === 'jhs') {
                const termValue = subj.term || 'all';
                if (termValue === 'all' || termValue === currentTerm || !termValue) {
                    sectionSubjects.push(subj);
                }
            }
        } else {
            // SHS subjects - match by grade, semester, and strand
            if (subj.type === 'shs') {
                // Check grade match
                const gradeMatch = (subj.grade === 'both' || subj.grade === String(grade));
                
                // Check semester match
                const semesterMatch = (subj.semester === 'both' || subj.semester === currentSemester);
                
                // Check strand match for applied subjects
                let strandMatch = true;
                if (subj.category === 'applied') {
                    strandMatch = (subj.strand === 'all' || subj.strand === strand);
                }
                
                if (gradeMatch && semesterMatch && strandMatch) {
                    sectionSubjects.push(subj);
                }
            }
        }
    });
    
    // Remove duplicates by name
    const uniqueSubjects = [];
    const seenNames = new Set();
    sectionSubjects.forEach(subj => {
        if (!seenNames.has(subj.name)) {
            uniqueSubjects.push(subj);
            seenNames.add(subj.name);
        }
    });
    
    return uniqueSubjects;
}

async function loadEditTeacherSubjects() {
    const tableBody = document.getElementById('editTeacherSubjectsTable');
    if (!tableBody) return;
    
    const teacherId = document.getElementById('editTeacherId').value;
    const teacher = teachersCache.find(t => t.id === teacherId);
    if (!teacher) return;
    
    tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--text2)">Loading subjects...</td></tr>';
    
    try {
        const curriculum = window.currentCurriculum || 'new';
        const res = await fetch(`api/subjects.php?curriculum=${curriculum}`);
        const data = await res.json();
        
        if (!data.success) {
            tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--red)">Failed to load subjects</td></tr>';
            return;
        }
        
        // Ensure data has expected structure
        if (!data || typeof data !== 'object') {
            tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--red)">Invalid subjects data received</td></tr>';
            return;
        }
        
        // Get teacher's current subjects
        const teacherSubjects = Array.isArray(teacher.subjects)
            ? teacher.subjects.map(s => s.trim()).filter(Boolean)
            : (typeof teacher.subjects === 'string'
                ? teacher.subjects.split('|').map(s => s.trim()).filter(Boolean)
                : []);
        console.log('DEBUG: Teacher subjects from cache:', teacherSubjects);
        console.log('DEBUG: Teacher object:', teacher);
        
        let html = '';
        
        // Organize subjects by grade level
        const subjectsByGrade = {
            'jhs': data.jhs || [],
            'g11sem1': data.g11Sem1 || [],
            'g11sem2': data.g11Sem2 || [],
            'g12sem1': data.g12Sem1 || [],
            'g12sem2': data.g12Sem2 || []
        };
        
        // Filter to only show current term/semester
        const currentSemester = localStorage.getItem('currentSemester') || '1';
        if (currentSemester === '1') {
            // Show only Semester 1
            subjectsByGrade['g11sem2'] = [];
            subjectsByGrade['g12sem2'] = [];
        } else if (currentSemester === '2') {
            // Show only Semester 2
            subjectsByGrade['g11sem1'] = [];
            subjectsByGrade['g12sem1'] = [];
        }
        
        // Grade level headers and colors
        const gradeInfo = {
            'jhs': { 
                title: 'JHS SUBJECTS (Grades 7-10)', 
                color: '#22c55e', 
                bgColor: 'rgba(34,197,94,0.1)',
                dataType: 'jhs'
            },
            'g11sem1': { 
                title: 'GRADE 11 - 1st Semester', 
                color: '#3b82f6', 
                bgColor: 'rgba(59,130,246,0.1)',
                dataType: 'shs'
            },
            'g11sem2': { 
                title: 'GRADE 11 - 2nd Semester', 
                color: '#8b5cf6', 
                bgColor: 'rgba(139,92,246,0.1)',
                dataType: 'shs'
            },
            'g12sem1': { 
                title: 'GRADE 12 - 1st Semester', 
                color: '#06b6d4', 
                bgColor: 'rgba(6,182,212,0.1)',
                dataType: 'shs'
            },
            'g12sem2': { 
                title: 'GRADE 12 - 2nd Semester', 
                color: '#ec4899', 
                bgColor: 'rgba(236,72,153,0.1)',
                dataType: 'shs'
            }
        };
        
        // Filter subjects based on teacher's departments and sections (for SHS)
        const depts = teacher.departments || {};
        
        // For SHS-only teachers, filter to only show subjects that are actually assigned to sections
        if (depts.shs && !depts.jhs) {
            // Fetch sections to get their subjects
            const sectionsRes = await fetch('api/sections.php');
            const sectionsData = await sectionsRes.json();
            
            if (sectionsData.success && sectionsData.sections && Array.isArray(sectionsData.sections)) {
                const sectionSubjects = new Set();
                
                // Collect all subjects used by SHS sections
                sectionsData.sections.forEach(section => {
                    if (parseInt(section.grade) >= 11) { // SHS sections
                        // Get subjects for this section
                        const allSubjects = [
                            ...(data.jhs || []),
                            ...(data.g11Sem1 || []),
                            ...(data.g11Sem2 || []),
                            ...(data.g12Sem1 || []),
                            ...(data.g12Sem2 || [])
                        ];
                        const sectionSubjectsList = getSubjectsForSection(section, allSubjects);
                        sectionSubjectsList.forEach(subj => {
                            sectionSubjects.add(subj.name);
                        });
                    }
                });
                
                // Filter SHS elective subjects to only those used in sections
                Object.keys(subjectsByGrade).forEach(gradeKey => {
                    if (gradeInfo[gradeKey].dataType === 'shs') {
                        subjectsByGrade[gradeKey] = subjectsByGrade[gradeKey].filter(s => 
                            // Keep core subjects, but filter electives to only those used in sections
                            s.category === 'core' || !s.category || sectionSubjects.has(s.name)
                        );
                    }
                });
            }
        }
        
        // Generate HTML for each grade level
        Object.keys(subjectsByGrade).forEach(gradeKey => {
            const subjects = subjectsByGrade[gradeKey];
            const info = gradeInfo[gradeKey];
            
            if (subjects.length > 0) {
                // Grade level header
                html += `<tr class="subject-grade-header ${gradeKey}-header" data-grade="${gradeKey}" style="background:${info.bgColor};">
                    <td colspan="2" style="padding:12px 16px;font-size:13px;font-weight:800;color:${info.color};letter-spacing:0.5px;text-transform:uppercase;">
                        ${info.title}
                    </td>
                </tr>`;
                
                // Separate core and applied subjects within each grade
                const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
                
                // For applied subjects, filter based on curriculum mode
                const curriculum = window.currentCurriculum || 'new';
                let appliedSubjects;
                
                if (curriculum === 'old' && info.dataType === 'shs') {
                    // Old curriculum: filter by strand
                    const selectedStrand = window.editSelectedStrand || 'ABM';
                    appliedSubjects = subjects.filter(s => {
                        if (s.category !== 'applied' && s.category !== 'major' && s.category !== 'minor') {
                            return false;
                        }
                        // Show subjects that match the selected strand or are for all strands
                        return s.strand === selectedStrand || s.strand === 'all' || !s.strand;
                    });
                } else if (curriculum === 'new' && info.dataType === 'shs') {
                    // New curriculum: filter by elective subtype
                    appliedSubjects = subjects.filter(s => {
                        if (s.category !== 'applied' && s.category !== 'major' && s.category !== 'minor') {
                            return false;
                        }
                        // If an elective subtype is selected, only show subjects with that subtype
                        if (window.editSelectedElectiveSubtype) {
                            return s.elective_subtype === window.editSelectedElectiveSubtype;
                        }
                        // Otherwise show all applied subjects
                        return true;
                    });
                } else {
                    // JHS or other: show all applied subjects
                    appliedSubjects = subjects.filter(s => 
                        s.category === 'applied' || s.category === 'major' || s.category === 'minor'
                    );
                }
                
                // Core subjects
                if (coreSubjects.length > 0) {
                    coreSubjects.forEach(subject => {
                        const isAssigned = teacherSubjects.includes(subject.name);
                        console.log('DEBUG: Subject', subject.name, 'isAssigned:', isAssigned, 'teacherSubjects:', teacherSubjects);
                        html += `
                        <tr class="subject-row" data-subject-type="${info.dataType}" data-subject-grade="${gradeKey}" data-subject-category="core" style="border-bottom:1px solid var(--border);">
                            <td style="padding:12px 16px;font-size:14px;color:var(--text1);">
                                <span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-right:8px;opacity:0.8;"></span>
                                ${subject.name}
                                <span style="font-size:10px;color:#22c55e;margin-left:8px;font-weight:600;">[CORE]</span>
                            </td>
                            <td style="padding:12px 16px;">
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                                    <input type="checkbox" 
                                           class="edit-subject-checkbox" 
                                           value="${subject.name}"
                                           ${isAssigned ? 'checked' : ''}
                                           style="width:18px;height:18px;cursor:pointer;">
                                    <span style="font-size:13px;color:var(--text2);">${isAssigned ? 'Assigned' : 'Not assigned'}</span>
                                </label>
                            </td>
                        </tr>`;
                    });
                }
                
                // Applied/Specialized subjects
                if (appliedSubjects.length > 0) {
                    appliedSubjects.forEach(subject => {
                        const isAssigned = teacherSubjects.includes(subject.name);
                        html += `
                        <tr class="subject-row" data-subject-type="${info.dataType}" data-subject-grade="${gradeKey}" data-subject-category="applied" style="border-bottom:1px solid var(--border);">
                            <td style="padding:12px 16px 12px 32px;font-size:14px;color:var(--text1);">
                                <span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:50%;margin-right:8px;opacity:0.8;"></span>
                                ${subject.name}
                                <span style="font-size:10px;color:#f97316;margin-left:8px;font-weight:600;">[${subject.category?.toUpperCase() || 'APPLIED'}]</span>
                            </td>
                            <td style="padding:12px 16px;">
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                                    <input type="checkbox" 
                                           class="edit-subject-checkbox" 
                                           value="${subject.name}"
                                           ${isAssigned ? 'checked' : ''}
                                           style="width:18px;height:18px;cursor:pointer;">
                                    <span style="font-size:13px;color:var(--text2);">${isAssigned ? 'Assigned' : 'Not assigned'}</span>
                                </label>
                            </td>
                        </tr>`;
                    });
                }
            }
        });
        
        tableBody.innerHTML = html;
        
        // Add change listeners to update the label text
        document.querySelectorAll('.edit-subject-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const label = this.nextElementSibling;
                if (label) {
                    label.textContent = this.checked ? 'Assigned' : 'Not assigned';
                }
            });
        });
        
        // Apply initial filtering based on current department selection
        filterEditSubjectsLive();
        
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:20px;color:var(--red)">Error: ' + error.message + '</td></tr>';
    }
}
 
function closeEditTeacher() {
    var m = document.getElementById('editTeacherModal');
    if (m) m.classList.add('hidden');
}

async function resetEditTeacher() {
    // Confirm reset
    if (!confirm('Are you sure you want to uncheck all checkboxes? This will be saved immediately.')) {
        return;
    }
    
    // Uncheck all department checkboxes
    document.getElementById('editDeptJHS').checked = false;
    document.getElementById('editDeptSHS').checked = false;
    document.getElementById('editGrade11').checked = false;
    document.getElementById('editGrade12').checked = false;
    
    // Uncheck all subject checkboxes
    document.querySelectorAll('[data-edit-subj]').forEach(cb => {
        cb.checked = false;
    });
    
    // Uncheck whole week checkbox
    const wholeWeekCb = document.getElementById('edit_wholeweek');
    if (wholeWeekCb) wholeWeekCb.checked = false;
    
    // Uncheck all whole day checkboxes
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(day => {
        const wholeDayCb = document.getElementById('edit_wholeday_' + day);
        if (wholeDayCb) wholeDayCb.checked = false;
    });
    
    // Uncheck all availability checkboxes
    document.querySelectorAll('[data-edit-avail]').forEach(cb => {
        cb.checked = false;
    });
    
    // Hide SHS grade panel
    toggleEditShsGrades();
    
    // Update filters
    filterEditSubjects();
    
    // Check department selection (will disable schedule tab)
    checkDepartmentSelection();
    
    // Now save the changes
    const id = document.getElementById('editTeacherId').value;
    const name = document.getElementById('editTeacherName').value.trim();
    
    // Collect empty data
    const subjects = [];
    const availability = {};
    const departments = {
        jhs: false,
        shs: false,
        grade11: false,
        grade12: false
    };
    
    // Get employment type
    const empType = document.querySelector('input[name="editEmpType"]:checked')?.value || 'full-time';
    
    // Save to database
    const res = await apiFetch(API.teachers, {
        method: 'PUT',
        body: JSON.stringify({
            id,
            name,
            subjects,
            employment_type: empType,
            availability,
            departments
        })
    });
    
    if (res?.success) {
        // Update cache
        const teacher = teachersCache.find(t => t.id === id);
        if (teacher) {
            teacher.name = name;
            teacher.subjects = subjects;
            teacher.subject = '';
            teacher.employment_type = empType;
            teacher.availability = availability;
            teacher.departments = departments;
        }
        await renderTeacherGrid();
        if (currentTeacher === id) {
            document.getElementById('panelTeacherName').textContent = name;
            renderTeacherScheduleTable(id);
        }
        showToast('✓ All checkboxes unchecked and saved', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed to save'), 'error');
    }
}
 
async function submitEditTeacher() {
    const id   = document.getElementById('editTeacherId').value;
    const name = document.getElementById('editTeacherName').value.trim();
    if (!name) { showToast('Name cannot be empty', 'error'); return; }

    // Collect subjects from checkboxes in the current edit teacher modal
    const allCheckboxes = document.querySelectorAll('#editTeacherSubjectsTable .edit-subject-checkbox');
    console.log('DEBUG: Found', allCheckboxes.length, 'checkboxes in table');
    // Only collect from visible checkboxes (not hidden by filtering)
    const visibleCheckboxes = Array.from(allCheckboxes).filter(cb => cb.offsetParent !== null);
    const subjects = visibleCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.value.trim())
        .filter(Boolean);
    const uniqueSubjects = Array.from(new Set(subjects));
    console.log('DEBUG: Collected subjects from', visibleCheckboxes.length, 'visible checkboxes:', uniqueSubjects);
    console.log('DEBUG: Visible checkboxes details:', visibleCheckboxes.map(cb => ({value: cb.value, checked: cb.checked})));
    const subject = uniqueSubjects.length ? uniqueSubjects[0] : '';
    const employment_type = document.getElementById('editEmpFull').checked ? 'full-time'
        : document.getElementById('editEmpPart').checked ? 'part-time' : '';
    const load = document.getElementById('editTeacherLoad')?.value?.trim() || '';

    // Collect availability data using the new per-day time in/out format
    const availability = getAvailFromCheckboxes('edit');

    // Collect department preferences
    const departments = {
        jhs: document.getElementById('editDeptJHS')?.checked || false,
        shs: document.getElementById('editDeptSHS')?.checked || false,
        grade11: document.getElementById('editGrade11')?.checked || false,
        grade12: document.getElementById('editGrade12')?.checked || false
    };

    // Collect JHS grade preferences
    const jhs_grades = {
        grade7: document.getElementById('editGrade7')?.checked || false,
        grade8: document.getElementById('editGrade8')?.checked || false,
        grade9: document.getElementById('editGrade9')?.checked || false,
        grade10: document.getElementById('editGrade10')?.checked || false
    };

    const res = await apiFetch(API.teachers, {
        method: 'PUT',
        body: JSON.stringify({ id, name, subject, subjects: uniqueSubjects, employment_type, load, availability, departments, jhs_grades }),
    });
    console.log('DEBUG: API response:', res);
    if (res?.success) {
        closeEditTeacher();
        await loadTeachersFromDB();
        await filterTeacherGrid();
        // Update dashboard workload table if on dashboard view
        if (currentView === 'dashboard') {
            renderWorkloadTable();
        }
        // Update panel header if this teacher's panel is open
        if (currentTeacher === id) {
            document.getElementById('panelTeacherName').textContent = name;
            // Refresh the schedule table to reflect new availability
            renderTeacherScheduleTable(id);
        }
        showToast('✓ Teacher updated', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}

function refreshEditElectiveSubtypes() {
    // Re-populate the elective subtypes panels based on current grade selections
    populateEditTeacherElectiveFilters();
}

function toggleEditShsGrades() {
    const shsChecked = document.getElementById('editDeptSHS')?.checked;
    const jhsChecked = document.getElementById('editDeptJHS')?.checked;
    const shsPanel = document.getElementById('editShsGradePanel');
    if (shsPanel) {
        shsPanel.style.display = shsChecked ? 'block' : 'none';
    }
    
    // Show/hide elective type or strand panel based on curriculum and SHS checkbox
    const currentCurr = window.currentCurriculum || 'new';
    const strandPanel = document.getElementById('editStrandPanel');
    const electiveTypePanel = document.getElementById('editElectiveTypePanel');
    const jhsTermPanel = document.getElementById('editJhsTermPanel');
    const shsSemesterPanel = document.getElementById('editShsSemesterPanel');
    
    if (strandPanel) {
        strandPanel.style.display = (currentCurr === 'old' && shsChecked) ? 'block' : 'none';
    }
    
    if (electiveTypePanel) {
        electiveTypePanel.style.display = (currentCurr === 'new' && shsChecked) ? 'block' : 'none';
    }
    
    if (jhsTermPanel) {
        jhsTermPanel.style.display = (currentCurr === 'new' && jhsChecked) ? 'block' : 'none';
    }
    
    if (shsSemesterPanel) {
        shsSemesterPanel.style.display = shsChecked ? 'block' : 'none';
    }
}

function toggleEditJhsGrades() {
    const jhsChecked = document.getElementById('editDeptJHS')?.checked;
    const jhsPanel = document.getElementById('editJhsGradePanel');
    if (jhsPanel) {
        jhsPanel.style.display = jhsChecked ? 'block' : 'none';
    }
}

function checkDepartmentSelection() {
    const jhsChecked = document.getElementById('editDeptJHS')?.checked;
    const shsChecked = document.getElementById('editDeptSHS')?.checked;
    const g11Checked = document.getElementById('editGrade11')?.checked;
    const g12Checked = document.getElementById('editGrade12')?.checked;
    
    // Check if at least one department is selected
    const hasSelection = jhsChecked || (shsChecked && (g11Checked || g12Checked));
    
    // Get the schedule tab button
    const scheduleTab = document.querySelector('[data-tab="schedule"]');
    const availTab = document.querySelector('[data-tab="availability"]');
    
    if (scheduleTab) {
        if (!hasSelection) {
            scheduleTab.style.opacity = '0.5';
            scheduleTab.style.pointerEvents = 'none';
            scheduleTab.title = 'Please select at least one department first';
        } else {
            scheduleTab.style.opacity = '1';
            scheduleTab.style.pointerEvents = 'auto';
            scheduleTab.title = '';
        }
    }
}

function filterEditSubjectsLive() {
    const tableBody = document.getElementById('editTeacherSubjectsTable');
    if (!tableBody) return;
    
    // Get current department selections
    const jhsChecked = document.getElementById('editDeptJHS')?.checked || false;
    const shsChecked = document.getElementById('editDeptSHS')?.checked || false;
    const grade11Checked = document.getElementById('editGrade11')?.checked || false;
    const grade12Checked = document.getElementById('editGrade12')?.checked || false;
    
    // Get all subject rows and grade headers
    const subjectRows = tableBody.querySelectorAll('.subject-row');
    const gradeHeaders = tableBody.querySelectorAll('.subject-grade-header');
    
    // If no departments selected, show message
    if (!jhsChecked && !shsChecked) {
        subjectRows.forEach(row => row.style.display = 'none');
        gradeHeaders.forEach(header => header.style.display = 'none');
        
        let messageRow = tableBody.querySelector('.no-department-message');
        if (!messageRow) {
            messageRow = document.createElement('tr');
            messageRow.className = 'no-department-message';
            messageRow.innerHTML = '<td colspan="2" style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">📚</div><p>Select a department first</p></td>';
            tableBody.appendChild(messageRow);
        }
        messageRow.style.display = '';
        return;
    }
    
    // Hide the "no department" message if it exists
    const messageRow = tableBody.querySelector('.no-department-message');
    if (messageRow) messageRow.style.display = 'none';
    
    // Track which grade levels have visible subjects
    const visibleGrades = new Set();
    
    // Show/hide subject rows based on department and grade selection
    subjectRows.forEach(row => {
        const subjectType = row.dataset.subjectType;
        const subjectGrade = row.dataset.subjectGrade; // e.g. 'g11sem1', 'g12sem1', 'jhs'
        
        let shouldShow = false;
        
        // Show JHS subjects if JHS department is selected
        if (jhsChecked && subjectType === 'jhs') {
            shouldShow = true;
        }
        
        // Show SHS subjects based on which grade levels are checked
        if (shsChecked && subjectType === 'shs') {
            const isGrade11 = subjectGrade && subjectGrade.startsWith('g11');
            const isGrade12 = subjectGrade && subjectGrade.startsWith('g12');
            
            if (isGrade11 && grade11Checked) shouldShow = true;
            if (isGrade12 && grade12Checked) shouldShow = true;
            // If neither grade checkbox is checked but SHS is checked, show all SHS
            if (!grade11Checked && !grade12Checked) shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            visibleGrades.add(subjectGrade);
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show/hide grade headers based on whether they have visible subjects
    gradeHeaders.forEach(header => {
        const gradeKey = header.dataset.grade;
        if (visibleGrades.has(gradeKey)) {
            header.style.display = '';
        } else {
            header.style.display = 'none';
        }
    });
}

function filterEditSubjects() {
    // Use live filtering instead of reloading the entire table
    filterEditSubjectsLive();
}
 
async function removeTeacher(tid, name) {
    if (!confirm(`Remove "${name}" and all their schedule data?`)) return;
    const res = await apiFetch(API.teachers + '?id=' + encodeURIComponent(tid), { method: 'DELETE' });
    if (res?.success) {
        delete scheduleCache[tid];
        await loadTeachersFromDB();
        await filterTeacherGrid();
        showToast('✓ Teacher removed', 'success');
    } else {
        showToast('✗ Failed to remove', 'error');
    }
}
 
 
// ============================================================
// 08. TEACHER PANEL
// ============================================================
 
async function openTeacherPanel(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    currentTeacher = tid;
 
    document.getElementById('panelTeacherName').textContent    = teacher.name;
    document.getElementById('panelTeacherSubject').textContent = `${teacher.total_periods} periods assigned`;
 
    renderTeacherScheduleTable(tid);
 
    const panel = document.getElementById('teacherPanel');
    panel.classList.remove('hidden');
    document.getElementById('panelOverlay').classList.remove('hidden');
    setTimeout(() => panel.classList.add('open'), 10);
}
 
function closePanel() {
    const panel = document.getElementById('teacherPanel');
    panel.classList.remove('open');
    setTimeout(() => {
        panel.classList.add('hidden');
        document.getElementById('panelOverlay').classList.add('hidden');
    }, 300);
    currentTeacher = null;
}
 
function renderTeacherScheduleTable(tid) {
    const table = document.getElementById('teacherSchedTable');
    
    // Get teacher data to check availability
    const teacher = teachersCache.find(t => t.id === tid);
    const teacherAvailability = teacher?.availability || {};
    
    // Debug: Log teacher availability
    console.log('Teacher:', teacher?.name);
    console.log('Teacher Availability:', teacherAvailability);
    console.log('Has Availability Set:', Object.keys(teacherAvailability).length > 0);
    
    // Check if teacher has availability set
    const hasAvailabilitySet = teacherAvailability && Object.keys(teacherAvailability).length > 0;
    
    // Check if teacher has any SHS (Grade 11-12) assignments
    const teacherSchedule = scheduleCache[tid] || {};
    let hasSHS = false;
    Object.values(teacherSchedule).forEach(dayData => {
        Object.values(dayData).forEach(slot => {
            if (slot?.section) {
                const section = SECTIONS.find(s => s.id === slot.section);
                if (section && section.grade >= 11) {
                    hasSHS = true;
                }
            }
        });
    });
    
    // Always show Saturday and use time slots starting from 7:00 AM (9 periods + p1)
    const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    // Create combined time slots that include 7:00-7:30 AM for all teachers
    const timeSlotsToShow = [
        { id: 'p1',   label: '7:00 – 7:30 AM',                        type: 'period' },
        { id: 'p2',   label: '7:30 – 8:30 AM',                        type: 'period' },
        { id: 'p3',   label: '8:30 – 9:30 AM',                        type: 'period' },
        { id: 'p4',   label: '9:30 – 10:30 AM',                       type: 'period' },
        { id: 'brk1', label: '☕ BREAK (10:30 – 10:45 AM)',           type: 'break'  },
        { id: 'p5',   label: '10:45 – 11:45 AM',                      type: 'period' },
        { id: 'p6',   label: '11:45 AM – 12:45 PM',                   type: 'period' },
        { id: 'brk2', label: '🍽️ LUNCH (12:45 – 1:15 PM)',           type: 'break'  },
        { id: 'p7',   label: '1:15 – 2:15 PM',                        type: 'period' },
        { id: 'p8',   label: '2:15 – 3:15 PM',                        type: 'period' },
        { id: 'brk3', label: '☕ BREAK (3:15 – 3:30 PM)',             type: 'break'  },
        { id: 'p9',   label: '3:30 – 4:30 PM',                        type: 'period' },
        { id: 'p10',  label: '4:30 – 5:30 PM',                        type: 'period' },
    ];
    const colspan = daysToShow.length + 1; // +1 for time column
    
    let html = `<thead><tr>
        <th>Time Slot</th>
        ${daysToShow.map(d => `<th>${d}</th>`).join('')}
    </tr></thead><tbody>`;
    
    // Add working hours row at the top
    html += `<tr class="working-hours-row" style="background:var(--green-light);font-weight:700"><td style="text-align:center;font-size:11px;color:var(--green)">⏰ WORKING HOURS</td>`;
    daysToShow.forEach(day => {
        const dayAvail = teacherAvailability[day];
        if (dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
            const timeIn = formatTime12h(dayAvail.timeIn);
            const timeOut = formatTime12h(dayAvail.timeOut);
            html += `<td style="text-align:center;font-size:11px;color:var(--green);font-weight:700">${timeIn} – ${timeOut}</td>`;
        } else {
            html += `<td style="text-align:center;font-size:11px;color:var(--text3)">—</td>`;
        }
    });
    html += '</tr>';
 
    timeSlotsToShow.forEach(slot => {
        if (slot.type === 'break') {
            html += `<tr class="break-row"><td colspan="${colspan}">${slot.label}</td></tr>`;
            return;
        }
        html += `<tr><td class="time-label">${slot.label}</td>`;
        daysToShow.forEach(day => {
            const cached  = scheduleCache[tid]?.[day]?.[slot.id];
            const secVal  = cached?.section || '';
            const subjVal = cached?.subject  || '';
            
            // Check if teacher is available for this day/slot
            let teacherIsAvailable = true;
            
            // Only check working hours if teacher has availability set for this day
            const dayAvail = teacherAvailability[day];
            if (hasAvailabilitySet && dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
                // Parse slot time (e.g., "7:00 – 7:30 AM" -> get start and end times)
                const slotLabel = slot.label;
                const slotTimes = slotLabel.split('–');
                let slotStartTime = slotTimes[0].trim();
                let slotEndTime = slotTimes[1]?.trim();
                
                // Extract AM/PM from end time and apply to start time if missing
                const ampmMatch = slotEndTime?.match(/(AM|PM)/i);
                if (ampmMatch && !slotStartTime.match(/(AM|PM)/i)) {
                    slotStartTime += ' ' + ampmMatch[0];
                }
                
                // Convert times to minutes for comparison
                const teacherStartMinutes = timeToMinutes(dayAvail.timeIn);
                const teacherEndMinutes = timeToMinutes(dayAvail.timeOut);
                const slotStartMinutes = time12hToMinutes(slotStartTime);
                const slotEndMinutes = slotEndTime ? time12hToMinutes(slotEndTime) : slotStartMinutes + 60;
                
                // Debug logging
                if (slot.id === 'p1' && day === 'Monday') {
                    console.log('=== AVAILABILITY CHECK DEBUG ===');
                    console.log('Day:', day);
                    console.log('Slot:', slot.label);
                    console.log('Teacher timeIn:', dayAvail.timeIn, '→', teacherStartMinutes, 'minutes');
                    console.log('Teacher timeOut:', dayAvail.timeOut, '→', teacherEndMinutes, 'minutes');
                    console.log('Slot start (fixed):', slotStartTime, '→', slotStartMinutes, 'minutes');
                    console.log('Slot end:', slotEndTime, '→', slotEndMinutes, 'minutes');
                    console.log('Check: slotStart >= teacherStart?', slotStartMinutes >= teacherStartMinutes);
                    console.log('Check: slotStart < teacherEnd?', slotStartMinutes < teacherEndMinutes);
                    console.log('Check: slotEnd <= teacherEnd?', slotEndMinutes <= teacherEndMinutes);
                    console.log('Result: teacherIsAvailable =', slotStartMinutes >= teacherStartMinutes && slotStartMinutes < teacherEndMinutes && slotEndMinutes <= teacherEndMinutes);
                }
                
                // Slot is available if:
                // - Slot starts at or after teacher's time in
                // - Slot starts before teacher's time out (class must start before they leave)
                // - Slot ends at or before teacher's time out
                teacherIsAvailable = slotStartMinutes >= teacherStartMinutes && 
                                    slotStartMinutes < teacherEndMinutes && 
                                    slotEndMinutes <= teacherEndMinutes;
            } else if (hasAvailabilitySet && !dayAvail) {
                // Teacher has availability set but not for this day - not available
                teacherIsAvailable = false;
            }
            // else: no availability set at all - all slots available (teacherIsAvailable = true)
            
            // Filter sections based on availability for this day and slot
            const availableSections = SECTIONS.filter(s => {
                // Filter by department preferences
                const depts = teacher?.departments || {};
                const hasDeptSet = depts && Object.keys(depts).length > 0;
                
                if (hasDeptSet) {
                    // Check if section grade matches teacher's department preferences
                    if (s.grade <= 10) {
                        // JHS section - teacher must have JHS checked
                        if (!depts.jhs) return false;
                        
                        // If specific grades are checked, only show those; otherwise show all JHS
                        const checkedJhsGrades = [7, 8, 9, 10].filter(g => depts[`grade${g}`]);
                        if (checkedJhsGrades.length > 0 && !checkedJhsGrades.includes(s.grade)) {
                            return false;
                        }
                    } else if (s.grade === 11 || s.grade === 12) {
                        // SHS section - teacher must have SHS checked
                        if (!depts.shs) return false;

                        // If either grade11 or grade12 is explicitly set (true or false),
                        // use them to filter; otherwise show all SHS sections
                        const hasGrade11Set = depts.grade11 === true || depts.grade11 === false;
                        const hasGrade12Set = depts.grade12 === true || depts.grade12 === false;

                        if (hasGrade11Set || hasGrade12Set) {
                            // At least one grade flag is set — filter strictly
                            if (s.grade === 11 && !depts.grade11) return false;
                            if (s.grade === 12 && !depts.grade12) return false;
                        }
                        // If neither flag is set at all, show all SHS sections (backward compat)
                    }
                }
                
                // Section availability is NOT used to hide sections from the dropdown.
                // All department-matching sections are shown so the user can always
                // manually assign any section. Conflicts are shown with a ⚠️ warning.
                return true;
            });
            
            // Filter subjects based on teacher's subject list
            const teacherSubjects = teacher?.subjects || [];
            
            // Build section options with conflict detection
            // IMPORTANT: Always include the currently-assigned section even if it
            // doesn't pass the availability/department filter, so it stays visible.
            const assignedSection = secVal ? SECTIONS.find(s => s.id === secVal) : null;
            const sectionsToShow = assignedSection && !availableSections.find(s => s.id === secVal)
                ? [assignedSection, ...availableSections]
                : availableSections;

            const secOpts = sectionsToShow.map(s => {
                // Check if this section is already assigned to another teacher at this time
                let assignedTeacher = null;
                Object.entries(scheduleCache).forEach(([otherTid, otherData]) => {
                    if (otherTid !== tid && otherData[day]?.[slot.id]?.section === s.id) {
                        const otherTeacherData = teachersCache.find(t => t.id === otherTid);
                        if (otherTeacherData) {
                            assignedTeacher = otherTeacherData.name;
                        }
                    }
                });
                
                const isConflict = assignedTeacher !== null;
                const isSelected = secVal === s.id;
                const style = isConflict && !isSelected ? 'color:#dc2626;font-weight:700;background:rgba(220,38,38,0.08)' : '';
                const title = isConflict && !isSelected ? `⚠️ Already assigned to ${assignedTeacher}` : '';
                
                return `<option value="${s.id}" ${isSelected ? 'selected' : ''} style="${style}" title="${title}">${s.name}${isConflict && !isSelected ? ' ⚠️' : ''}</option>`;
            }).join('');
            
            // If teacher is not available, show disabled cell
            if (!teacherIsAvailable) {
                html += `<td style="background:var(--bg3)"><div class="period-cell" style="opacity:0.5">
                    <select class="slot-section" disabled>
                        <option value="">— Not Available —</option>
                    </select>
                    <select class="slot-subject" disabled>
                        <option value="">— Not Available —</option>
                    </select>
                </div></td>`;
            } else {
                html += `<td><div class="period-cell">
                    <select class="slot-section ${secVal && subjVal ? 'filled' : ''}"
                        onchange="handleSlotChange('${tid}','${day}','${slot.id}',this)">
                        <option value="">— Section —</option>
                        ${secOpts}
                    </select>
                    <select class="slot-subject ${secVal && subjVal ? 'filled' : ''}"
                        id="subj_${tid}_${day}_${slot.id}"
                        onchange="handleSubjectChange('${tid}','${day}','${slot.id}',this)">
                        <option value="">— Subject —</option>
                        ${(() => {
                            // Get subjects for this section
                            let availableSubjects = getSubjectsForSection(secVal);
                            
                            // CRITICAL: Always include the currently assigned subject
                            if (subjVal && !availableSubjects.includes(subjVal)) {
                                availableSubjects = [subjVal, ...availableSubjects];
                            }
                            
                            // CRITICAL: Always include teacher's assigned subjects from edit modal
                            // This ensures subjects checked in the edit modal always appear
                            if (teacherSubjects.length > 0) {
                                teacherSubjects.forEach(ts => {
                                    if (!availableSubjects.includes(ts)) {
                                        availableSubjects = [ts, ...availableSubjects];
                                    }
                                });
                            }
                            
                            // Remove duplicates to prevent double subjects in dropdown
                            availableSubjects = Array.from(new Set(availableSubjects));
                            
                            return availableSubjects.map(s => {
                                // Always include the currently selected subject
                                const isCurrentlySelected = subjVal === s;
                                
                                // If teacher has assigned subjects, filter to show only those
                                // But ALWAYS show the currently selected subject and all assigned subjects
                                if (teacherSubjects.length > 0 && !isCurrentlySelected && !teacherSubjects.includes(s)) {
                                    return '';
                                }
                                
                                // Check department compatibility if section is selected (unless it's already selected)
                                if (!isCurrentlySelected && secVal) {
                                    const section = SECTIONS.find(sec => sec.id === secVal);
                                    if (section) {
                                        const teacherDepts = teacher.departments || {};
                                        const sectionGrade = section.grade;
                                        
                                        // Check if teacher's department matches the section's grade level
                                        let canTeachThisSection = false;
                                        
                                        if (sectionGrade <= 10) {
                                            // JHS section - teacher must have JHS department
                                            canTeachThisSection = teacherDepts.jhs === true;
                                        } else {
                                            // SHS section - teacher must have SHS department and appropriate grade
                                            const hasSHS = teacherDepts.shs === true;
                                            const hasGrade11Set = 'grade11' in teacherDepts;
                                            const hasGrade12Set = 'grade12' in teacherDepts;

                                            if (!hasSHS) {
                                                canTeachThisSection = false;
                                            } else if (!hasGrade11Set && !hasGrade12Set) {
                                                canTeachThisSection = true;
                                            } else if (sectionGrade === 11) {
                                                canTeachThisSection = teacherDepts.grade11 === true;
                                            } else if (sectionGrade === 12) {
                                                canTeachThisSection = teacherDepts.grade12 === true;
                                            }
                                        }
                                        
                                        if (!canTeachThisSection) {
                                            return '';
                                        }
                                    }
                                }
                                
                                // Don't show teacher names in subject dropdown
                                return `<option value="${s}" ${subjVal === s ? 'selected' : ''}>${s}</option>`;
                            }).join('');
                        })()}
                    </select>
                </div></td>`;
            }
        });
        html += '</tr>';
    });
 
    html += '</tbody>';
    table.innerHTML = html;
}
 
async function handleSlotChange(tid, day, slotId, selectEl) {
    const section = selectEl.value;
    
    // Validate that teacher can teach this section based on their department
    if (section) {
        const teacher = teachersCache.find(t => t.id === tid);
        const sectionObj = SECTIONS.find(s => s.id === section);
        
        if (teacher && sectionObj) {
            const teacherDepts = teacher.departments || {};
            const sectionGrade = sectionObj.grade;
            
            // Check if teacher's department matches the section's grade level
            let canTeachThisSection = false;
            
            if (sectionGrade <= 10) {
                // JHS section - teacher must have JHS department
                canTeachThisSection = teacherDepts.jhs === true;
            } else {
                // SHS section - teacher must have SHS department and appropriate grade
                const hasSHS = teacherDepts.shs === true;
                const hasGrade11Set = 'grade11' in teacherDepts;
                const hasGrade12Set = 'grade12' in teacherDepts;

                if (!hasSHS) {
                    canTeachThisSection = false;
                } else if (!hasGrade11Set && !hasGrade12Set) {
                    // No grade flags set — allow all SHS (backward compat)
                    canTeachThisSection = true;
                } else if (sectionGrade === 11) {
                    canTeachThisSection = teacherDepts.grade11 === true;
                } else if (sectionGrade === 12) {
                    canTeachThisSection = teacherDepts.grade12 === true;
                }
            }
            
            if (!canTeachThisSection) {
                const gradeType = sectionGrade <= 10 ? 'JHS' : 'SHS Grade ' + sectionGrade;
                showToast(`✗ Teacher ${teacher.name} is not assigned to ${gradeType} department`, 'error');
                selectEl.value = ''; // Reset the selection
                return;
            }
        }
    }

    const subjSel = document.getElementById('subj_'+tid+'_'+day+'_'+slotId);
    if (subjSel) {
        const currentSubj = subjSel.value;
        const tData = teachersCache.find(function(t){ return t.id===tid; });
        const tSubjs = tData && Array.isArray(tData.subjects) && tData.subjects.length ? tData.subjects : [];
        const gradeSubjs = getSubjectsForSection(section);
        
        console.log('=== handleSlotChange Debug ===');
        console.log('Teacher ID:', tid);
        console.log('Teacher subjects (tSubjs):', tSubjs);
        console.log('Grade subjects (gradeSubjs):', gradeSubjs);
        console.log('Section:', section);
        
        // Additional filtering based on department compatibility
        let filteredSubjs = gradeSubjs;
        if (section && tData) {
            const sectionObj = SECTIONS.find(s => s.id === section);
            if (sectionObj) {
                const teacherDepts = tData.departments || {};
                const sectionGrade = sectionObj.grade;
                
                console.log('Section grade:', sectionGrade);
                console.log('Teacher departments:', teacherDepts);
                
                // Filter subjects based on grade level compatibility
                if (sectionGrade <= 10 && teacherDepts.jhs !== true) {
                    filteredSubjs = []; // No JHS subjects if teacher doesn't have JHS department
                    console.log('Filtered out: Teacher does not have JHS department');
                } else if (sectionGrade > 10 && teacherDepts.shs !== true) {
                    filteredSubjs = []; // No SHS subjects if teacher doesn't have SHS department
                    console.log('Filtered out: Teacher does not have SHS department');
                } else if (sectionGrade === 11 && teacherDepts.grade11 !== true) {
                    filteredSubjs = []; // No Grade 11 subjects if teacher doesn't have Grade 11 department
                    console.log('Filtered out: Teacher does not have Grade 11 department');
                } else if (sectionGrade === 12 && teacherDepts.grade12 !== true) {
                    filteredSubjs = []; // No Grade 12 subjects if teacher doesn't have Grade 12 department
                    console.log('Filtered out: Teacher does not have Grade 12 department');
                }
            }
        }
        
        console.log('Filtered subjects (filteredSubjs):', filteredSubjs);
        console.log('Teacher subjects (tSubjs):', tSubjs);
        
        // Build the subject list: include grade-appropriate subjects AND teacher's assigned subjects
        let useList = [...filteredSubjs];
        
        // CRITICAL: Always include teacher's assigned subjects, even if not in current term/semester
        // This ensures subjects assigned in the edit modal always appear in the dropdown
        if (tSubjs.length > 0) {
            tSubjs.forEach(s => {
                if (!useList.includes(s)) {
                    console.log(`Adding teacher's assigned subject "${s}" to dropdown (not in current term/semester)`);
                    useList.unshift(s); // Add to front of list
                }
            });
        }
        
        // CRITICAL: Always include the currently selected subject, even if not in either list
        // This ensures auto-generated subjects remain visible
        if (currentSubj && !useList.includes(currentSubj)) {
            console.log(`Preserving current subject "${currentSubj}" in dropdown`);
            useList.unshift(currentSubj);
        }
        
        console.log('Final useList with all subjects:', useList);
        console.log('=== End Debug ===');
        
        // Define time slots for label lookup
        const timeSlotsToShow = [
            { id: 'p1',   label: '7:00 – 7:30 AM' },
            { id: 'p2',   label: '7:30 – 8:30 AM' },
            { id: 'p3',   label: '8:30 – 9:30 AM' },
            { id: 'p4',   label: '9:30 – 10:30 AM' },
            { id: 'p5',   label: '10:45 – 11:45 AM' },
            { id: 'p6',   label: '11:45 AM – 12:45 PM' },
            { id: 'p7',   label: '1:15 – 2:15 PM' },
            { id: 'p8',   label: '2:15 – 3:15 PM' },
            { id: 'p9',   label: '3:30 – 4:30 PM' },
            { id: 'p10',  label: '4:30 – 5:30 PM' }
        ];
        
        // Check which subjects are already assigned to this section on this day
        const sectionObj = SECTIONS.find(s => s.id === section);
        const assignedSubjects = {}; // Map: subject -> time slot where it's assigned
        
        if (sectionObj) {
            // Check all teachers' schedules for this section on this day
            Object.entries(scheduleCache).forEach(([teacherId, teacherSchedule]) => {
                if (teacherSchedule[day]) {
                    Object.entries(teacherSchedule[day]).forEach(([slot, assignment]) => {
                        if (assignment.section === section && assignment.subject && slot !== slotId) {
                            // This subject is already assigned to this section on this day at a different time
                            const timeSlot = timeSlotsToShow.find(ts => ts.id === slot);
                            if (timeSlot) {
                                assignedSubjects[assignment.subject] = timeSlot.label;
                            }
                        }
                    });
                }
            });
        }
        
        console.log('Assigned subjects on this day:', assignedSubjects);
        
        subjSel.innerHTML = '<option value="">— Subject —</option>' +
            useList.map(function(s){
                const isAssigned = assignedSubjects[s];
                const title = isAssigned ? `⚠️ Already assigned to ${sectionObj?.name || 'this section'} at ${isAssigned}` : '';
                const style = isAssigned ? 'color:#dc2626;font-weight:700' : '';
                return '<option value="'+s+'"'+(currentSubj===s?' selected':'')+' title="'+title+'" style="'+style+'">'+s+(isAssigned?' ⚠️':'')+'</option>';
            }).join('');
    }

    if (!scheduleCache[tid])      scheduleCache[tid] = {};
    if (!scheduleCache[tid][day]) scheduleCache[tid][day] = {};
 
    const subject = scheduleCache[tid][day][slotId]?.subject || '';
    scheduleCache[tid][day][slotId] = { section, subject };
    selectEl.classList.toggle('filled', !!section);
    selectEl.disabled = true;
 
    const ok = await saveSlotToDB(tid, day, slotId, section, subject);
    selectEl.disabled = false;
 
    if (ok) {
        showToast('✓ Saved', 'success');
        
        // Refresh conflicts if we're viewing the conflicts section
        if (currentSection) {
            // Add a small delay to ensure database has updated before fetching conflicts
            await new Promise(resolve => setTimeout(resolve, 300));
            const section = SECTIONS.find(s => s.id === currentSection);
            if (section) {
                await displaySectionConflicts(currentSection, section);
            }
        }
    } else {
        showToast('✗ Failed to save', 'error');
        selectEl.value = '';
        selectEl.classList.remove('filled');
    }
}
 
async function handleSubjectChange(tid, day, slotId, selectEl) {
    const subject = selectEl.value;
    if (!scheduleCache[tid])      scheduleCache[tid] = {};
    if (!scheduleCache[tid][day]) scheduleCache[tid][day] = {};
 
    const section = scheduleCache[tid][day][slotId]?.section || '';
    
    // Validate that teacher can teach this subject based on their department
    if (subject) {
        const teacher = teachersCache.find(t => t.id === tid);
        const sectionObj = SECTIONS.find(s => s.id === section);
        
        if (teacher && sectionObj) {
            const teacherDepts = teacher.departments || {};
            const sectionGrade = sectionObj.grade;
            
            // Check if teacher's department matches the section's grade level
            let canTeachThisSection = false;
            
            if (sectionGrade <= 10) {
                // JHS section - teacher must have JHS department
                canTeachThisSection = teacherDepts.jhs === true;
            } else {
                // SHS section - teacher must have SHS department and appropriate grade
                const hasSHS = teacherDepts.shs === true;
                const hasGrade11Set = 'grade11' in teacherDepts;
                const hasGrade12Set = 'grade12' in teacherDepts;

                if (!hasSHS) {
                    canTeachThisSection = false;
                } else if (!hasGrade11Set && !hasGrade12Set) {
                    // No grade flags set — allow all SHS (backward compat)
                    canTeachThisSection = true;
                } else if (sectionGrade === 11) {
                    canTeachThisSection = teacherDepts.grade11 === true;
                } else if (sectionGrade === 12) {
                    canTeachThisSection = teacherDepts.grade12 === true;
                }
            }
            
            if (!canTeachThisSection) {
                const gradeType = sectionGrade <= 10 ? 'JHS' : 'SHS Grade ' + sectionGrade;
                showToast(`✗ Teacher ${teacher.name} is not assigned to ${gradeType} department`, 'error');
                selectEl.value = ''; // Reset the selection
                return;
            }
            
            // Also check if the subject is appropriate for the teacher's assigned subjects
            const teacherSubjects = Array.isArray(teacher.subjects) ? teacher.subjects : 
                                  (teacher.subject ? [teacher.subject] : []);
            
            if (teacherSubjects.length > 0 && !teacherSubjects.includes(subject)) {
                showToast(`✗ Subject "${subject}" is not assigned to teacher ${teacher.name}`, 'error');
                selectEl.value = ''; // Reset the selection
                return;
            }
        }
    }
    
    scheduleCache[tid][day][slotId] = { section, subject };
    selectEl.classList.toggle('filled', !!subject);
    selectEl.disabled = true;
 
    const ok = await saveSlotToDB(tid, day, slotId, section, subject);
    selectEl.disabled = false;
 
    if (ok) {
        showToast('✓ Subject saved', 'success');
        
        // Refresh conflicts if we're viewing the conflicts section
        if (currentSection) {
            // Add a small delay to ensure database has updated before fetching conflicts
            await new Promise(resolve => setTimeout(resolve, 300));
            const sectionObj = SECTIONS.find(s => s.id === currentSection);
            if (sectionObj) {
                await displaySectionConflicts(currentSection, sectionObj);
            }
        }
    } else {
        showToast('✗ Failed', 'error');
    }
}
 
 
// ============================================================
// 09. WCI PRINT — TEACHER SCHEDULE
// ============================================================
 

// ============================================================
// PRINT ALL SCHEDULES
// ============================================================
function closePrintAllModal()     { var m=document.getElementById("printAllModal");     if(m) m.classList.add("hidden"); }
function closePrintSectionsModal(){ var m=document.getElementById("printSectionsModal"); if(m) m.classList.add("hidden"); }

function openPrintAllModal() {
    if (!document.getElementById("printAllModal")) {
        var m = document.createElement("div");
        m.id = "printAllModal";
        m.className = "modal-overlay hidden";
        m.onclick = function(e){ if(e.target===m) closePrintAllModal(); };
        m.innerHTML = [
            "<div class='modal-box'>",
            "<div class='modal-header'><h3>Print All Schedules</h3><button class='panel-close' onclick='closePrintAllModal()'>X</button></div>",
            "<div class='modal-body'>",
            "<p style='color:var(--text2);font-size:13px;margin-bottom:16px'>Choose what to print. All schedules open in one window.</p>",
            "<div style='display:flex;flex-direction:column;gap:10px'>",
            "<button class='btn-confirm' style='background:#8b0000;border-color:#8b0000' onclick='printAllTeachers()'>Print All Teacher Schedules</button>",
            "<button class='btn-confirm' style='background:#1d4ed8;border-color:#1d4ed8' onclick='openPrintSectionsChoice()'>Print All Section Schedules</button>",
            "</div></div>",
            "<div class='modal-footer'><button class='btn-cancel' onclick='closePrintAllModal()'>Cancel</button></div>",
            "</div>"
        ].join("");
        document.body.appendChild(m);
    }
    document.getElementById("printAllModal").classList.remove("hidden");
}

function openPrintSectionsChoice() {
    closePrintAllModal();
    if (!document.getElementById("printSectionsModal")) {
        var m = document.createElement("div");
        m.id = "printSectionsModal";
        m.className = "modal-overlay hidden";
        m.onclick = function(e){ if(e.target===m) closePrintSectionsModal(); };
        var gradeOpts = ["<option value='all'>All Grades</option>",7,8,9,10,11,12].map(function(g){
            return typeof g === "number" ? "<option value='"+g+"'>Grade "+g+(g>=11?" (SHS)":"")+"</option>" : g;
        }).join("");
        var strandOpts = ["ALL","ABM","HUMSS","STEM","TVL"].map(function(s){
            return "<option value='"+s+"'>"+s+"</option>";
        }).join("");
        m.innerHTML = [
            "<div class='modal-box'>",
            "<div class='modal-header'><h3>Print Section Schedules</h3><button class='panel-close' onclick='closePrintSectionsModal()'>X</button></div>",
            "<div class='modal-body'>",
            "<label class='form-label'>Grade Level</label>",
            "<select id='printGradeSelect' class='form-input' onchange='updatePrintStrand()' style='margin-bottom:10px'>"+gradeOpts+"</select>",
            "<div id='printStrandRow' style='display:none;margin-bottom:10px'>",
            "<label class='form-label'>Strand</label>",
            "<select id='printStrandSelect' class='form-input'>"+strandOpts+"</select>",
            "</div></div>",
            "<div class='modal-footer'>",
            "<button class='btn-cancel' onclick='closePrintSectionsModal()'>Cancel</button>",
            "<button class='btn-confirm' onclick='printAllSections()'>Print</button>",
            "</div></div>"
        ].join("");
        document.body.appendChild(m);
    }
    document.getElementById("printSectionsModal").classList.remove("hidden");
}

function updatePrintStrand() {
    var g = parseInt(document.getElementById("printGradeSelect").value);
    var r = document.getElementById("printStrandRow");
    if (r) r.style.display = g >= 11 ? "block" : "none";
}

function buildTeacherPage(tid) {
    var teacher = teachersCache.find(function(t){ return t.id===tid; });
    if (!teacher) return "";
    var daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    
    // Get teacher's availability for working hours display
    var teacherAvailability = teacher.availability || {};
    
    var slots = [
        { time:'7:00 AM',   timeOut:'7:30 AM',   min:'30', type:'period', id:'p1' },
        { time:'7:30 AM',   timeOut:'8:30 AM',   min:'60', type:'period', id:'p2' },
        { time:'8:30 AM',   timeOut:'9:30 AM',   min:'60', type:'period', id:'p3' },
        { time:'9:30 AM',   timeOut:'10:30 AM',  min:'60', type:'period', id:'p4' },
        { time:'10:30 AM',  timeOut:'10:45 AM',  min:'15', type:'break',  label:'Break' },
        { time:'10:45 AM',  timeOut:'11:45 AM',  min:'60', type:'period', id:'p5' },
        { time:'11:45 AM',  timeOut:'12:45 PM',  min:'60', type:'period', id:'p6' },
        { time:'12:45 PM',  timeOut:'1:15 PM',   min:'30', type:'lunch',  label:'Lunch Break' },
        { time:'1:15 PM',   timeOut:'2:15 PM',   min:'60', type:'period', id:'p7' },
        { time:'2:15 PM',   timeOut:'3:15 PM',   min:'60', type:'period', id:'p8' },
        { time:'3:15 PM',   timeOut:'3:30 PM',   min:'15', type:'break',  label:'Break' },
        { time:'3:30 PM',   timeOut:'4:30 PM',   min:'60', type:'period', id:'p9' },
        { time:'4:30 PM',   timeOut:'5:30 PM',   min:'60', type:'period', id:'p10' },
    ];
    var TH  = 'border:1px solid #000;padding:6px 4px;text-align:center;font-size:10px;font-weight:700;background:#fff;vertical-align:middle;';
    var TC  = 'border:1px solid #000;padding:5px 4px;text-align:center;vertical-align:middle;font-size:9px;';
    var TBK = 'border:1px solid #000;padding:6px;text-align:center;font-size:11px;font-weight:700;background:#f5a623;color:#fff;font-style:italic;';
    var TWH = 'border:1px solid #000;padding:4px;text-align:center;font-size:9px;font-weight:700;background:#fff;color:#8b0000;';
    
    var rows = ""; // Don't add working hours at the top
    
    slots.forEach(function(slot){
        if (slot.type==='break'||slot.type==='lunch') {
            rows += "<tr style='height:28px'><td colspan='"+(daysToShow.length + 1)+"' style='"+TBK+"'>"+slot.label+"</td></tr>";
            return;
        }
        rows += "<tr style='height:30px'><td style='"+TC+"'>"+slot.time+" – "+slot.timeOut+"</td>";
        daysToShow.forEach(function(day){
            var d = scheduleCache[tid]&&scheduleCache[tid][day]&&scheduleCache[tid][day][slot.id];
            var secObj = d&&d.section ? SECTIONS.find(function(s){ return s.id===d.section; }) : null;
            var sec = secObj ? secObj.name : (d&&d.section ? d.section : "");
            var room = secObj ? (secObj.room||"") : "";
            var subj = d&&d.subject ? d.subject : "";
            rows += "<td style='"+TC+"'>"+(sec||subj ? "<div style='font-weight:700;font-size:8px;line-height:1.2;margin-bottom:1px'>"+sec+"</div>"+(room?"<div style='font-size:7px;color:#666;margin-bottom:1px'>"+room+"</div>":"")+"<div style='font-size:7px;color:#333'>"+subj+"</div>" : "")+"</td>";
        });
        rows += "</tr>";
    });
    
    // Build working hours display as plain text below the table
    var workingHoursDisplay = "<div style='display:flex;width:100%;margin-top:8px;margin-bottom:8px'>";
    workingHoursDisplay += "<div style='width:120px'></div>"; // TIME SLOT column space
    
    daysToShow.forEach(function(day){
        var dayAvail = teacherAvailability[day];
        var displayText = "—";
        if (dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
            var timeIn = formatTime12h(dayAvail.timeIn);
            var timeOut = formatTime12h(dayAvail.timeOut);
            displayText = timeIn + " – " + timeOut;
        }
        workingHoursDisplay += "<div style='flex:1;text-align:center;font-size:9px;font-weight:700;color:#8b0000'>"+displayText+"</div>";
    });
    workingHoursDisplay += "</div>";
    
    return "<div style='page-break-after:always;padding:12mm'>"+
        wcHeader()+
        "<div style='background:#c00;padding:2px;margin-bottom:1px'></div>"+
        "<div style='border:1px solid #000;padding:6px;text-align:center;margin-bottom:1px'><strong style='font-size:12px;letter-spacing:1px'>TEACHERS' SCHEDULE FOR SY "+schoolYear+"</strong></div>"+
        "<div style='border:1px solid #000;border-top:none;padding:6px;text-align:center;margin-bottom:8px'><div style='font-size:14px;font-weight:700;text-transform:uppercase'>"+teacher.name+"</div></div>"+
        "<table style='width:100%;border-collapse:collapse;table-layout:fixed'>"+
        "<thead><tr><th style='"+TH+"width:120px'>TIME SLOT</th>"+
        daysToShow.map(function(d){ return "<th style='"+TH+"'>"+d.toUpperCase()+"</th>"; }).join("")+
        "</tr></thead><tbody>"+rows+"</tbody></table>"+
        workingHoursDisplay+
        "<div style='margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end'>"+
        "<div style='text-align:center;width:40%'><div style='border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px;text-transform:uppercase'>"+teacher.name+"</div><div style='font-size:9px;margin-top:4px'>Teacher</div></div>"+
        "<div style='width:20%'></div>"+
        "<div style='text-align:center;width:40%'><div style='border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px'>MR. DARNIELL C. BALBUENA, Ph.D.</div><div style='font-size:9px;margin-top:4px'>School Principal</div></div>"+
        "</div></div>";
}

// Helper function to format 24h time to 12h format
function formatTime12h(time24) {
    if (!time24) return '';
    var parts = time24.split(':');
    var hours = parseInt(parts[0]);
    var minutes = parts[1];
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return hours + ':' + minutes + ' ' + ampm;
}

// Helper function to convert 24h time (HH:MM) to minutes since midnight
function timeToMinutes(time24) {
    if (!time24) return 0;
    const parts = time24.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper function to convert 12h time (e.g., "7:00 AM") to minutes since midnight
function time12hToMinutes(time12h) {
    if (!time12h) return 0;
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
}

// Calculate hours rendered per day (excluding lunch and breaks)
function calculateHoursRendered(timeIn, timeOut) {
    if (!timeIn || !timeOut) return 0;
    
    const timeInMinutes = timeToMinutes(timeIn);
    const timeOutMinutes = timeToMinutes(timeOut);
    
    // Total time in minutes
    let totalMinutes = timeOutMinutes - timeInMinutes;
    
    if (totalMinutes <= 0) return 0;
    
    // Subtract lunch break (60 minutes / 1 hour) if working hours span lunch time
    // Lunch is typically 11:45 AM - 12:45 PM (JHS) or 12:45 PM - 1:45 PM (SHS)
    const lunchStartJHS = 11 * 60 + 45; // 11:45 AM
    const lunchEndJHS = 12 * 60 + 45;   // 12:45 PM
    const lunchStartSHS = 12 * 60 + 45; // 12:45 PM
    const lunchEndSHS = 13 * 60 + 45;   // 1:45 PM
    
    // Check if work hours span lunch time (either JHS or SHS lunch)
    if ((timeInMinutes < lunchEndJHS && timeOutMinutes > lunchStartJHS) ||
        (timeInMinutes < lunchEndSHS && timeOutMinutes > lunchStartSHS)) {
        totalMinutes -= 60; // Subtract 60 minutes (1 hour) for lunch
    }
    
    // Subtract breaks (15 minutes each)
    // Morning break: 9:30-9:45 AM (JHS) or 10:30-10:45 AM (SHS)
    // Afternoon break: 2:15-2:30 PM (JHS) or 3:15-3:30 PM (SHS)
    const morningBreakStartJHS = 9 * 60 + 30;  // 9:30 AM
    const morningBreakEndJHS = 9 * 60 + 45;    // 9:45 AM
    const morningBreakStartSHS = 10 * 60 + 30; // 10:30 AM
    const morningBreakEndSHS = 10 * 60 + 45;   // 10:45 AM
    const afternoonBreakStartJHS = 14 * 60 + 15; // 2:15 PM
    const afternoonBreakEndJHS = 14 * 60 + 30;   // 2:30 PM
    const afternoonBreakStartSHS = 15 * 60 + 15; // 3:15 PM
    const afternoonBreakEndSHS = 15 * 60 + 30;   // 3:30 PM
    
    // Check for morning breaks
    if (timeInMinutes < morningBreakEndJHS && timeOutMinutes > morningBreakStartJHS) {
        totalMinutes -= 15;
    } else if (timeInMinutes < morningBreakEndSHS && timeOutMinutes > morningBreakStartSHS) {
        totalMinutes -= 15;
    }
    
    // Check for afternoon breaks
    if (timeInMinutes < afternoonBreakEndJHS && timeOutMinutes > afternoonBreakStartJHS) {
        totalMinutes -= 15;
    } else if (timeInMinutes < afternoonBreakEndSHS && timeOutMinutes > afternoonBreakStartSHS) {
        totalMinutes -= 15;
    }
    
    // Convert to hours (rounded to 2 decimal places)
    return Math.round((totalMinutes / 60) * 100) / 100;
}

function buildSectionPage(secId) {
    var section = SECTIONS.find(function(s){ return s.id===secId; });
    if (!section) return "";
    var isSHS = section.grade >= 11;
    var allDays = isSHS ? ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] : ["Monday","Tuesday","Wednesday","Thursday","Friday"];
    var slotIds = isSHS ? ["p2","p3","p4","p5","p6","p7","p8","p9","p10"] : ["p1","p2","p3","p4","p5","p6","p7","p8","p9"];
    var lookup = {};
    allDays.forEach(function(day){
        lookup[day] = {};
        slotIds.forEach(function(slot){
            lookup[day][slot] = null;
            Object.keys(scheduleCache).forEach(function(tid){
                var tData = scheduleCache[tid];
                if (tData[day]&&tData[day][slot]&&tData[day][slot].section===secId) {
                    var teacher = teachersCache.find(function(t){ return t.id===tid; });
                    var tName = teacher ? teacher.name : tid;
                    var subj = tData[day][slot].subject||"";
                    if (!lookup[day][slot]) { lookup[day][slot]={teacher:tName,subject:subj,conflict:false}; }
                    else { lookup[day][slot].conflict=true; lookup[day][slot].teacher+=" / "+tName; }
                }
            });
        });
    });
    var slots = isSHS ? [
        {time:'7:30 AM',timeOut:'8:30 AM',  min:'60',type:'period',id:'p2'},
        {time:'8:30 AM',timeOut:'9:30 AM',  min:'60',type:'period',id:'p3'},
        {time:'9:30 AM',timeOut:'10:30 AM', min:'60',type:'period',id:'p4'},
        {time:'10:30 AM',timeOut:'10:45 AM',min:'15',type:'break', label:'Break'},
        {time:'10:45 AM',timeOut:'11:45 AM',min:'60',type:'period',id:'p5'},
        {time:'11:45 AM',timeOut:'12:45 PM',min:'60',type:'period',id:'p6'},
        {time:'12:45 PM',timeOut:'1:15 PM', min:'30',type:'lunch', label:'Lunch Break'},
        {time:'1:15 PM',timeOut:'2:15 PM',  min:'60',type:'period',id:'p7'},
        {time:'2:15 PM',timeOut:'3:15 PM',  min:'60',type:'period',id:'p8'},
        {time:'3:15 PM',timeOut:'3:30 PM',  min:'15',type:'break', label:'Break'},
        {time:'3:30 PM',timeOut:'4:30 PM',  min:'60',type:'period',id:'p9'},
        {time:'4:30 PM',timeOut:'5:30 PM',  min:'60',type:'period',id:'p10'},
    ] : [
        {time:'7:00 AM',timeOut:'7:30 AM',  min:'30',type:'period',id:'p1'},
        {time:'7:30 AM',timeOut:'8:30 AM',  min:'60',type:'period',id:'p2'},
        {time:'8:30 AM',timeOut:'9:30 AM',  min:'60',type:'period',id:'p3'},
        {time:'9:30 AM',timeOut:'9:45 AM',  min:'15',type:'break', label:'Break'},
        {time:'9:45 AM',timeOut:'10:45 AM', min:'60',type:'period',id:'p4'},
        {time:'10:45 AM',timeOut:'11:45 AM',min:'60',type:'period',id:'p5'},
        {time:'11:45 AM',timeOut:'12:15 PM',min:'30',type:'lunch', label:'Lunch Break'},
        {time:'12:15 PM',timeOut:'1:15 PM', min:'60',type:'period',id:'p6'},
        {time:'1:15 PM',timeOut:'2:15 PM',  min:'60',type:'period',id:'p7'},
        {time:'2:15 PM',timeOut:'2:30 PM',  min:'15',type:'break', label:'Break'},
        {time:'2:30 PM',timeOut:'3:30 PM',  min:'60',type:'period',id:'p8'},
        {time:'3:30 PM',timeOut:'4:30 PM',  min:'60',type:'period',id:'p9'},
    ];
    var TH  = 'border:1px solid #000;padding:6px 4px;text-align:center;font-size:10px;font-weight:700;background:#fff;vertical-align:middle;';
    var TC  = 'border:1px solid #000;padding:5px 4px;text-align:center;vertical-align:middle;font-size:9px;';
    var TBK = 'border:1px solid #000;padding:6px;text-align:center;font-size:11px;font-weight:700;background:#f5a623;color:#fff;font-style:italic;';
    var rows = "";
    slots.forEach(function(slot){
        if (slot.type==='break'||slot.type==='lunch'){
            rows+="<tr style='height:28px'><td style='"+TC+"'>"+slot.time+"</td><td style='"+TC+"'>"+slot.timeOut+"</td><td style='"+TC+"'>"+slot.min+"</td><td colspan='"+allDays.length+"' style='"+TBK+"'>"+slot.label+"</td></tr>";
            return;
        }
        rows+="<tr style='height:30px'><td style='"+TC+"'>"+slot.time+"</td><td style='"+TC+"'>"+slot.timeOut+"</td><td style='"+TC+"'>"+slot.min+"</td>";
        allDays.forEach(function(day){
            var e=lookup[day][slot.id];
            if(!e){rows+="<td style='"+TC+"'></td>";return;}
            if(e.conflict){rows+="<td style='"+TC+"'><div style='font-weight:700;font-size:8px;color:#8b0000'>&#9888; "+e.teacher+"</div></td>";return;}
            rows+="<td style='"+TC+"'><div style='font-weight:700;font-size:8px;line-height:1.2;margin-bottom:1px'>"+e.teacher+"</div><div style='font-size:7px;color:#333'>"+e.subject+"</div></td>";
        });
        rows+="</tr>";
    });
    return "<div style='page-break-after:always;padding:12mm'>"+
        wcHeader()+
        "<div style='background:#c00;padding:2px;margin-bottom:1px'></div>"+
        "<div style='border:1px solid #000;padding:6px;text-align:center;margin-bottom:1px'><strong style='font-size:12px;letter-spacing:1px'>SECTION SCHEDULE FOR SY "+schoolYear+"</strong></div>"+
        "<div style='border:1px solid #000;border-top:none;padding:6px;text-align:center;margin-bottom:8px'><div style='font-size:14px;font-weight:700;text-transform:uppercase'>"+section.name+"</div><div style='font-size:11px;margin-top:2px;min-height:14px'>"+(section.room||"")+"</div></div>"+
        "<table style='width:100%;border-collapse:collapse;table-layout:fixed'>"+
        "<thead><tr><th style='"+TH+"width:75px'>TIME IN</th><th style='"+TH+"width:75px'>TIME OUT</th><th style='"+TH+"width:55px'>MINUTES</th>"+
        allDays.map(function(d){ return "<th style='"+TH+"'>"+d.toUpperCase()+"</th>"; }).join("")+
        "</tr></thead><tbody>"+rows+"</tbody></table>"+
        "<div style='margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end'>"+
        "<div style='text-align:center;width:40%'><div style='border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px;text-transform:uppercase;min-height:14px'>"+(function(){ var a=teachersCache.find(function(x){ return x.advisory_section===secId; }); return a?a.name:""; })()+"</div><div style='font-size:9px;margin-top:4px'>Adviser</div></div>"+
        "<div style='width:20%'></div>"+
        "<div style='text-align:center;width:40%'><div style='border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px'>MR. DARNIELL C. BALBUENA, Ph.D.</div><div style='font-size:9px;margin-top:4px'>School Principal</div></div>"+
        "</div></div>";
}

async function printAllTeachers() {
    closePrintAllModal();
    if (!teachersCache.length) await loadTeachersFromDB();
    showToast("Preparing "+teachersCache.length+" teacher schedules...", "success");
    var pages = teachersCache.map(function(t){ return buildTeacherPage(t.id); }).join("");
    var w = window.open("","_blank","width=1200,height=850");
    w.document.write("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>All Teacher Schedules</title>"+
        "<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#fff;color:#000}table{border-collapse:collapse}"+
        "@page{size:landscape;margin:8mm}@media print{.no-print{display:none!important}}</style></head><body>"+
        "<div class='no-print' style='padding:12px;background:#8b0000;text-align:center'>"+
        "<button onclick='window.print()' style='background:#fff;color:#8b0000;border:none;padding:10px 28px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer'>Print / Save as PDF</button>"+
        "<span style='color:#fff;margin-left:16px;font-size:13px'>"+teachersCache.length+" teacher schedules</span></div>"+
        pages+"</body></html>");
    w.document.close();
    showToast("All teacher schedules ready!", "success");
}

async function printAllSections() {
    closePrintSectionsModal();
    var gradeVal  = document.getElementById("printGradeSelect").value;
    var strandEl  = document.getElementById("printStrandSelect");
    var strandVal = strandEl ? strandEl.value : "ALL";
    var toprint = SECTIONS.filter(function(s){
        if (gradeVal!=="all" && s.grade!==parseInt(gradeVal)) return false;
        if (parseInt(gradeVal)>=11 && strandVal!=="ALL" && s.strand!==strandVal) return false;
        return true;
    });
    if (toprint.length===0){ showToast("No sections found","error"); return; }
    showToast("Preparing "+toprint.length+" section schedules...","success");
    var pages = toprint.map(function(sec){ return buildSectionPage(sec.id); }).join("");
    var w = window.open("","_blank","width=1200,height=850");
    w.document.write("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>All Section Schedules</title>"+
        "<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#fff;color:#000}table{border-collapse:collapse}"+
        "@page{size:landscape;margin:8mm}@media print{.no-print{display:none!important}}</style></head><body>"+
        "<div class='no-print' style='padding:12px;background:#1d4ed8;text-align:center'>"+
        "<button onclick='window.print()' style='background:#fff;color:#1d4ed8;border:none;padding:10px 28px;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer'>Print / Save as PDF</button>"+
        "<span style='color:#fff;margin-left:16px;font-size:13px'>"+toprint.length+" section schedules</span></div>"+
        pages+"</body></html>");
    w.document.close();
    showToast("All section schedules ready!","success");
}

function wcHeader() {
    return `
    <table style="width:100%;border-collapse:collapse;border:none;margin-bottom:0">
      <tr>
        <td style="width:200px;text-align:center;border:none;vertical-align:top;padding:6px 6px 0 6px">
          <img src="assets/img/logo1.png" style="height:80px;width:80px;object-fit:contain;border-radius:50%"
               onerror="this.style.visibility='hidden'">
        </td>
        <td style="text-align:center;border:none;vertical-align:middle;padding:4px">
          <div style="font-family:'Times New Roman',Georgia,serif;font-size:30px;font-weight:700;color:#000;line-height:1.1;letter-spacing:1px">Western Colleges, Inc.</div>
          <div style="font-size:11.5px;color:#000;margin-top:2px">(Formerly Western Cavite Institute)</div>
          <div style="font-size:13px;font-weight:700;color:#000;margin-top:2px">High School Department</div>
          <div style="font-size:11.5px;color:#000;margin-top:6px">Naic, Cavite</div>
          <div style="font-size:11.5px;color:#000">Email: wcihighschool@gmail.com</div>
          <div style="font-size:11.5px;color:#000">Tel. No. (046) 507 0500</div>
        </td>
        <td style="width:200px;text-align:center;border:none;vertical-align:top;padding:6px 6px 0 6px">
          <img src="assets/img/logo 3.png" style="height:80px;width:80px;object-fit:contain;border-radius:50%"
               onerror="this.style.visibility='hidden'">
        </td>
      </tr>
    </table>
    <div style="background:#c00;height:4px;margin:10px 0 20px 0;width:100%;"></div>
    <div style="background:#8b0000;height:7px;margin:4px 0 2px 0"></div>
    <div style="background:#f5c518;height:7px;margin:0 0 0 0"></div>`;
}
 
async function resetTeacherSchedule(tid) {
    if (!tid) {
        showToast('⚠ No teacher selected', 'error');
        return;
    }
    
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    
    if (!confirm(`Are you sure you want to clear all schedule entries for ${teacher.name}? This action cannot be undone.`)) {
        return;
    }
    
    // Get all existing schedule entries for this teacher
    const teacherSchedule = scheduleCache[tid] || {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slots = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    
    let cleared = 0;
    let errors = 0;
    
    // Clear each slot by sending empty section
    for (const day of days) {
        for (const slot of slots) {
            if (teacherSchedule[day]?.[slot]) {
                const res = await apiFetch(API.schedule, {
                    method: 'POST',
                    body: JSON.stringify({
                        teacher_id: tid,
                        day: day,
                        slot_id: slot,
                        section_id: '',
                        subject: ''
                    })
                });
                
                if (res?.success) {
                    cleared++;
                } else {
                    errors++;
                }
            }
        }
    }
    
    // Clear the local cache
    scheduleCache[tid] = {
        Monday: {},
        Tuesday: {},
        Wednesday: {},
        Thursday: {},
        Friday: {},
        Saturday: {}
    };
    
    // Refresh the schedule table
    renderTeacherScheduleTable(tid);
    
    if (errors === 0) {
        showToast(`✓ Schedule cleared successfully (${cleared} entries removed)`, 'success');
    } else {
        showToast(`⚠ Partially cleared: ${cleared} removed, ${errors} failed`, 'warning');
    }
}

function exportTeacherScheduleExcel(tid) {
    console.log('=== EXPORT TEACHER SCHEDULE EXCEL CALLED ===');
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
    console.log('Teacher:', teacher.name);

    const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const slots = [
        { timeIn:'7:00 AM', timeOut:'7:30 AM', min:'30', type:'period', id:'p1' },
        { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
        { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
        { timeIn:'9:30 AM', timeOut:'10:30 AM', min:'60', type:'period', id:'p4' },
        { timeIn:'10:30 AM', timeOut:'10:45 AM', min:'15', type:'break', label:'Break' },
        { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
        { timeIn:'11:45 AM', timeOut:'12:45 PM', min:'60', type:'period', id:'p6' },
        { timeIn:'12:45 PM', timeOut:'1:15 PM', min:'30', type:'lunch', label:'Lunch' },
        { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
        { timeIn:'2:15 PM', timeOut:'3:15 PM', min:'60', type:'period', id:'p8' },
        { timeIn:'3:15 PM', timeOut:'3:30 PM', min:'15', type:'break', label:'Break' },
        { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
        { timeIn:'4:30 PM', timeOut:'5:30 PM', min:'60', type:'period', id:'p10' },
    ];

    // Get term/semester info
    const currentCurr = window.currentCurriculum || 'new';
    const currentTerm = window.currentTerm || '1';
    const currentSemester = window.currentSemester || '1';
    const termNames = {'1':'1st Term','2':'2nd Term','3':'3rd Term'};
    const semNames = {'1':'1st Semester','2':'2nd Semester'};
    const periodInfo = currentCurr === 'new' ? termNames[currentTerm] + ' | ' + semNames[currentSemester] : 'Term ' + currentTerm + ' | Semester ' + currentSemester;

    // Build HTML table
    const TH = 'border:1px solid #000;padding:8px 4px;text-align:center;font-size:11px;font-weight:700;background:#D3D3D3;vertical-align:middle;';
    const TC = 'border:1px solid #000;padding:8px 6px;text-align:center;vertical-align:middle;font-size:10px;background:#fff;';
    const TBK = 'border:1px solid #000;padding:10px;text-align:center;font-size:12px;font-weight:700;background:#FFA500;color:#000;';

    let rows = '';
    slots.forEach(slot => {
        if (slot.type === 'break' || slot.type === 'lunch') {
            rows += `<tr>
                <td style="${TC}">${slot.timeIn}</td>
                <td style="${TC}">${slot.timeOut}</td>
                <td style="${TC}">${slot.min}</td>
                <td colspan="${daysToShow.length}" style="${TBK}">${slot.label}</td>
            </tr>`;
            return;
        }
        rows += `<tr>
            <td style="${TC}">${slot.timeIn}</td>
            <td style="${TC}">${slot.timeOut}</td>
            <td style="${TC}">${slot.min}</td>`;
        daysToShow.forEach(day => {
            const d = scheduleCache[tid]?.[day]?.[slot.id];
            const secObj = d?.section ? SECTIONS.find(s => s.id === d.section) : null;
            const sec = secObj?.name || d?.section || '';
            const room = secObj?.room || '';
            const subj = d?.subject || '';
            
            if (subj === 'PRELIMINARIES') {
                rows += `<td style="${TC}"><b>${subj}</b></td>`;
            } else if (sec || subj) {
                rows += `<td style="${TC}"><b>${sec}</b><br/>${subj}${room ? '<br/>(' + room + ')' : ''}</td>`;
            } else {
                rows += `<td style="${TC}"></td>`;
            }
        });
        rows += '</tr>';
    });

    let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Schedule</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:10px">
          <tr>
            <td colspan="3" style="text-align:center;border:none;padding:10px">
              <div style="font-size:24px;font-weight:700">Western Colleges, Inc.</div>
              <div style="font-size:11px">(Formerly Western Cavite Institute)</div>
              <div style="font-size:12px;font-weight:700">High School Department</div>
              <div style="font-size:11px">Naic, Cavite</div>
              <div style="font-size:11px">Email: wcihighschool@gmail.com | Tel. No. (046) 507 0500</div>
            </td>
          </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:10px">
          <tr>
            <td style="border:2px solid #000;padding:8px;text-align:center;background:#D3D3D3">
              <b>TEACHERS' SCHEDULE FOR SY ${schoolYear}</b>
            </td>
          </tr>
          <tr>
            <td style="border:2px solid #000;border-top:none;padding:8px;text-align:center">
              <div style="font-size:14px;font-weight:700">${teacher.name}</div>
              <div style="font-size:11px">${periodInfo}</div>
            </td>
          </tr>
        </table>
        <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
            <thead><tr>
                <th style="${TH}">Time In</th>
                <th style="${TH}">Time Out</th>
                <th style="${TH}">Min</th>
                ${daysToShow.map(d => `<th style="${TH}">${d}</th>`).join('')}
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:30px">
          <tr>
            <td style="text-align:center;width:45%;border-top:2px solid #000;padding-top:5px">
              <b>${teacher.name}</b><br/>
              <i>Teacher</i>
            </td>
            <td style="width:10%"></td>
            <td style="text-align:center;width:45%;border-top:2px solid #000;padding-top:5px">
              <b>MR. DARNIELL C. BALBUENA, Ph.D.</b><br/>
              <i>School Principal</i>
            </td>
          </tr>
        </table>
        </body>
        </html>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `Teacher_Schedule_${teacher.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xls`;
    console.log('Downloading file:', a.download);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✓ Excel file downloaded', 'success');
}

function printTeacherSchedule(tid) {
    const teacher = teachersCache.find(t => t.id === tid);
    if (!teacher) return;
 
    // Always show Saturday for all teachers
    const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 
    const slots = [
        { time:'7:00 AM',   timeOut:'7:30 AM',   min:'30', type:'period', id:'p1' },
        { time:'7:30 AM',   timeOut:'8:30 AM',   min:'60', type:'period', id:'p2' },
        { time:'8:30 AM',   timeOut:'9:30 AM',   min:'60', type:'period', id:'p3' },
        { time:'9:30 AM',   timeOut:'10:30 AM',  min:'60', type:'period', id:'p4' },
        { time:'10:30 AM',  timeOut:'10:45 AM',  min:'15', type:'break',  label:'Break' },
        { time:'10:45 AM',  timeOut:'11:45 AM',  min:'60', type:'period', id:'p5' },
        { time:'11:45 AM',  timeOut:'12:45 PM',  min:'60', type:'period', id:'p6' },
        { time:'12:45 PM',  timeOut:'1:15 PM',   min:'30', type:'lunch',  label:'Lunch Break' },
        { time:'1:15 PM',   timeOut:'2:15 PM',   min:'60', type:'period', id:'p7' },
        { time:'2:15 PM',   timeOut:'3:15 PM',   min:'60', type:'period', id:'p8' },
        { time:'3:15 PM',   timeOut:'3:30 PM',   min:'15', type:'break',  label:'Break' },
        { time:'3:30 PM',   timeOut:'4:30 PM',   min:'60', type:'period', id:'p9' },
        { time:'4:30 PM',   timeOut:'5:30 PM',   min:'60', type:'period', id:'p10' },
    ];
 
    const TH  = 'border:1px solid #000;padding:6px 4px;text-align:center;font-size:10px;font-weight:700;background:#fff;vertical-align:middle;';
    const TC  = 'border:1px solid #000;padding:5px 4px;text-align:center;vertical-align:middle;font-size:9px;';
    const TBK = 'border:1px solid #000;padding:6px;text-align:center;font-size:11px;font-weight:700;background:#f5a623;color:#fff;font-style:italic;';
 
    let rows = '';
    slots.forEach(slot => {
        if (slot.type === 'break' || slot.type === 'lunch') {
            rows += `<tr style="height:28px">
                <td style="${TC}">${slot.time}</td>
                <td style="${TC}">${slot.timeOut}</td>
                <td style="${TC}">${slot.min}</td>
                <td colspan="6" style="${TBK}">${slot.label}</td>
            </tr>`;
            return;
        }
        rows += `<tr style="height:30px">
            <td style="${TC}">${slot.time}</td>
            <td style="${TC}">${slot.timeOut}</td>
            <td style="${TC}">${slot.min}</td>`;
        daysToShow.forEach(day => {
            const d    = scheduleCache[tid]?.[day]?.[slot.id];
            const secObj = d?.section ? SECTIONS.find(s => s.id === d.section) : null;
            const sec  = secObj?.name || d?.section || '';
            const room = secObj?.room || '';
            const subj = d?.subject || '';
            rows += `<td style="${TC}">${sec || subj
                ? `<div style="font-weight:700;font-size:8px;line-height:1.2;margin-bottom:1px">${sec}</div>
                   ${room ? `<div style="font-size:7px;color:#666;margin-bottom:1px">${room}</div>` : ''}
                   <div style="font-size:7px;color:#333">${subj}</div>`
                : ''}</td>`;
        });
        rows += '</tr>';
    });
    
    // Get teacher's availability for working hours display
    const teacherAvailability = teacher.availability || {};
    
    // Build working hours display as plain text below the table
    let workingHoursDisplay = '<div style="display:flex;width:100%;margin-top:8px;margin-bottom:8px">';
    workingHoursDisplay += '<div style="width:75px"></div>'; // TIME IN column space
    workingHoursDisplay += '<div style="width:75px"></div>'; // TIME OUT column space
    workingHoursDisplay += '<div style="width:55px"></div>'; // MINUTES column space
    
    daysToShow.forEach(day => {
        const dayAvail = teacherAvailability[day];
        let displayText = "—";
        if (dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
            const timeIn = formatTime12h(dayAvail.timeIn);
            const timeOut = formatTime12h(dayAvail.timeOut);
            displayText = timeIn + " – " + timeOut;
        }
        workingHoursDisplay += `<div style="flex:1;text-align:center;font-size:9px;font-weight:700;color:#8b0000">${displayText}</div>`;
    });
    workingHoursDisplay += '</div>';
 
    const w = window.open('','_blank','width=1200,height=850');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Teacher Schedule - ${teacher.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#fff;color:#000;padding:12mm}
table{border-collapse:collapse;width:100%;table-layout:fixed}
@page{size:A4 landscape;margin:12mm}
@media print{
    body{padding:0}
    .no-print{display:none!important}
}
</style>
</head><body>
${wcHeader()}
<div style="background:#c00;padding:2px;margin-bottom:1px"></div>
<div style="border:1px solid #000;padding:6px;text-align:center;margin-bottom:1px">
    <strong style="font-size:12px;letter-spacing:1px">TEACHERS' SCHEDULE FOR SY ${schoolYear}</strong>
</div>
<div style="border:1px solid #000;border-top:none;padding:6px;text-align:center;margin-bottom:8px">
    <div style="font-size:14px;font-weight:700;text-transform:uppercase">${teacher.name}</div>
    <div style="font-size:10px;margin-top:2px;color:#666">${(function(){
        const curr = window.currentCurriculum || 'new';
        const term = window.currentTerm || '1';
        const sem = window.currentSemester || '1';
        const termNames = {'1':'1st Term','2':'2nd Term','3':'3rd Term'};
        const semNames = {'1':'1st Semester','2':'2nd Semester'};
        return curr === 'new' ? termNames[term] + ' | ' + semNames[sem] : 'Term ' + term + ' | Semester ' + sem;
    })()}</div>
</div>
<table>
    <thead><tr>
        <th style="${TH}width:75px">TIME IN</th>
        <th style="${TH}width:75px">TIME OUT</th>
        <th style="${TH}width:55px">MINUTES</th>
        ${daysToShow.map(d => `<th style="${TH}">${d.toUpperCase()}</th>`).join('')}
    </tr></thead>
    <tbody>${rows}</tbody>
</table>
${workingHoursDisplay}
<div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px;text-transform:uppercase">${teacher.name}</div>
        <div style="font-size:9px;margin-top:4px">Teacher</div>
    </div>
    <div style="width:20%"></div>
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px">MR. DARNIELL C. BALBUENA, Ph.D.</div>
        <div style="font-size:9px;margin-top:4px">School Principal</div>
    </div>
</div>
<button class="no-print" onclick="window.print()" style="background:#8b0000;color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:700;margin-top:20px">🖨 Print / Save as PDF</button>
</body></html>`);
    w.document.close();
}
 
 
// ============================================================
// 10. SECTIONS VIEW + ADD / REMOVE SECTION
// ============================================================
 
function renderSectionView() { switchGradeTab(currentGrade); }
 
function switchGradeTab(grade) {
    currentGrade = grade;
    document.querySelectorAll('.grade-tab').forEach(t =>
        t.classList.toggle('active', parseInt(t.dataset.grade) === grade)
    );
 
    const gradeSections = SECTIONS.filter(s => s.grade === grade);
    const picker = document.getElementById('sectionPicker');
    const currentCurr = window.currentCurriculum || 'new';
    
    // Show/hide G12 curriculum selector
    const g12Selector = document.getElementById('g12CurriculumSelector');
    if (g12Selector) {
        g12Selector.style.display = (grade === 12) ? 'block' : 'none';
    }
    
    // Get G12 curriculum preference (default to 'old')
    const g12Curriculum = window.g12SectionCurriculum || 'old';
 
    if (grade >= 11) {
        // For Grade 11 in new curriculum, OR Grade 12 in new curriculum mode
        if ((grade === 11 && currentCurr === 'new') || (grade === 12 && g12Curriculum === 'new')) {
            // Build a map of elective subtypes to sections
            const subtypeToSections = {};
            const allSubtypes = new Set();
            
            gradeSections.forEach(section => {
                let subtypes = [];
                try {
                    if (section.section_elective_subtypes) {
                        subtypes = JSON.parse(section.section_elective_subtypes);
                    }
                } catch (e) {
                    console.warn('Error parsing subtypes for', section.name, e);
                }
                
                // If section has no subtypes assigned, group it under "Unassigned"
                if (subtypes.length === 0) {
                    subtypes = ['Unassigned'];
                }
                
                subtypes.forEach(subtype => {
                    if (!subtypeToSections[subtype]) {
                        subtypeToSections[subtype] = [];
                    }
                    subtypeToSections[subtype].push(section);
                    allSubtypes.add(subtype);
                });
            });
            
            // Determine which elective type each subtype belongs to
            const getElectiveType = (subtypeName) => {
                if (subtypeName === 'Unassigned') return null;
                
                // Check in academic subtypes
                const academicSubtypes = window.ELECTIVE_SUBTYPES?.academic || [];
                if (academicSubtypes.some(s => s.name === subtypeName)) {
                    return 'academic';
                }
                
                // Check in techpro subtypes
                const techproSubtypes = window.ELECTIVE_SUBTYPES?.techpro || [];
                if (techproSubtypes.some(s => s.name === subtypeName)) {
                    return 'techpro';
                }
                
                return null;
            };
            
            // Group subtypes by elective type
            const academicSubtypes = [];
            const techproSubtypes = [];
            const unassignedSubtypes = [];
            
            Array.from(allSubtypes).forEach(subtype => {
                const type = getElectiveType(subtype);
                if (type === 'academic') {
                    academicSubtypes.push(subtype);
                } else if (type === 'techpro') {
                    techproSubtypes.push(subtype);
                } else {
                    unassignedSubtypes.push(subtype);
                }
            });
            
            let html = '';
            
            // Create a 2-column layout for Academic and TechPro
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">';
            
            // Left column: ACADEMIC section
            html += '<div>';
            if (academicSubtypes.length > 0) {
                html += '<div style="margin-bottom:20px">';
                html += '<div style="font-size:14px;font-weight:800;color:var(--accent);background:rgba(79, 142, 247, 0.15);padding:10px 16px;border-radius:8px;border-left:4px solid var(--accent);margin-bottom:12px;letter-spacing:1px">🎓 ACADEMIC</div>';
                
                academicSubtypes.sort().forEach(subtype => {
                    const sections = subtypeToSections[subtype] || [];
                    html += `<div class="strand-group" style="margin-left:16px;margin-bottom:12px">
                        <div class="strand-label strand-abm">${subtype}</div>
                        <div class="strand-sections">
                            ${sections.map(s => `
                                <div class="sec-btn-wrap" style="display:inline-flex;align-items:center;gap:2px">
                                    <button class="sec-btn ${currentSection === s.id ? 'active' : ''}"
                                        data-id="${s.id}" onclick="selectSection('${s.id}')">${s.section}</button>
                                    <button class="sec-btn-remove" onclick="removeSection('${s.id}','${s.section.replace(/'/g,"\\'")}','${grade}')"
                                        title="Remove section" style="padding:2px 6px;border:1px solid var(--red);border-radius:4px;background:rgba(239,68,68,0.1);color:var(--red);cursor:pointer;font-size:11px;font-weight:700;line-height:1">✕</button>
                                </div>`).join('')}
                        </div>
                    </div>`;
                });
                
                html += '</div>';
            }
            html += '</div>';
            
            // Right column: TECHPRO section
            html += '<div>';
            if (techproSubtypes.length > 0) {
                html += '<div style="margin-bottom:20px">';
                html += '<div style="font-size:14px;font-weight:800;color:var(--purple);background:rgba(124, 93, 232, 0.15);padding:10px 16px;border-radius:8px;border-left:4px solid var(--purple);margin-bottom:12px;letter-spacing:1px">🔧 TECHPRO</div>';
                
                techproSubtypes.sort().forEach(subtype => {
                    const sections = subtypeToSections[subtype] || [];
                    html += `<div class="strand-group" style="margin-left:16px;margin-bottom:12px">
                        <div class="strand-label strand-tvl">${subtype}</div>
                        <div class="strand-sections">
                            ${sections.map(s => `
                                <div class="sec-btn-wrap" style="display:inline-flex;align-items:center;gap:2px">
                                    <button class="sec-btn ${currentSection === s.id ? 'active' : ''}"
                                        data-id="${s.id}" onclick="selectSection('${s.id}')">${s.section}</button>
                                    <button class="sec-btn-remove" onclick="removeSection('${s.id}','${s.section.replace(/'/g,"\\'")}','${grade}')"
                                        title="Remove section" style="padding:2px 6px;border:1px solid var(--red);border-radius:4px;background:rgba(239,68,68,0.1);color:var(--red);cursor:pointer;font-size:11px;font-weight:700;line-height:1">✕</button>
                                </div>`).join('')}
                        </div>
                    </div>`;
                });
                
                html += '</div>';
            }
            html += '</div>';
            
            // Close 2-column grid
            html += '</div>';
            
            // Render Unassigned section (full width below the columns)
            if (unassignedSubtypes.length > 0) {
                unassignedSubtypes.forEach(subtype => {
                    const sections = subtypeToSections[subtype] || [];
                    const badgeClass = 'style="background:var(--text2);color:white"';
                    
                    html += `<div class="strand-group">
                        <div class="strand-label" ${badgeClass}>${subtype}</div>
                        <div class="strand-sections">
                            ${sections.map(s => `
                                <div class="sec-btn-wrap" style="display:inline-flex;align-items:center;gap:2px">
                                    <button class="sec-btn ${currentSection === s.id ? 'active' : ''}"
                                        data-id="${s.id}" onclick="selectSection('${s.id}')">${s.section}</button>
                                    <button class="sec-btn-remove" onclick="removeSection('${s.id}','${s.section.replace(/'/g,"\\'")}','${grade}')"
                                        title="Remove section" style="padding:2px 6px;border:1px solid var(--red);border-radius:4px;background:rgba(239,68,68,0.1);color:var(--red);cursor:pointer;font-size:11px;font-weight:700;line-height:1">✕</button>
                                </div>`).join('')}
                        </div>
                    </div>`;
                });
            }
            
            picker.innerHTML = html;
        } else {
            // For Grade 12 or old curriculum, show traditional strands
            const strands = [...new Set(gradeSections.map(s => s.strand))];
            picker.innerHTML = strands.map(strand => {
                const sec = gradeSections.filter(s => s.strand === strand);
                const cls = {STEM:'strand-stem',ABM:'strand-abm',HUMSS:'strand-humss',TVL:'strand-tvl'}[strand] || '';
                return `<div class="strand-group">
                    <div class="strand-label ${cls}">${strand}</div>
                    <div class="strand-sections">
                        ${sec.map(s => `
                            <div class="sec-btn-wrap" style="display:inline-flex;align-items:center;gap:2px">
                                <button class="sec-btn ${currentSection === s.id ? 'active' : ''}"
                                    data-id="${s.id}" onclick="selectSection('${s.id}')">${s.section}</button>
                                <button class="sec-btn-remove" onclick="removeSection('${s.id}','${s.section.replace(/'/g,"\\'")}','${grade}')"
                                    title="Remove section" style="padding:2px 6px;border:1px solid var(--red);border-radius:4px;background:rgba(239,68,68,0.1);color:var(--red);cursor:pointer;font-size:11px;font-weight:700;line-height:1">✕</button>
                            </div>`).join('')}
                    </div>
                </div>`;
            }).join('');
        }
    } else {
        picker.innerHTML = `<div class="strand-group"><div class="strand-sections">
            ${gradeSections.map(s => `
                <div class="sec-btn-wrap" style="display:inline-flex;align-items:center;gap:2px">
                    <button class="sec-btn ${currentSection === s.id ? 'active' : ''}"
                        data-id="${s.id}" onclick="selectSection('${s.id}')">${s.section}</button>
                    <button class="sec-btn-remove" onclick="removeSection('${s.id}','${s.section.replace(/'/g,"\\'")}','${grade}')"
                        title="Remove section" style="padding:2px 6px;border:1px solid var(--red);border-radius:4px;background:rgba(239,68,68,0.1);color:var(--red);cursor:pointer;font-size:11px;font-weight:700;line-height:1">✕</button>
                </div>`).join('')}
        </div></div>`;
    }
 
    if (!currentSection || !gradeSections.find(s => s.id === currentSection)) {
        if (gradeSections.length) selectSection(gradeSections[0].id);
    } else {
        renderSectionSchedule(currentSection);
    }
    
    // Show/hide edit electives button based on grade
    const editBtn = document.getElementById('editSectionElectivesBtn');
    if (editBtn) {
        editBtn.style.display = (grade === 11 || grade === 12) ? 'block' : 'none';
    }
}
 
function selectSection(sid) {
    currentSection = sid;
    document.querySelectorAll('.sec-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.id === sid)
    );
    renderSectionSchedule(sid);
    
    // Show Edit Section button when a section is selected
    const editBtn = document.getElementById('editSectionBtn');
    if (editBtn) {
        editBtn.style.display = sid ? 'block' : 'none';
    }
}

// Switch Grade 12 curriculum mode
function switchG12Curriculum(curriculum) {
    window.g12SectionCurriculum = curriculum;
    
    // Update radio button state in Sections view
    const radioButtons = document.querySelectorAll('input[name="g12Curriculum"]');
    radioButtons.forEach(radio => {
        radio.checked = radio.value === curriculum;
    });
    
    // Sync with Subjects view curriculum
    window.currentCurriculum = curriculum;
    const subjectsCurrRadios = document.querySelectorAll('input[name="curriculum"]');
    subjectsCurrRadios.forEach(radio => {
        radio.checked = radio.value === curriculum;
    });
    
    // Re-render subjects view if it's active
    if (document.getElementById('view-subjects').classList.contains('active')) {
        filterByCurriculum(curriculum);
    }
    
    // Re-render Grade 12 sections
    if (currentGrade === 12) {
        switchGradeTab(12);
    }
}

// ---- Section Availability Modal ----

function openSectionAvailability() {
    // Build modal only once
    if (!document.getElementById('sectionAvailModal')) {
        const m = document.createElement('div');
        m.id = 'sectionAvailModal';
        m.className = 'modal-overlay hidden';
        m.onclick = function(e){ if(e.target===m) m.classList.add('hidden'); };
        m.innerHTML = '<div class="modal-box" style="max-width:1000px">' +
            '<div class="modal-header"><h3>Set Section Availability (Bulk)</h3><button class="panel-close" onclick="closeSectionAvailability()">X</button></div>' +
            '<div class="modal-body" style="max-height:70vh;overflow-y:auto">' +
                '<div style="margin-bottom:16px">' +
                    '<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px">Select Sections:</div>' +
                    '<div id="sectionCheckboxList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;padding:12px;border-radius:8px;max-height:200px;overflow-y:auto;background:var(--bg2);border:1px solid var(--border)"></div>' +
                    '<div style="margin-top:8px;display:flex;gap:8px">' +
                        '<button class="btn-cancel" onclick="selectAllSections()" style="font-size:11px;padding:6px 12px">Select All</button>' +
                        '<button class="btn-cancel" onclick="deselectAllSections()" style="font-size:11px;padding:6px 12px">Deselect All</button>' +
                        '<button class="btn-cancel" onclick="selectCurrentGradeSections()" style="font-size:11px;padding:6px 12px">Select Current Grade</button>' +
                    '</div>' +
                    '<p style="font-size:11px;color:var(--text2);margin-top:8px">Select one or more sections to set their availability together</p>' +
                '</div>' +
                '<div style="padding:10px;background:var(--bg3);border-radius:8px;border:1px solid var(--border)">' +
                    availabilityCheckboxes('section') +
                '</div>' +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeSectionAvailability()">Cancel</button><button class="btn-confirm" onclick="submitSectionAvailability()">Save Availability</button></div>' +
        '</div>';
        document.body.appendChild(m);
    }
    
    // Grade color mapping for JHS (7-10) and strand colors for SHS (11-12)
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const alphaBg = theme === 'dark' ? 0.4 : 0.15;
    const alphaBorder = theme === 'dark' ? 0.8 : 0.5;
    const gradeColors = {
        7: { bg: `rgba(239, 68, 68, ${alphaBg})`, border: `rgba(239, 68, 68, ${alphaBorder})`, selectedBg: 'rgba(239, 68, 68, 0.9)', selectedBorder: 'rgba(239, 68, 68, 1)' },
        8: { bg: `rgba(249, 115, 22, ${alphaBg})`, border: `rgba(249, 115, 22, ${alphaBorder})`, selectedBg: 'rgba(249, 115, 22, 0.9)', selectedBorder: 'rgba(249, 115, 22, 1)' },
        9: { bg: `rgba(234, 179, 8, ${alphaBg})`, border: `rgba(234, 179, 8, ${alphaBorder})`, selectedBg: 'rgba(234, 179, 8, 0.9)', selectedBorder: 'rgba(234, 179, 8, 1)' },
        10: { bg: `rgba(34, 197, 94, ${alphaBg})`, border: `rgba(34, 197, 94, ${alphaBorder})`, selectedBg: 'rgba(34, 197, 94, 0.9)', selectedBorder: 'rgba(34, 197, 94, 1)' }
    };
    
    const strandColors = {
        'STEM': { bg: `rgba(249, 115, 22, ${alphaBg})`, border: `rgba(249, 115, 22, ${alphaBorder})`, selectedBg: 'rgba(249, 115, 22, 0.9)', selectedBorder: 'rgba(249, 115, 22, 1)' },
        'ABM': { bg: `rgba(59, 130, 246, ${alphaBg})`, border: `rgba(59, 130, 246, ${alphaBorder})`, selectedBg: 'rgba(59, 130, 246, 0.9)', selectedBorder: 'rgba(59, 130, 246, 1)' },
        'HUMSS': { bg: `rgba(168, 85, 247, ${alphaBg})`, border: `rgba(168, 85, 247, ${alphaBorder})`, selectedBg: 'rgba(168, 85, 247, 0.9)', selectedBorder: 'rgba(168, 85, 247, 1)' },
        'TVL': { bg: `rgba(20, 184, 166, ${alphaBg})`, border: `rgba(20, 184, 166, ${alphaBorder})`, selectedBg: 'rgba(20, 184, 166, 0.9)', selectedBorder: 'rgba(20, 184, 166, 1)' }
    };
    
    // Populate section checkboxes grouped by grade
    const checkboxList = document.getElementById('sectionCheckboxList');
    
    // Group sections by grade
    const sectionsByGrade = {};
    SECTIONS.forEach(s => {
        if (!sectionsByGrade[s.grade]) sectionsByGrade[s.grade] = [];
        sectionsByGrade[s.grade].push(s);
    });
    
    // Build HTML with grade divisions
    let html = '';
    [7, 8, 9, 10, 11, 12].forEach(grade => {
        if (!sectionsByGrade[grade]) return;
        
        // Add grade header
        html += `<div style="grid-column:1/-1;padding:8px 0 4px 0;margin-top:${grade > 7 ? '12px' : '0'};border-top:${grade > 7 ? '2px solid var(--border)' : 'none'};font-size:13px;font-weight:700;color:var(--text1)">Grade ${grade}${grade >= 11 ? ' (SHS)' : ''}</div>`;
        
        // Add sections for this grade
        sectionsByGrade[grade].forEach(s => {
            const isSelected = s.id === currentSection;
            // Use strand colors for SHS (11-12), grade colors for JHS (7-10)
            const colors = (s.grade >= 11 && s.strand) 
                ? (strandColors[s.strand] || gradeColors[7])
                : (gradeColors[s.grade] || gradeColors[7]);
            html += `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;padding:6px;border-radius:6px;background:${isSelected ? colors.selectedBg : colors.bg};color:${isSelected ? '#fff' : 'var(--text1)'};border:1px solid ${isSelected ? colors.selectedBorder : colors.border};transition:all 0.2s">
                <input type="checkbox" class="section-select-cb" value="${s.id}" data-grade="${s.grade}" data-strand="${s.strand || ''}" ${isSelected ? 'checked' : ''} style="cursor:pointer" onchange="updateSectionSelectionStyle(this)">
                <span style="flex:1">${s.name}</span>
            </label>`;
        });
    });
    
    checkboxList.innerHTML = html;
    
    // Change container background to match theme
    checkboxList.style.background = 'var(--bg2)';
    checkboxList.style.border = '1px solid var(--border)';
    
    // Load availability from current section if one is selected
    if (currentSection) {
        const section = SECTIONS.find(s => s.id === currentSection);
        if (section) {
            const avail = section.availability || {};
            setAvailCheckboxes('section', avail);
        }
    }
    
    document.getElementById('sectionAvailModal').classList.remove('hidden');
}

function updateSectionSelectionStyle(checkbox) {
    const label = checkbox.parentElement;
    const grade = parseInt(checkbox.dataset.grade);
    const strand = checkbox.dataset.strand;
    
    const gradeColors = {
        7: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', selectedBg: 'rgba(239, 68, 68, 0.9)', selectedBorder: 'rgba(239, 68, 68, 1)' },
        8: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.5)', selectedBg: 'rgba(249, 115, 22, 0.9)', selectedBorder: 'rgba(249, 115, 22, 1)' },
        9: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.5)', selectedBg: 'rgba(234, 179, 8, 0.9)', selectedBorder: 'rgba(234, 179, 8, 1)' },
        10: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.5)', selectedBg: 'rgba(34, 197, 94, 0.9)', selectedBorder: 'rgba(34, 197, 94, 1)' }
    };
    
    const strandColors = {
        'STEM': { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.5)', selectedBg: 'rgba(249, 115, 22, 0.9)', selectedBorder: 'rgba(249, 115, 22, 1)' },
        'ABM': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.5)', selectedBg: 'rgba(59, 130, 246, 0.9)', selectedBorder: 'rgba(59, 130, 246, 1)' },
        'HUMSS': { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.5)', selectedBg: 'rgba(168, 85, 247, 0.9)', selectedBorder: 'rgba(168, 85, 247, 1)' },
        'TVL': { bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.5)', selectedBg: 'rgba(20, 184, 166, 0.9)', selectedBorder: 'rgba(20, 184, 166, 1)' }
    };
    
    // Use strand colors for SHS (11-12), grade colors for JHS (7-10)
    const colors = (grade >= 11 && strand) 
        ? (strandColors[strand] || gradeColors[7])
        : (gradeColors[grade] || gradeColors[7]);
    
    if (checkbox.checked) {
        label.style.background = colors.selectedBg;
        label.style.color = '#fff';
        label.style.borderColor = colors.selectedBorder;
    } else {
        label.style.background = colors.bg;
        label.style.color = 'var(--text1)';
        label.style.borderColor = colors.border;
    }
}

function selectAllSections() {
    document.querySelectorAll('.section-select-cb').forEach(cb => {
        cb.checked = true;
        updateSectionSelectionStyle(cb);
    });
}

function deselectAllSections() {
    document.querySelectorAll('.section-select-cb').forEach(cb => {
        cb.checked = false;
        updateSectionSelectionStyle(cb);
    });
}

function selectCurrentGradeSections() {
    document.querySelectorAll('.section-select-cb').forEach(cb => {
        const section = SECTIONS.find(s => s.id === cb.value);
        if (section && section.grade === currentGrade) {
            cb.checked = true;
        } else {
            cb.checked = false;
        }
        updateSectionSelectionStyle(cb);
    });
}

function closeSectionAvailability() {
    document.getElementById('sectionAvailModal').classList.add('hidden');
}

async function submitSectionAvailability() {
    // Get all selected sections
    const selectedSections = Array.from(document.querySelectorAll('.section-select-cb:checked')).map(cb => cb.value);
    
    if (selectedSections.length === 0) {
        showToast('Please select at least one section', 'error');
        return;
    }
    
    // Collect availability data
    const availability = {};
    document.querySelectorAll('[data-section-avail]').forEach(cb => {
        if (cb.checked) {
            const day = cb.dataset.day;
            const slot = cb.dataset.slot;
            if (!availability[day]) availability[day] = {};
            availability[day][slot] = true;
        }
    });
    
    // Save availability for all selected sections
    let successCount = 0;
    let failCount = 0;
    
    for (const sid of selectedSections) {
        const result = await apiFetch(API.sections, {
            method: 'PUT',
            body: JSON.stringify({ id: sid, availability })
        });
        
        if (result?.success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    if (failCount === 0) {
        showToast(`✓ Availability saved for ${successCount} section(s)`, 'success');
        closeSectionAvailability();
        await loadSectionsFromDB();
    } else {
        showToast(`⚠ Saved ${successCount}, failed ${failCount}`, 'error');
    }
}

// ---- Room Availability Modal ----

function openRoomAvailability() {
    // Build modal only once
    if (!document.getElementById('roomAvailModal')) {
        const m = document.createElement('div');
        m.id = 'roomAvailModal';
        m.className = 'modal-overlay hidden';
        m.onclick = function(e){ if(e.target===m) m.classList.add('hidden'); };
        m.innerHTML = '<div class="modal-box" style="max-width:1200px">' +
            '<div class="modal-header"><h3>Room Availability</h3><button class="panel-close" onclick="closeRoomAvailability()">X</button></div>' +
            '<div class="modal-body" style="max-height:70vh;overflow-y:auto">' +
                '<p style="font-size:12px;color:var(--text2);margin-bottom:16px">Assign rooms to sections. Only sections with availability set are shown.</p>' +
                '<div id="roomAvailabilityList"></div>' +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeRoomAvailability()">Cancel</button><button class="btn-confirm" onclick="submitRoomAvailability()">Save Rooms</button></div>' +
        '</div>';
        document.body.appendChild(m);
    }
    
    // Grade color mapping for JHS (7-10) and strand colors for SHS (11-12)
    const gradeColors = {
        7: '#ef4444',   // Red
        8: '#f97316',   // Orange
        9: '#eab308',   // Yellow
        10: '#22c55e'   // Green
    };
    
    const strandColors = {
        'STEM': '#f97316',   // Orange
        'ABM': '#3b82f6',    // Blue
        'HUMSS': '#a855f7',  // Purple
        'TVL': '#14b8a6'     // Teal
    };
    
    // Get sections with availability and group by grade
    const sectionsByGrade = {};
    SECTIONS.forEach(s => {
        const avail = s.availability || {};
        const hasAvailability = Object.keys(avail).length > 0;
        
        if (hasAvailability) {
            if (!sectionsByGrade[s.grade]) sectionsByGrade[s.grade] = [];
            sectionsByGrade[s.grade].push(s);
        }
    });
    
    // Build HTML with grade divisions
    let html = '';
    [7, 8, 9, 10, 11, 12].forEach(grade => {
        if (!sectionsByGrade[grade]) return;
        
        // Add grade header
        html += `<div style="padding:12px 0 8px 0;margin-top:${grade > 7 ? '20px' : '0'};border-top:${grade > 7 ? '2px solid #ddd' : 'none'};font-size:14px;font-weight:700;color:var(--text1)">Grade ${grade}${grade >= 11 ? ' (SHS)' : ''}</div>`;
        
        // Add sections for this grade
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:12px;margin-top:8px">';
        
        sectionsByGrade[grade].forEach(s => {
            // Get color based on grade or strand
            const color = (s.grade >= 11 && s.strand) 
                ? (strandColors[s.strand] || gradeColors[7])
                : (gradeColors[s.grade] || gradeColors[7]);
            
            // Get available days
            const avail = s.availability || {};
            const availDays = Object.keys(avail).filter(day => {
                const slots = avail[day];
                return slots && Object.keys(slots).length > 0;
            });
            
            html += `<div style="border:2px solid ${color};border-radius:8px;padding:12px;background:var(--bg1)">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <div style="width:4px;height:40px;background:${color};border-radius:2px"></div>
                    <div style="flex:1">
                        <div style="font-size:13px;font-weight:700;color:var(--text1)">${s.name}</div>
                        <div style="font-size:11px;color:var(--text2);margin-top:2px">
                            ${availDays.length > 0 ? '📅 ' + availDays.join(', ') : 'No availability set'}
                        </div>
                    </div>
                </div>
                <div style="position:relative">
                    <input type="text" class="form-input room-input" data-section-id="${s.id}" value="${s.room || ''}" placeholder="Enter room number or type to search..." style="width:100%;font-size:12px" 
                           onkeydown="handleRoomInputKeydown(event, this)" 
                           oninput="showRoomSuggestions(this)" 
                           onfocus="showRoomSuggestions(this)"
                           onblur="hideRoomSuggestions(this)">
                    <div class="room-suggestions" data-section-id="${s.id}" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg1);border:1px solid var(--border);border-top:none;border-radius:0 0 4px 4px;max-height:200px;overflow-y:auto;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,0.1)"></div>
                </div>
            </div>`;
        });
        
        html += '</div>';
    });
    
    if (html === '') {
        html = '<div style="text-align:center;padding:40px;color:var(--text2)">No sections with availability set. Please set section availability first.</div>';
    }
    
    document.getElementById('roomAvailabilityList').innerHTML = html;
    document.getElementById('roomAvailModal').classList.remove('hidden');
}

function closeRoomAvailability() {
    document.getElementById('roomAvailModal').classList.add('hidden');
}

// Predefined room list
const PREDEFINED_ROOMS = [
    'JHS ANNEX 201', 'JHS ANNEX 202', 'JHS ANNEX 203', 'JHS ANNEX 204',
    'JHS ANNEX 101', 'JHS ANNEX 102', 'JHS ADMIN 101', 'JHS ADMIN 102',
    'JHS ADMIN 103', 'JHS ADMIN 104', 'JHS ADMIN 105', 'JHS ADMIN 106',
    'SHS BLDG 101', 'SHS BLDG 102', 'SHS BLDG 103', 'SHS BLDG 104',
    'SHS BLDG 105', 'SHS BLDG 106', 'SHS BLDG 107', 'SHS BLDG 108',
    'SHS BLDG 109', 'SHS BLDG 110', 'SHS BLDG 111', 'SHS BLDG 201',
    'SHS BLDG 202', 'SHS BLDG 203', 'SHS BLDG 204', 'SHS BLDG 205',
    'SHS BLDG 206', 'SHS BLDG 207', 'SHS BLDG 208', 'SHS BLDG 209',
    'SHS BLDG 210', 'SHS BLDG 211', 'SHS BLDG 212', 'SHS BLDG 213', 'SHS BLDG 214'
];

// Show room suggestions based on input
function showRoomSuggestions(input) {
    const sectionId = input.dataset.sectionId;
    const suggestionsDiv = document.querySelector(`.room-suggestions[data-section-id="${sectionId}"]`);
    const query = input.value.toLowerCase().trim();
    
    if (!suggestionsDiv) return;
    
    // Filter rooms based on input
    const matches = PREDEFINED_ROOMS.filter(room => 
        room.toLowerCase().includes(query)
    );
    
    if (matches.length === 0 || (matches.length === 1 && matches[0].toLowerCase() === query)) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    // Build suggestions HTML
    let html = '';
    matches.slice(0, 8).forEach(room => { // Limit to 8 suggestions
        html += `<div class="room-suggestion" onclick="selectRoomSuggestion('${sectionId}', '${room}')" 
                     style="padding:8px 12px;cursor:pointer;font-size:12px;border-bottom:1px solid var(--border);color:var(--text1);background:var(--bg1)"
                     onmouseover="this.style.background='var(--bg2)'" 
                     onmouseout="this.style.background='var(--bg1)'">${room}</div>`;
    });
    
    suggestionsDiv.innerHTML = html;
    suggestionsDiv.style.display = 'block';
}

// Select a room suggestion
function selectRoomSuggestion(sectionId, room) {
    const input = document.querySelector(`.room-input[data-section-id="${sectionId}"]`);
    const suggestionsDiv = document.querySelector(`.room-suggestions[data-section-id="${sectionId}"]`);
    
    if (input) {
        input.value = room;
        input.focus();
    }
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

// Hide room suggestions
function hideRoomSuggestions(input) {
    setTimeout(() => { // Delay to allow click on suggestion
        const sectionId = input.dataset.sectionId;
        const suggestionsDiv = document.querySelector(`.room-suggestions[data-section-id="${sectionId}"]`);
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'none';
        }
    }, 150);
}

// Handle keyboard navigation in room input
function handleRoomInputKeydown(event, input) {
    if (event.key === 'Enter') {
        submitRoomAvailability();
        return;
    }
    
    const sectionId = input.dataset.sectionId;
    const suggestionsDiv = document.querySelector(`.room-suggestions[data-section-id="${sectionId}"]`);
    
    if (!suggestionsDiv || suggestionsDiv.style.display === 'none') return;
    
    const suggestions = suggestionsDiv.querySelectorAll('.room-suggestion');
    let currentIndex = -1;
    
    // Find currently highlighted suggestion
    suggestions.forEach((suggestion, index) => {
        if (suggestion.style.background === 'rgb(59, 130, 246)' || suggestion.style.background === '#3b82f6') {
            currentIndex = index;
        }
    });
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        currentIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        highlightSuggestion(suggestions, currentIndex);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        highlightSuggestion(suggestions, currentIndex);
    } else if (event.key === 'Enter' && currentIndex >= 0) {
        event.preventDefault();
        suggestions[currentIndex].click();
    } else if (event.key === 'Escape') {
        suggestionsDiv.style.display = 'none';
    }
}

// Highlight a suggestion
function highlightSuggestion(suggestions, index) {
    suggestions.forEach((suggestion, i) => {
        if (i === index) {
            suggestion.style.background = '#3b82f6';
            suggestion.style.color = '#fff';
        } else {
            suggestion.style.background = 'var(--bg1)';
            suggestion.style.color = 'var(--text1)';
        }
    });
}

async function submitRoomAvailability() {
    const roomInputs = document.querySelectorAll('.room-input');
    let successCount = 0;
    let failCount = 0;
    
    for (const input of roomInputs) {
        const sectionId = input.dataset.sectionId;
        const room = input.value.trim();
        
        const result = await apiFetch(API.sections, {
            method: 'PUT',
            body: JSON.stringify({ id: sectionId, room })
        });
        
        if (result?.success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    if (failCount === 0) {
        showToast(`✓ Rooms saved for ${successCount} section(s)`, 'success');
        closeRoomAvailability();
        await loadSectionsFromDB();
    } else {
        showToast(`⚠ Saved ${successCount}, failed ${failCount}`, 'error');
    }
}
 
// ---- Add Section Modal ----
 
function openAddSection() {
    if (!document.getElementById('addSectionModal')) { ensureModal('addSectionModal',
        '<div class="modal-header"><h3>Add New Section</h3><button class="panel-close" onclick="closeAddSection()">X</button></div>' +
        '<div class="modal-body">' +
            '<label class="form-label">Section Name</label>' +
            '<input type="text" id="newSectionName" class="form-input" placeholder="e.g. VIOLET or NEWTON" onkeydown="if(event.key===\'Enter\')submitAddSection()">' +
            '<p class="form-hint">Just the section name - grade and strand added automatically</p>' +
            '<label class="form-label" style="margin-top:8px">Grade Level</label>' +
            '<select id="newSectionGrade" class="form-input" onchange="updateStrandVisibility()">' +
                '<option value="7">Grade 7</option><option value="8">Grade 8</option>' +
                '<option value="9">Grade 9</option><option value="10">Grade 10</option>' +
                '<option value="11">Grade 11 (SHS)</option><option value="12">Grade 12 (SHS)</option>' +
            '</select>' +
            '<div id="strandRow" style="display:none;flex-direction:column;gap:6px;margin-top:8px">' +
                '<label class="form-label">Strand</label>' +
                '<select id="newSectionStrand" class="form-input">' +
                    '<option value="">-- Select Strand --</option>' +
                    '<option value="ABM">ABM</option><option value="HUMSS">HUMSS</option>' +
                    '<option value="STEM">STEM</option><option value="TVL">TVL</option>' +
                '</select>' +
            '</div>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn-cancel" onclick="closeAddSection()">Cancel</button><button class="btn-confirm" onclick="submitAddSection()">Add Section</button></div>'
    ); }
    document.getElementById('newSectionName').value   = '';
    document.getElementById('newSectionGrade').value  = currentGrade;
    document.getElementById('newSectionStrand').value = '';
    updateStrandVisibility();
    document.getElementById('addSectionModal').classList.remove('hidden');
    setTimeout(function(){ document.getElementById('newSectionName').focus(); }, 50);
}
 
function closeAddSection() {
    var m = document.getElementById('addSectionModal');
    if (m) m.classList.add('hidden');
}
 
function updateStrandVisibility() {
    const grade = parseInt(document.getElementById('newSectionGrade').value);
    const strandRow = document.getElementById('strandRow');
    if (strandRow) strandRow.style.display = grade >= 11 ? 'flex' : 'none';
}
 
async function submitAddSection() {
    const name   = document.getElementById('newSectionName').value.trim().toUpperCase();
    const grade  = parseInt(document.getElementById('newSectionGrade').value);
    const strand = document.getElementById('newSectionStrand').value.trim().toUpperCase();
 
    if (!name)  { showToast('Enter a section name', 'error'); return; }
    if (!grade) { showToast('Select a grade level', 'error'); return; }
    if (grade >= 11 && !strand) { showToast('Select a strand for SHS', 'error'); return; }
 
    const res = await apiFetch(API.sections, {
        method: 'POST',
        body: JSON.stringify({ name, grade, strand }),
    });
 
    if (res?.success) {
        closeAddSection();
        await loadSectionsFromDB();
        currentGrade = grade;
        switchGradeTab(grade);
        showToast('✓ Section added', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}

async function removeSection(sid, name, grade) {
    if (!confirm(`Remove section "${name}"? This will also delete all its schedule assignments.`)) return;
 
    const res = await apiFetch(API.sections + '?id=' + encodeURIComponent(sid), { method: 'DELETE' });
    if (res?.success) {
        // Remove from local cache
        Object.keys(scheduleCache).forEach(tid => {
            DAYS.forEach(day => {
                PERIOD_SLOTS.forEach(slot => {
                    if (scheduleCache[tid]?.[day]?.[slot]?.section === sid) {
                        scheduleCache[tid][day][slot] = { section: '', subject: '' };
                    }
                });
            });
        });
        if (currentSection === sid) currentSection = null;
        await loadSectionsFromDB();
        switchGradeTab(parseInt(grade));
        showToast('✓ Section removed', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}

// ---- Edit Section Modal ----

function openEditSection() {
    if (!currentSection) {
        showToast('Please select a section first', 'error');
        return;
    }
    
    const section = SECTIONS.find(s => s.id === currentSection);
    if (!section) {
        showToast('Section not found', 'error');
        return;
    }
    
    if (!document.getElementById('editSectionModal')) { 
        ensureModal('editSectionModal',
            '<div class="modal-header"><h3>Edit Section</h3><button class="panel-close" onclick="closeEditSection()">X</button></div>' +
            '<div class="modal-body">' +
                '<label class="form-label">Section Name</label>' +
                '<input type="text" id="editSectionName" class="form-input" placeholder="e.g. VIOLET or NEWTON" onkeydown="if(event.key===\'Enter\')submitEditSection()">' +
                '<p class="form-hint">Just the section name - grade and strand added automatically</p>' +
                '<label class="form-label" style="margin-top:8px">Grade Level</label>' +
                '<input type="text" id="editSectionGrade" class="form-input" disabled style="background:var(--bg3);cursor:not-allowed">' +
                '<p class="form-hint" style="font-size:11px;color:var(--text2)">Grade level cannot be changed</p>' +
                '<div id="editStrandRow" style="display:none;flex-direction:column;gap:6px;margin-top:8px">' +
                    '<label class="form-label">Strand</label>' +
                    '<select id="editSectionStrand" class="form-input">' +
                        '<option value="">-- Select Strand --</option>' +
                        '<option value="ABM">ABM</option><option value="HUMSS">HUMSS</option>' +
                        '<option value="STEM">STEM</option><option value="TVL">TVL</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeEditSection()">Cancel</button><button class="btn-confirm" onclick="submitEditSection()">Save Changes</button></div>'
        ); 
    }
    
    document.getElementById('editSectionName').value = section.section;
    document.getElementById('editSectionGrade').value = `Grade ${section.grade}${section.grade >= 11 ? ' (SHS)' : ''}`;
    
    const editStrandRow = document.getElementById('editStrandRow');
    if (editStrandRow) {
        editStrandRow.style.display = section.grade >= 11 ? 'flex' : 'none';
    }
    
    if (section.grade >= 11) {
        document.getElementById('editSectionStrand').value = section.strand || '';
    }
    
    document.getElementById('editSectionModal').classList.remove('hidden');
    setTimeout(function(){ document.getElementById('editSectionName').focus(); }, 50);
}

function closeEditSection() {
    var m = document.getElementById('editSectionModal');
    if (m) m.classList.add('hidden');
}

async function submitEditSection() {
    if (!currentSection) {
        showToast('No section selected', 'error');
        return;
    }
    
    const section = SECTIONS.find(s => s.id === currentSection);
    if (!section) {
        showToast('Section not found', 'error');
        return;
    }
    
    const name = document.getElementById('editSectionName').value.trim().toUpperCase();
    const strand = section.grade >= 11 ? document.getElementById('editSectionStrand').value.trim().toUpperCase() : section.strand;
    
    if (!name) { 
        showToast('Enter a section name', 'error'); 
        return; 
    }
    
    if (section.grade >= 11 && !strand) { 
        showToast('Select a strand for SHS', 'error'); 
        return; 
    }
    
    const res = await apiFetch(API.sections, {
        method: 'PUT',
        body: JSON.stringify({ 
            id: currentSection, 
            name: name, 
            strand: strand 
        }),
    });
    
    if (res?.success) {
        closeEditSection();
        
        // Update currentSection if ID changed
        if (res.newId && res.newId !== currentSection) {
            currentSection = res.newId;
        }
        
        await loadSectionsFromDB();
        switchGradeTab(section.grade);
        showToast('✓ Section updated', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed to update section'), 'error');
    }
}

async function openEditSectionElectivesModal() {
    if (!window.ELECTIVE_SUBTYPES) {
        showToast('Elective subtypes not loaded', 'error');
        return;
    }

    const g11Sections = SECTIONS.filter(s => s.grade === 11);
    const g12Sections = SECTIONS.filter(s => s.grade === 12);

    if (g11Sections.length === 0 && g12Sections.length === 0) {
        showToast('No SHS sections found', 'error');
        return;
    }

    const noElectives = (window.ELECTIVE_SUBTYPES.academic?.length ?? 0) === 0 && 
                        (window.ELECTIVE_SUBTYPES.techpro?.length ?? 0) === 0;

    // Update modal title
    const modalTitle = document.querySelector('#editSectionElectivesModal .modal-title');
    if (modalTitle) modalTitle.textContent = '⚙ Edit SHS Section Electives';
    const modalSub = document.querySelector('#editSectionElectivesModal .modal-sub');
    if (modalSub) modalSub.textContent = 'Assign elective subtypes to Grade 11 and Grade 12 sections';

    let html = '';

    if (noElectives) {
        html = `<div style="padding:20px;background:var(--bg2);border-radius:8px;color:var(--text2);text-align:center">
            No elective subtypes defined. Create them in the Subjects view.
        </div>`;
    } else {
        // Grade tabs
        html += `<div style="display:flex;gap:8px;margin-bottom:20px;border-bottom:2px solid var(--border);padding-bottom:0">
            <button id="electiveTabG11" onclick="switchElectiveTab(11)" style="padding:10px 24px;border:none;border-bottom:3px solid var(--accent);background:transparent;color:var(--accent);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:-2px">Grade 11</button>
            <button id="electiveTabG12" onclick="switchElectiveTab(12)" style="padding:10px 24px;border:none;border-bottom:3px solid transparent;background:transparent;color:var(--text2);font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:-2px">Grade 12</button>
        </div>`;

        // Grade 11 panel
        html += `<div id="electivePanelG11">`;
        if (g11Sections.length === 0) {
            html += `<div style="padding:20px;color:var(--text2);text-align:center">No Grade 11 sections found.</div>`;
        } else {
            if (window.ELECTIVE_SUBTYPES.academic?.length > 0) html += buildElectiveTypeSection('Academic', 'academic', g11Sections);
            if (window.ELECTIVE_SUBTYPES.techpro?.length > 0)  html += buildElectiveTypeSection('TechPro',  'techpro',  g11Sections);
            html += buildOrphanedSection(g11Sections, 11);
            html += buildUnassignedSection(g11Sections);
        }
        html += `</div>`;

        // Grade 12 panel (hidden by default)
        html += `<div id="electivePanelG12" style="display:none">`;
        if (g12Sections.length === 0) {
            html += `<div style="padding:20px;color:var(--text2);text-align:center">No Grade 12 sections found.</div>`;
        } else {
            if (window.ELECTIVE_SUBTYPES.academic?.length > 0) html += buildElectiveTypeSection('Academic', 'academic', g12Sections);
            if (window.ELECTIVE_SUBTYPES.techpro?.length > 0)  html += buildElectiveTypeSection('TechPro',  'techpro',  g12Sections);
            html += buildOrphanedSection(g12Sections, 12);
            html += buildUnassignedSection(g12Sections);
        }
        html += `</div>`;
    }

    document.getElementById('editSectionElectivesContent').innerHTML = html;
    document.getElementById('editSectionElectivesModal').classList.remove('hidden');
}

function switchElectiveTab(grade) {
    const g11Panel = document.getElementById('electivePanelG11');
    const g12Panel = document.getElementById('electivePanelG12');
    const g11Tab   = document.getElementById('electiveTabG11');
    const g12Tab   = document.getElementById('electiveTabG12');
    if (!g11Panel || !g12Panel) return;

    if (grade === 11) {
        g11Panel.style.display = '';
        g12Panel.style.display = 'none';
        g11Tab.style.borderBottomColor = 'var(--accent)';
        g11Tab.style.color = 'var(--accent)';
        g11Tab.style.fontWeight = '700';
        g12Tab.style.borderBottomColor = 'transparent';
        g12Tab.style.color = 'var(--text2)';
        g12Tab.style.fontWeight = '600';
    } else {
        g11Panel.style.display = 'none';
        g12Panel.style.display = '';
        g12Tab.style.borderBottomColor = 'var(--accent)';
        g12Tab.style.color = 'var(--accent)';
        g12Tab.style.fontWeight = '700';
        g11Tab.style.borderBottomColor = 'transparent';
        g11Tab.style.color = 'var(--text2)';
        g11Tab.style.fontWeight = '600';
    }
}

function buildElectiveTypeSection(typeName, electiveType, allSections) {
    const subtypes = window.ELECTIVE_SUBTYPES[electiveType] || [];
    
    if (subtypes.length === 0) {
        return '';
    }
    
    const typeColor = electiveType === 'academic' ? 'var(--accent)' : 'var(--purple)';
    const typeBg = electiveType === 'academic' ? 'rgba(79, 142, 247, 0.1)' : 'rgba(124, 93, 232, 0.1)';
    
    let html = `<div style="margin-bottom:24px;border:2px solid ${typeColor};border-radius:12px;overflow:hidden;background:var(--bg2)">
        <div style="padding:16px 20px;background:${typeBg};border-bottom:2px solid ${typeColor}">
            <div style="font-size:18px;font-weight:800;color:${typeColor};text-transform:uppercase;letter-spacing:1px">${typeName}</div>
        </div>
        <div style="padding:16px;">`;
    
    // For each subtype, show sections assigned to it
    subtypes.forEach((subtype, idx) => {
        // Find sections assigned to this subtype
        const assignedSections = allSections.filter(section => {
            let selectedSubtypes = [];
            try {
                const rawValue = section.section_elective_subtypes;
                if (rawValue) {
                    selectedSubtypes = Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue);
                }
            } catch (e) {}
            return selectedSubtypes.includes(subtype.name);
        });
        
        console.log(`Subtype ${subtype.name} has ${assignedSections.length} sections:`, assignedSections.map(s => s.name));
        
        const subtypeBg = idx % 2 === 0 ? 'var(--bg3)' : 'var(--bg2)';
        
        html += `<div style="margin-bottom:12px;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:${subtypeBg}">
            <div style="padding:12px 16px;background:var(--bg3);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
                <div style="font-weight:700;font-size:14px;color:var(--text)">${subtype.name}</div>
                <div style="font-size:11px;color:var(--text2);font-weight:600">${assignedSections.length} section${assignedSections.length !== 1 ? 's' : ''}</div>
            </div>
            <div style="padding:12px 16px;">`;
        
        if (assignedSections.length === 0) {
            html += `<div style="color:var(--text2);font-size:12px;font-style:italic;padding:8px 0">No sections assigned</div>`;
        } else {
            html += `<div style="display:flex;flex-wrap:wrap;gap:8px;">`;
            assignedSections.forEach(section => {
                const strandColor = {ABM: 'strand-abm', HUMSS: 'strand-humss', TVL: 'strand-tvl', STEM: 'strand-stem'}[section.strand] || '';
                html += `<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px">
                    <span class="strand-badge ${strandColor}" style="font-size:10px;padding:2px 6px">${section.strand || 'N/A'}</span>
                    <span style="font-weight:600;font-size:12px;color:var(--text)">${section.section}</span>
                    <button onclick="unassignSectionElective('${section.id}')" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-size:14px;padding:0 4px;line-height:1" title="Remove assignment">✕</button>
                </div>`;
            });
            html += `</div>`;
        }
        
        html += `</div></div>`;
    });
    
    html += `</div></div>`;
    
    return html;
}

function buildOrphanedSection(allSections, grade) {
    // Get all valid subtype names for this grade
    const validSubtypes = new Set();
    if (window.ELECTIVE_SUBTYPES) {
        (window.ELECTIVE_SUBTYPES.academic || []).forEach(s => {
            if (s.grade === grade.toString() || s.grade === 'both') {
                validSubtypes.add(s.name);
            }
        });
        (window.ELECTIVE_SUBTYPES.techpro || []).forEach(s => {
            if (s.grade === grade.toString() || s.grade === 'both') {
                validSubtypes.add(s.name);
            }
        });
    }
    
    // Find sections with invalid/deleted elective subtypes
    const orphanedSections = allSections.filter(section => {
        let selectedSubtypes = [];
        try {
            const raw = section.section_elective_subtypes;
            if (raw) {
                selectedSubtypes = Array.isArray(raw) ? raw : JSON.parse(raw);
            }
        } catch (e) {}
        
        // Check if any assigned subtype is no longer valid
        return selectedSubtypes.length > 0 && selectedSubtypes.some(st => !validSubtypes.has(st));
    });
    
    if (orphanedSections.length === 0) {
        return '';
    }
    
    let html = `<div style="margin-bottom:24px;border:2px solid var(--red);border-radius:12px;overflow:hidden;background:var(--bg2)">
        <div style="padding:16px 20px;background:rgba(239, 68, 68, 0.1);border-bottom:2px solid var(--red)">
            <div style="font-size:18px;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:1px">🚨 Orphaned Sections</div>
            <div style="font-size:12px;color:var(--text2);margin-top:4px">These sections are assigned to deleted or invalid elective subtypes</div>
        </div>
        <div style="padding:16px;">`;
    
    // Group orphaned by strand
    const groupedByStrand = {};
    orphanedSections.forEach(section => {
        const strand = section.strand || 'OTHER';
        if (!groupedByStrand[strand]) {
            groupedByStrand[strand] = [];
        }
        groupedByStrand[strand].push(section);
    });
    
    Object.keys(groupedByStrand).sort().forEach(strand => {
        const sections = groupedByStrand[strand];
        const strandColor = {ABM: 'strand-abm', HUMSS: 'strand-humss', TVL: 'strand-tvl', STEM: 'strand-stem'}[strand] || '';
        
        // Determine which elective type this section should use based on strand
        const electiveType = (strand === 'ABM' || strand === 'HUMSS') ? 'academic' : 'techpro';
        const electiveLabel = electiveType === 'academic' ? 'ACADEMIC' : 'TECHPRO';
        const electiveLabelColor = electiveType === 'academic' ? 'var(--accent)' : 'var(--purple)';
        const electiveLabelBg = electiveType === 'academic' ? 'rgba(79, 142, 247, 0.15)' : 'rgba(124, 93, 232, 0.15)';
        const subtypes = (window.ELECTIVE_SUBTYPES[electiveType] || []).filter(s => 
            s.grade === grade.toString() || s.grade === 'both'
        );
        
        html += `<div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span class="strand-badge ${strandColor}" style="font-size:11px;padding:4px 10px">${strand}</span>
                <span style="font-size:11px;color:var(--text2);font-weight:600">${sections.length} section${sections.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">`;
        
        sections.forEach(section => {
            let selectedSubtypes = [];
            try {
                const raw = section.section_elective_subtypes;
                if (raw) {
                    selectedSubtypes = Array.isArray(raw) ? raw : JSON.parse(raw);
                }
            } catch (e) {}
            
            const invalidSubtypes = selectedSubtypes.filter(st => !validSubtypes.has(st));
            
            html += `<div style="padding:12px;background:var(--bg3);border:2px solid var(--red);border-radius:8px">
                <div style="font-weight:600;font-size:13px;color:var(--text);margin-bottom:8px">${section.section}</div>
                
                <div style="margin-bottom:8px">
                    <div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:4px">INVALID SUBTYPES:</div>`;
            
            invalidSubtypes.forEach(st => {
                html += `<div style="display:inline-block;font-size:11px;font-weight:600;color:var(--red);background:rgba(239, 68, 68, 0.15);padding:3px 8px;border-radius:4px;margin:2px;text-decoration:line-through">${st}</div>`;
            });
            
            html += `</div>
                
                <div style="display:inline-block;font-size:10px;font-weight:800;color:${electiveLabelColor};background:${electiveLabelBg};padding:4px 8px;border-radius:4px;margin-bottom:8px;letter-spacing:0.5px">${electiveLabel}</div>
                
                <div style="font-size:11px;color:var(--text2);margin-bottom:6px;font-weight:600">Reassign to:</div>`;
            
            if (subtypes.length === 0) {
                html += `<div style="color:var(--text2);font-size:11px;font-style:italic">No valid subtypes available</div>`;
            } else {
                subtypes.forEach(subtype => {
                    html += `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;font-size:12px">
                        <input type="radio" name="section-orphan-${section.id}" class="section-orphan-radio" data-section-id="${section.id}" value="${subtype.name}" style="cursor:pointer;width:14px;height:14px">
                        <span style="color:var(--text1)">${subtype.name}</span>
                    </label>`;
                });
            }
            
            html += `<button onclick="clearOrphanedSection('${section.id}')" style="margin-top:8px;width:100%;padding:6px;background:var(--red);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">Clear Invalid Subtypes</button>`;
            html += `</div>`;
        });
        
        html += `</div></div>`;
    });
    
    html += `</div></div>`;
    
    return html;
}

function buildUnassignedSection(allSections) {
    // Find sections with no elective subtype assigned
    const unassignedSections = allSections.filter(section => {
        let selectedSubtypes = [];
        try {
            const raw = section.section_elective_subtypes;
            if (raw) {
                selectedSubtypes = Array.isArray(raw) ? raw : JSON.parse(raw);
            }
        } catch (e) {}
        return selectedSubtypes.length === 0;
    });
    
    if (unassignedSections.length === 0) {
        return '';
    }
    
    let html = `<div style="margin-bottom:24px;border:2px solid var(--orange);border-radius:12px;overflow:hidden;background:var(--bg2)">
        <div style="padding:16px 20px;background:rgba(249, 115, 22, 0.1);border-bottom:2px solid var(--orange)">
            <div style="font-size:18px;font-weight:800;color:var(--orange);text-transform:uppercase;letter-spacing:1px">⚠ Unassigned Sections</div>
            <div style="font-size:12px;color:var(--text2);margin-top:4px">These sections need to be assigned to an elective subtype</div>
        </div>
        <div style="padding:16px;">`;
    
    // Group unassigned by strand
    const groupedByStrand = {};
    unassignedSections.forEach(section => {
        const strand = section.strand || 'OTHER';
        if (!groupedByStrand[strand]) {
            groupedByStrand[strand] = [];
        }
        groupedByStrand[strand].push(section);
    });
    
    Object.keys(groupedByStrand).sort().forEach(strand => {
        const sections = groupedByStrand[strand];
        const strandColor = {ABM: 'strand-abm', HUMSS: 'strand-humss', TVL: 'strand-tvl', STEM: 'strand-stem'}[strand] || '';
        
        // Determine which elective type this section should use based on strand
        const electiveType = (strand === 'ABM' || strand === 'HUMSS') ? 'academic' : 'techpro';
        const electiveLabel = electiveType === 'academic' ? 'ACADEMIC' : 'TECHPRO';
        const electiveLabelColor = electiveType === 'academic' ? 'var(--accent)' : 'var(--purple)';
        const electiveLabelBg = electiveType === 'academic' ? 'rgba(79, 142, 247, 0.15)' : 'rgba(124, 93, 232, 0.15)';
        const subtypes = window.ELECTIVE_SUBTYPES[electiveType] || [];
        
        html += `<div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span class="strand-badge ${strandColor}" style="font-size:11px;padding:4px 10px">${strand}</span>
                <span style="font-size:11px;color:var(--text2);font-weight:600">${sections.length} section${sections.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">`;
        
        sections.forEach(section => {
            html += `<div style="padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:8px">
                <div style="font-weight:600;font-size:13px;color:var(--text);margin-bottom:8px">${section.section}</div>
                
                <div style="display:inline-block;font-size:10px;font-weight:800;color:${electiveLabelColor};background:${electiveLabelBg};padding:4px 8px;border-radius:4px;margin-bottom:8px;letter-spacing:0.5px">${electiveLabel}</div>
                
                <div style="font-size:11px;color:var(--text2);margin-bottom:6px;font-weight:600">Assign to:</div>`;
            
            subtypes.forEach(subtype => {
                html += `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:4px;font-size:12px">
                    <input type="radio" name="section-elective-${section.id}" class="section-elective-radio" data-section-id="${section.id}" value="${subtype.name}" style="cursor:pointer;width:14px;height:14px">
                    <span style="color:var(--text1)">${subtype.name}</span>
                </label>`;
            });
            
            html += `</div>`;
        });
        
        html += `</div></div>`;
    });
    
    html += `</div></div>`;
    
    return html;
}

async function clearOrphanedSection(sectionId) {
    if (!confirm('Clear all invalid elective subtypes from this section?')) {
        return;
    }
    
    try {
        const res = await apiFetch('api/sections.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: sectionId,
                section_elective_subtypes: JSON.stringify([])
            })
        });
        
        if (res?.success) {
            showToast('✓ Invalid subtypes cleared', 'success');
            await loadSectionsFromDB();
            // Reopen modal to refresh display
            setTimeout(() => {
                openEditSectionElectivesModal();
            }, 100);
        } else {
            showToast('✗ Failed to clear subtypes', 'error');
        }
    } catch (error) {
        console.error('Error clearing orphaned section:', error);
        showToast('✗ Error clearing subtypes', 'error');
    }
}

async function unassignSectionElective(sectionId) {
    if (!confirm('Remove this section from its elective subtype?')) {
        return;
    }
    
    try {
        const res = await apiFetch('api/sections.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: sectionId,
                section_elective_subtypes: JSON.stringify([])
            })
        });
        
        if (!(res?.success)) {
            throw new Error('Failed to unassign section');
        }
        
        showToast('✓ Section unassigned', 'success');
        await loadSectionsFromDB();
        
        // Reopen modal to refresh display
        setTimeout(() => {
            openEditSectionElectivesModal();
        }, 100);
    } catch (error) {
        console.error('Error unassigning section:', error);
        showToast('✗ Error: ' + error.message, 'error');
    }
}

function buildStrandSection(strand, sections, electiveType) {
    const subtypes = window.ELECTIVE_SUBTYPES[electiveType] || [];
    
    if (subtypes.length === 0) {
        return '';
    }
    
    const strandColor = {ABM: 'strand-abm', HUMSS: 'strand-humss', TVL: 'strand-tvl'}[strand] || '';
    const strandDisplay = strand === 'TVL' ? 'TVL (Technical)' : strand;
    
    let html = `<div style="margin-bottom:24px;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg1)">
        <div style="padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
            <span class="strand-badge ${strandColor}" style="font-size:11px;padding:3px 8px">${strandDisplay}</span>
            <span style="color:var(--text2);font-size:12px">${sections.length} section${sections.length !== 1 ? 's' : ''}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">`;
    
    sections.forEach((section, idx) => {
        const isFirstCol = idx % 2 === 0;
        const borderRight = isFirstCol && idx !== sections.length - 1 ? ' border-right: 1px solid var(--border);' : '';
        const borderBottom = idx < sections.length - 2 || (idx === sections.length - 2 && sections.length % 2 === 0) ? ' border-bottom: 1px solid var(--border);' : '';
        
        let selectedSubtypes = [];
        try {
            const raw = section.section_elective_subtypes;
            if (raw) selectedSubtypes = Array.isArray(raw) ? raw : JSON.parse(raw);
        } catch (e) {}
        
        html += `<div style="padding:12px;${borderRight}${borderBottom}">
            <div style="font-weight:600;font-size:12px;color:var(--text1);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">${section.section}</div>`;
        
        subtypes.forEach(subtype => {
            const isChecked = selectedSubtypes.includes(subtype.name);
            html += `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:6px;font-size:12px">
                <input type="radio" name="section-elective-${section.id}" class="section-elective-radio" data-section-id="${section.id}" value="${subtype.name}" ${isChecked ? 'checked' : ''} style="cursor:pointer;width:14px;height:14px">
                <span style="color:var(--text1)">${subtype.name}</span>
            </label>`;
        });
        
        html += `</div>`;
    });
    
    html += `</div>
    </div>`;
    
    return html;
}

function closeEditSectionElectivesModal() {
    document.getElementById('editSectionElectivesModal').classList.add('hidden');
    window.currentEditSectionId = null;
}

async function saveSectionElectiveSubtypes() {
    try {
        const allRadios = document.querySelectorAll('input.section-elective-radio, input.section-orphan-radio');
        const sectionUpdates = new Map();

        // Collect all radio button selections
        allRadios.forEach(radio => {
            const sectionId = radio.getAttribute('data-section-id');
            if (radio.checked) {
                sectionUpdates.set(sectionId, [radio.value]);
            }
        });

        // All SHS sections (G11 + G12)
        const shsSections = SECTIONS.filter(s => s.grade === 11 || s.grade === 12);

        // For sections not in radio buttons, keep their existing assignment
        shsSections.forEach(section => {
            if (!sectionUpdates.has(section.id)) {
                let selectedSubtypes = [];
                try {
                    if (section.section_elective_subtypes) {
                        const raw = section.section_elective_subtypes;
                        selectedSubtypes = Array.isArray(raw) ? raw : JSON.parse(raw);
                    }
                } catch (e) {}
                sectionUpdates.set(section.id, selectedSubtypes);
            }
        });

        let savedCount = 0;
        for (const section of shsSections) {
            const selectedSubtypes = sectionUpdates.get(section.id) || [];
            const res = await apiFetch('api/sections.php', {
                method: 'PUT',
                body: JSON.stringify({
                    id: section.id,
                    section_elective_subtypes: JSON.stringify(selectedSubtypes)
                })
            });
            if (!(res?.success)) throw new Error(`Failed to save ${section.name}`);
            savedCount++;
        }

        showToast(`✓ Saved ${savedCount} sections`, 'success');
        closeEditSectionElectivesModal();
        await loadSectionsFromDB();

        if (currentSection) {
            renderSectionSchedule(currentSection);
            renderSectionView();
        }
    } catch (error) {
        showToast('✗ Error saving: ' + error.message, 'error');
    }
}
 
function renderSectionSchedule(sid) {
    const section = SECTIONS.find(s => s.id === sid);
    if (!section) return;
 
    document.getElementById('sectionSchedTitle').textContent = section.name;
 
    const badgeEl = document.getElementById('sectionStrandBadge');
    if (badgeEl) {
        if (section.strand) {
            const cls = {STEM:'strand-stem',ABM:'strand-abm',HUMSS:'strand-humss',TVL:'strand-tvl'}[section.strand] || '';
            badgeEl.innerHTML = `<span class="strand-badge ${cls}">${section.strand}</span>`;
        } else {
            badgeEl.innerHTML = `<span class="grade-chip ${getGradeClass(section.grade)}">Grade ${section.grade}</span>`;
        }
    }
    
    // Show print button when section is selected
    const printBtn = document.getElementById('printScheduleBtn');
    if (printBtn) printBtn.style.display = 'block';
    
    // Update table header based on grade
    const isSHS = section.grade >= 11;
    const daysToShow = isSHS ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const tableHead = document.querySelector('#view-sections .data-table thead tr');
    if (tableHead) {
        tableHead.innerHTML = '<th class="time-col">Time Slot</th>' + 
            daysToShow.map(day => `<th>${day}</th>`).join('');
    }
 
    const lookup = buildSectionLookup(sid, section.grade);
    document.getElementById('sectionSchedBody').innerHTML = buildSectionRows(lookup, section.grade);
    
    // Display conflicts for this section
    displaySectionConflicts(sid, section);
    
    // Store current section for editing
    window.currentEditSection = section;
}
 
function buildSectionLookup(sid, grade) {
    const isSHS = grade >= 11;
    const daysToUse = isSHS ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const slotsToUse = isSHS ? ['p2','p3','p4','p5','p6','p7','p8','p9','p10'] : ['p1','p2','p3','p4','p5','p6','p7','p8','p9'];
    
    // Find the advisory teacher for this section
    const advisoryTeacher = teachersCache.find(t => t.advisory_section === sid);
    
    // Determine first period slot based on grade level
    const firstPeriodSlot = isSHS ? 'p2' : 'p1';
    
    const lookup = {};
    daysToUse.forEach(day => {
        lookup[day] = {};
        slotsToUse.forEach(slot => {
            lookup[day][slot] = null;
            
            // AUTO-INJECT PRELIMINARIES: If this is first period slot and section has advisory teacher, show PRELIMINARIES
            if (slot === firstPeriodSlot && advisoryTeacher) {
                // Check if there's already something scheduled in database
                let hasScheduledEntry = false;
                Object.entries(scheduleCache).forEach(([tid, tData]) => {
                    if (tData[day]?.[slot]?.section === sid) {
                        hasScheduledEntry = true;
                    }
                });
                
                // If nothing scheduled in database, auto-inject PRELIMINARIES
                if (!hasScheduledEntry) {
                    lookup[day][slot] = { 
                        teacher: advisoryTeacher.name, 
                        subject: 'PRELIMINARIES', 
                        conflict: false,
                        autoInjected: true // Mark as auto-injected so we know it's not from database
                    };
                }
            }
            
            // Load from database (this will override auto-injected if exists in DB)
            Object.entries(scheduleCache).forEach(([tid, tData]) => {
                if (tData[day]?.[slot]?.section === sid) {
                    const teacher = teachersCache.find(t => t.id === tid);
                    const tName   = teacher?.name || tid;
                    const subj    = tData[day][slot].subject || '';
                    if (!lookup[day][slot] || lookup[day][slot].autoInjected) {
                        // Replace auto-injected or set new entry
                        lookup[day][slot] = { teacher: tName, subject: subj, conflict: false };
                    } else {
                        // Conflict: multiple teachers assigned to same slot
                        lookup[day][slot].conflict = true;
                        lookup[day][slot].teacher += ' / ' + tName;
                    }
                }
            });
        });
    });
    return lookup;
}
 
function buildSectionRows(lookup, grade) {
    const isSHS = grade >= 11;
    const daysToUse = isSHS ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const timeSlotsToUse = isSHS ? TIME_SLOTS_SHS : TIME_SLOTS_JHS;
    const colspan = daysToUse.length + 1; // +1 for time column
    
    let html = '';
    timeSlotsToUse.forEach(slot => {
        if (slot.type === 'break') {
            html += `<tr><td colspan="${colspan}" class="break-td">${slot.label}</td></tr>`;
            return;
        }
        html += `<tr><td class="time-label time-col">${slot.label}</td>`;
        daysToUse.forEach(day => {
            const e = lookup[day][slot.id];
            if (!e) {
                html += `<td class="empty-td">—</td>`;
            } else if (e.conflict) {
                html += `<td class="conflict-td"><div class="sched-filled">
                    <span class="teacher-name" style="color:var(--red)">⚠ ${e.teacher}</span>
                    <span class="subject-name">${e.subject}</span>
                </div></td>`;
            } else {
                html += `<td><div class="sched-filled">
                    <span class="teacher-name">${e.teacher}</span>
                    <span class="subj-badge ${getSubjectClass(e.subject)}">${e.subject || '—'}</span>
                </div></td>`;
            }
        });
        html += '</tr>';
    });
    return html;
}

// ---- Display Section Conflicts ----

async function displaySectionConflicts(sid, section) {
    console.log('displaySectionConflicts called for section:', sid);
    
    const conflictsList = document.getElementById('conflictsList');
    const conflictCount = document.getElementById('conflictCount');
    
    if (!conflictsList || !conflictCount) {
        console.error('Conflict elements not found');
        return;
    }
    
    // Show loading state
    conflictCount.innerHTML = '<span style="color:var(--text2)">Loading conflicts...</span>';
    conflictsList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">Checking for conflicts...</div>';
    
    try {
        console.log('Fetching conflicts from API...');
        // Fetch conflicts from API with cache-busting parameter
        const cacheBuster = Date.now();
        const response = await apiFetch(API.conflicts + '?_=' + cacheBuster);
        console.log('Conflicts API response:', response);
        
        if (!response.success) {
            throw new Error('Failed to fetch conflicts');
        }
        
        // Filter conflicts for this section
        const sectionConflicts = response.conflicts.filter(c => 
            c.section_id === sid && 
            c.type !== 'UNIT_DEFICIT' && 
            c.type !== 'UNIT_EXCESS'
        );
        console.log('Filtered conflicts for section:', sectionConflicts.length);
        console.log('Section conflicts detail:', sectionConflicts);
        console.log('SAME_DAY_DUPLICATE conflicts:', sectionConflicts.filter(c => c.type === 'SAME_DAY_DUPLICATE'));
        
        const isSHS = section.grade >= 11;
        const daysToCheck = isSHS ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] : ['Monday','Tuesday','Wednesday','Thursday','Friday'];
        
        const SLOT_LABELS = {
            p1: isSHS ? '7:30-8:30 AM' : '7:00-7:30 AM',
            p2: isSHS ? '8:30-9:30 AM' : '7:30-8:30 AM',
            p3: isSHS ? '9:30-10:30 AM' : '8:30-9:30 AM',
            p4: isSHS ? '10:45-11:45 AM' : '9:45-10:45 AM',
            p5: isSHS ? '11:45 AM-12:45 PM' : '10:45-11:45 AM',
            p6: isSHS ? '1:15-2:15 PM' : '12:15-1:15 PM',
            p7: isSHS ? '2:15-3:15 PM' : '1:15-2:15 PM',
            p8: isSHS ? '3:30-4:30 PM' : '2:30-3:30 PM',
            p9: isSHS ? '4:30-5:30 PM' : '3:30-4:30 PM',
            p10: '5:30-6:30 PM'
        };
        
        // Update conflict count
        if (sectionConflicts.length === 0) {
            conflictCount.innerHTML = '<span style="color:var(--green);font-weight:600">✓ No conflicts detected</span>';
            conflictsList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">✓ All clear! No scheduling conflicts found for this section.</div>';
        } else {
            conflictCount.innerHTML = `<span style="color:var(--red);font-weight:700">${sectionConflicts.length} conflict${sectionConflicts.length !== 1 ? 's' : ''} found</span>`;
            
            // Group conflicts by type
            const conflictsByType = {
                'DOUBLE_BOOKING': [],
                'SAME_DAY_DUPLICATE': [],
                'SCHEDULE_GAP': []
            };
            
            sectionConflicts.forEach(c => {
                if (conflictsByType[c.type]) {
                    conflictsByType[c.type].push(c);
                }
            });
            
            let html = '';
            
            // Display Same-Day Duplicates
            if (conflictsByType['SAME_DAY_DUPLICATE'].length > 0) {
                html += `<div style="margin-bottom:24px">
                    <div style="font-size:14px;font-weight:700;color:var(--text1);margin-bottom:10px;padding:8px 12px;background:#ffe6e6;border-left:4px solid var(--red);border-radius:4px">
                        ⚠️ Same-Day Duplicates (${conflictsByType['SAME_DAY_DUPLICATE'].length})
                    </div>`;
                
                conflictsByType['SAME_DAY_DUPLICATE'].forEach(conflict => {
                    html += `<div style="margin-left:16px;margin-bottom:12px;padding:12px;background:#fff;border:2px solid var(--red);border-radius:8px;cursor:pointer;transition:all 0.2s" 
                        onmouseover="this.style.background='#fff5f5'" 
                        onmouseout="this.style.background='#fff'"
                        onclick="navigateToConflict('${conflict.section_id}', '${conflict.day}', null, 'SAME_DAY_DUPLICATE', '${conflict.subject}')">
                        <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px">
                            📅 ${conflict.day} - ${conflict.subject}
                        </div>
                        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">
                            Subject appears <strong>${conflict.occurrences} times</strong> on the same day (should be once per day)
                        </div>
                        <div style="font-size:11px;color:var(--text3);font-style:italic">${conflict.message}</div>
                        <div style="font-size:10px;color:var(--blue);margin-top:8px;font-weight:600">👆 Click to view in schedule</div>
                    </div>`;
                });
                
                html += '</div>';
            }
            
            // Display Schedule Gaps
            if (conflictsByType['SCHEDULE_GAP'].length > 0) {
                html += `<div style="margin-bottom:24px">
                    <div style="font-size:14px;font-weight:700;color:var(--text1);margin-bottom:10px;padding:8px 12px;background:#fff3cd;border-left:4px solid #ff9800;border-radius:4px">
                        ⚠️ Schedule Gaps (${conflictsByType['SCHEDULE_GAP'].length})
                    </div>`;
                
                conflictsByType['SCHEDULE_GAP'].forEach(conflict => {
                    html += `<div style="margin-left:16px;margin-bottom:12px;padding:12px;background:#fff;border:2px solid #ff9800;border-radius:8px;cursor:pointer;transition:all 0.2s" 
                        onmouseover="this.style.background='#fffbf0'" 
                        onmouseout="this.style.background='#fff'"
                        onclick="navigateToConflict('${conflict.section_id}', '${conflict.day}', '${conflict.gap_slot}', 'SCHEDULE_GAP')">
                        <div style="font-size:13px;font-weight:700;color:#ff9800;margin-bottom:8px">
                            📅 ${conflict.day} - ${conflict.gap_slot} ${SLOT_LABELS[conflict.gap_slot] || ''}
                        </div>
                        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">
                            Empty slot between scheduled subjects (subjects should be consecutive)
                        </div>
                        <div style="font-size:11px;color:var(--text3);font-style:italic">${conflict.message}</div>
                        <div style="font-size:10px;color:var(--blue);margin-top:8px;font-weight:600">👆 Click to view in schedule</div>
                    </div>`;
                });
                
                html += '</div>';
            }
            
            // Display Double Bookings
            if (conflictsByType['DOUBLE_BOOKING'].length > 0) {
                html += `<div style="margin-bottom:24px">
                    <div style="font-size:14px;font-weight:700;color:var(--text1);margin-bottom:10px;padding:8px 12px;background:#ffe6e6;border-left:4px solid var(--red);border-radius:4px">
                        ⚠️ Double Bookings (${conflictsByType['DOUBLE_BOOKING'].length})
                    </div>`;
                
                conflictsByType['DOUBLE_BOOKING'].forEach(conflict => {
                    const timeLabel = SLOT_LABELS[conflict.slot_id] || conflict.slot_id;
                    html += `<div style="margin-left:16px;margin-bottom:12px;padding:12px;background:#fff;border:2px solid var(--red);border-radius:8px;cursor:pointer;transition:all 0.2s" 
                        onmouseover="this.style.background='#fff5f5'" 
                        onmouseout="this.style.background='#fff'"
                        onclick="navigateToConflict('${conflict.section_id}', '${conflict.day}', '${conflict.slot_id}', 'DOUBLE_BOOKING')">
                        <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px">
                            📅 ${conflict.day} - ${timeLabel}
                        </div>
                        <div style="font-size:12px;color:var(--text2);margin-bottom:6px">
                            ${conflict.teacher_count} teachers assigned: ${conflict.teachers}
                        </div>
                        <div style="font-size:11px;color:var(--text3);font-style:italic">Section has ${conflict.teacher_count} teachers at ${conflict.day} ${timeLabel}: ${conflict.teachers}</div>
                        <div style="font-size:10px;color:var(--blue);margin-top:8px;font-weight:600">👆 Click to view in schedule</div>
                    </div>`;
                });
                
                html += '</div>';
            }
            
            conflictsList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error fetching conflicts:', error);
        conflictCount.innerHTML = '<span style="color:var(--red)">Error loading conflicts</span>';
        conflictsList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--red)">Failed to load conflicts. Please try again.</div>';
    }
}

// Navigate to conflict location in schedule
function navigateToConflict(sectionId, day, slotId, conflictType, subject = null) {
    console.log('Navigating to conflict:', { sectionId, day, slotId, conflictType, subject });
    
    if (conflictType === 'DOUBLE_BOOKING') {
        // For double bookings, navigate to Teachers tab and open teacher schedule modal
        switchView('teachers');
        
        // Find the teachers involved in this conflict
        setTimeout(() => {
            // Find which teachers have this section at this time
            const conflictingTeachers = [];
            Object.entries(scheduleCache).forEach(([teacherId, teacherSchedule]) => {
                if (teacherSchedule[day]?.[slotId]?.section === sectionId) {
                    conflictingTeachers.push(teacherId);
                }
            });
            
            if (conflictingTeachers.length > 0) {
                // Open the first teacher's schedule modal
                const firstTeacherId = conflictingTeachers[0];
                const teacher = teachersCache.find(t => t.id === firstTeacherId);
                
                if (teacher) {
                    // Open teacher panel
                    openTeacherPanel(firstTeacherId, teacher.name);
                    
                    // Wait for schedule table to render, then highlight the conflict
                    setTimeout(() => {
                        const schedTable = document.getElementById('teacherSchedTable');
                        if (schedTable) {
                            // Find the specific cell by matching day column and slot row
                            const rows = schedTable.querySelectorAll('tbody tr');
                            const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                            const dayIndex = daysToShow.indexOf(day);
                            
                            rows.forEach(row => {
                                const timeLabel = row.querySelector('.time-label');
                                if (timeLabel) {
                                    // Check if this row matches the slot
                                    const rowText = timeLabel.textContent;
                                    const slotMatches = {
                                        'p1': '7:00',
                                        'p2': '7:30',
                                        'p3': '8:30',
                                        'p4': '9:30',
                                        'p5': '10:45',
                                        'p6': '11:45',
                                        'p7': '1:15',
                                        'p8': '2:15',
                                        'p9': '3:30',
                                        'p10': '4:30'
                                    };
                                    
                                    if (rowText.includes(slotMatches[slotId])) {
                                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        
                                        // Highlight the specific day cell (dayIndex + 1 because first column is time)
                                        const cells = row.querySelectorAll('td');
                                        if (cells[dayIndex + 1]) {
                                            const targetCell = cells[dayIndex + 1];
                                            targetCell.style.transition = 'all 0.3s';
                                            targetCell.style.background = '#ffe6e6';
                                            targetCell.style.boxShadow = '0 0 0 4px var(--red)';
                                            targetCell.style.transform = 'scale(1.02)';
                                            
                                            setTimeout(() => {
                                                targetCell.style.background = '';
                                                targetCell.style.boxShadow = '';
                                                targetCell.style.transform = '';
                                            }, 3000);
                                        }
                                    }
                                }
                            });
                        }
                        
                        showToast(`Conflict: ${conflictingTeachers.length} teachers at ${day} ${slotId}`, 'error');
                    }, 500);
                }
            }
        }, 300);
    } else if (conflictType === 'SCHEDULE_GAP' || conflictType === 'SAME_DAY_DUPLICATE') {
        // For gaps and duplicates, find teacher who teaches this section and open their modal
        switchView('teachers');
        
        setTimeout(() => {
            let teachersWithSection = [];
            
            if (conflictType === 'SCHEDULE_GAP') {
                // For gaps, find teachers who have this section scheduled around the gap
                const slotNum = parseInt(slotId.replace('p', ''));
                const slotsToCheck = [`p${slotNum-1}`, `p${slotNum+1}`];
                
                Object.entries(scheduleCache).forEach(([teacherId, teacherSchedule]) => {
                    if (teacherSchedule[day]) {
                        slotsToCheck.forEach(checkSlot => {
                            if (teacherSchedule[day][checkSlot]?.section === sectionId) {
                                if (!teachersWithSection.includes(teacherId)) {
                                    teachersWithSection.push(teacherId);
                                }
                            }
                        });
                    }
                });
            } else {
                // For duplicates, find teachers who have this section scheduled on this day
                Object.entries(scheduleCache).forEach(([teacherId, teacherSchedule]) => {
                    if (teacherSchedule[day]) {
                        Object.entries(teacherSchedule[day]).forEach(([slot, assignment]) => {
                            if (assignment.section === sectionId) {
                                if (!teachersWithSection.includes(teacherId)) {
                                    teachersWithSection.push(teacherId);
                                }
                            }
                        });
                    }
                });
            }
            
            if (teachersWithSection.length > 0) {
                const firstTeacherId = teachersWithSection[0];
                const teacher = teachersCache.find(t => t.id === firstTeacherId);
                
                if (teacher) {
                    openTeacherPanel(firstTeacherId, teacher.name);
                    
                    setTimeout(() => {
                        const schedTable = document.getElementById('teacherSchedTable');
                        if (schedTable) {
                            const rows = schedTable.querySelectorAll('tbody tr');
                            const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                            const dayIndex = daysToShow.indexOf(day);
                            
                            if (conflictType === 'SCHEDULE_GAP' && slotId) {
                                // Highlight the gap slot
                                rows.forEach(row => {
                                    const timeLabel = row.querySelector('.time-label');
                                    if (timeLabel) {
                                        const rowText = timeLabel.textContent;
                                        const slotMatches = {
                                            'p1': '7:00', 'p2': '7:30', 'p3': '8:30', 'p4': '9:30',
                                            'p5': '10:45', 'p6': '11:45', 'p7': '1:15', 'p8': '2:15',
                                            'p9': '3:30', 'p10': '4:30'
                                        };
                                        
                                        if (rowText.includes(slotMatches[slotId])) {
                                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            
                                            const cells = row.querySelectorAll('td');
                                            if (cells[dayIndex + 1]) {
                                                const targetCell = cells[dayIndex + 1];
                                                targetCell.style.transition = 'all 0.3s';
                                                targetCell.style.background = '#fff3cd';
                                                targetCell.style.boxShadow = '0 0 0 4px #ff9800';
                                                targetCell.style.transform = 'scale(1.02)';
                                                
                                                setTimeout(() => {
                                                    targetCell.style.background = '';
                                                    targetCell.style.boxShadow = '';
                                                    targetCell.style.transform = '';
                                                }, 3000);
                                            }
                                        }
                                    }
                                });
                            } else if (conflictType === 'SAME_DAY_DUPLICATE' && subject) {
                                // Highlight all cells with this subject on this day
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells[dayIndex + 1]) {
                                        const targetCell = cells[dayIndex + 1];
                                        const subjectSelect = targetCell.querySelector('.slot-subject');
                                        if (subjectSelect && subjectSelect.value === subject) {
                                            targetCell.style.transition = 'all 0.3s';
                                            targetCell.style.background = '#ffe6e6';
                                            targetCell.style.boxShadow = '0 0 0 4px var(--red)';
                                            targetCell.style.transform = 'scale(1.02)';
                                            
                                            setTimeout(() => {
                                                targetCell.style.background = '';
                                                targetCell.style.boxShadow = '';
                                                targetCell.style.transform = '';
                                            }, 3000);
                                        }
                                    }
                                });
                            }
                        }
                        
                        showToast(`Opened schedule for editing ${conflictType.replace(/_/g, ' ').toLowerCase()}`, 'info');
                    }, 500);
                }
            } else {
                showToast('No teacher found for this section on this day', 'warning');
            }
        }, 300);
    } else {
        // For other conflicts, navigate to sections view
        switchView('sections');
        
        setTimeout(() => {
            const section = SECTIONS.find(s => s.id === sectionId);
            if (section) {
                selectSection(sectionId);
                
                setTimeout(() => {
                    if (slotId) {
                        // Highlight specific slot
                        const cellId = `cell_${day}_${slotId}`;
                        const cell = document.getElementById(cellId);
                        if (cell) {
                            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            cell.style.transition = 'all 0.3s';
                            cell.style.background = conflictType === 'SCHEDULE_GAP' ? '#fff3cd' : '#ffe6e6';
                            cell.style.boxShadow = '0 0 0 4px ' + (conflictType === 'SCHEDULE_GAP' ? '#ff9800' : 'var(--red)');
                            cell.style.transform = 'scale(1.02)';
                            
                            setTimeout(() => {
                                cell.style.background = '';
                                cell.style.boxShadow = '';
                                cell.style.transform = '';
                            }, 3000);
                        }
                    } else if (conflictType === 'SAME_DAY_DUPLICATE' && subject) {
                        // Highlight all cells with this subject on this day
                        const dayColumn = document.querySelectorAll(`[data-day="${day}"]`);
                        dayColumn.forEach(cell => {
                            const subjectSelect = cell.querySelector('select[id^="subj_"]');
                            if (subjectSelect && subjectSelect.value === subject) {
                                cell.style.transition = 'all 0.3s';
                                cell.style.background = '#ffe6e6';
                                cell.style.boxShadow = '0 0 0 4px var(--red)';
                                cell.style.transform = 'scale(1.02)';
                                
                                setTimeout(() => {
                                    cell.style.background = '';
                                    cell.style.boxShadow = '';
                                    cell.style.transform = '';
                                }, 3000);
                            }
                        });
                    }
                    
                    showToast(`Navigated to ${conflictType.replace(/_/g, ' ').toLowerCase()}`, 'info');
                }, 500);
            }
        }, 300);
    }
}
 
 
// ============================================================
// 11. WCI PRINT — SECTION SCHEDULE
// ============================================================
 
function exportSectionScheduleExcel() {
    console.log('=== EXPORT SECTION SCHEDULE EXCEL CALLED ===');
    if (!currentSection) { showToast('Select a section first', 'error'); return; }
    const section = SECTIONS.find(s => s.id === currentSection);
    if (!section) return;
    console.log('Section:', section.name, 'Grade:', section.grade);

    const isSHS = section.grade >= 11;
    const allDays = isSHS
        ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        : ['Monday','Tuesday','Wednesday','Thursday','Friday'];

    // Build schedule lookup
    const lookup = {};
    allDays.forEach(day => {
        lookup[day] = {};
        PERIOD_SLOTS.forEach(slot => {
            lookup[day][slot] = null;
            Object.entries(scheduleCache).forEach(([tid, tData]) => {
                if (tData[day]?.[slot]?.section === currentSection) {
                    const teacher = teachersCache.find(t => t.id === tid);
                    const tName = teacher?.name || tid;
                    const subj = tData[day][slot].subject || '';
                    if (!lookup[day][slot]) {
                        lookup[day][slot] = { teacher: tName, subject: subj };
                    }
                }
            });
        });
    });

    // Define time slots with proper structure
    const slots = isSHS ? [
        { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
        { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
        { timeIn:'9:30 AM', timeOut:'10:30 AM', min:'60', type:'period', id:'p4' },
        { timeIn:'10:30 AM', timeOut:'10:45 AM', min:'15', type:'break', label:'Break' },
        { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
        { timeIn:'11:45 AM', timeOut:'12:45 PM', min:'60', type:'period', id:'p6' },
        { timeIn:'12:45 PM', timeOut:'1:15 PM', min:'30', type:'lunch', label:'Lunch' },
        { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
        { timeIn:'2:15 PM', timeOut:'3:15 PM', min:'60', type:'period', id:'p8' },
        { timeIn:'3:15 PM', timeOut:'3:30 PM', min:'15', type:'break', label:'Break' },
        { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
        { timeIn:'4:30 PM', timeOut:'5:30 PM', min:'60', type:'period', id:'p10' },
    ] : [
        { timeIn:'7:00 AM', timeOut:'7:30 AM', min:'30', type:'period', id:'p1' },
        { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
        { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
        { timeIn:'9:30 AM', timeOut:'9:45 AM', min:'15', type:'break', label:'Break' },
        { timeIn:'9:45 AM', timeOut:'10:45 AM', min:'60', type:'period', id:'p4' },
        { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
        { timeIn:'11:45 AM', timeOut:'12:15 PM', min:'30', type:'lunch', label:'Lunch' },
        { timeIn:'12:15 PM', timeOut:'1:15 PM', min:'60', type:'period', id:'p6' },
        { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
        { timeIn:'2:15 PM', timeOut:'2:30 PM', min:'15', type:'break', label:'Break' },
        { timeIn:'2:30 PM', timeOut:'3:30 PM', min:'60', type:'period', id:'p8' },
        { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
    ];

    // Get term/semester info
    const currentCurr = window.currentCurriculum || 'new';
    const currentTerm = window.currentTerm || '1';
    const currentSemester = window.currentSemester || '1';
    const termNames = {'1':'1st Term','2':'2nd Term','3':'3rd Term'};
    const semNames = {'1':'1st Semester','2':'2nd Semester'};
    const periodInfo = isSHS ? semNames[currentSemester] : (currentCurr === 'new' ? termNames[currentTerm] : 'Term ' + currentTerm);

    // Build HTML table with proper format
    const TH = 'border:1px solid #000;padding:8px 4px;text-align:center;font-size:11px;font-weight:700;background:#D3D3D3;vertical-align:middle;';
    const TC = 'border:1px solid #000;padding:8px 6px;text-align:center;vertical-align:middle;font-size:10px;background:#fff;';
    const TBK = 'border:1px solid #000;padding:10px;text-align:center;font-size:12px;font-weight:700;background:#FFA500;color:#000;';

    let rows = '';
    slots.forEach(slot => {
        if (slot.type === 'break' || slot.type === 'lunch') {
            rows += `<tr>
                <td style="${TC}">${slot.timeIn}</td>
                <td style="${TC}">${slot.timeOut}</td>
                <td style="${TC}">${slot.min}</td>
                <td colspan="${allDays.length}" style="${TBK}">${slot.label}</td>
            </tr>`;
            return;
        }
        rows += `<tr>
            <td style="${TC}">${slot.timeIn}</td>
            <td style="${TC}">${slot.timeOut}</td>
            <td style="${TC}">${slot.min}</td>`;
        allDays.forEach(day => {
            const d = lookup[day][slot.id];
            const teacher = d?.teacher || '';
            const subj = d?.subject || '';
            
            if (subj === 'PRELIMINARIES') {
                rows += `<td style="${TC}"><b>${subj}</b></td>`;
            } else if (teacher || subj) {
                rows += `<td style="${TC}"><b>${teacher}</b><br/>${subj}</td>`;
            } else {
                rows += `<td style="${TC}"></td>`;
            }
        });
        rows += '</tr>';
    });

    const gradeLabel = isSHS ? `GRADE ${section.grade} - ${section.strand || ''}` : `GRADE ${section.grade}`;

    let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Schedule</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head>
        <body>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:10px">
          <tr>
            <td colspan="3" style="text-align:center;border:none;padding:10px">
              <div style="font-size:24px;font-weight:700">Western Colleges, Inc.</div>
              <div style="font-size:11px">(Formerly Western Cavite Institute)</div>
              <div style="font-size:12px;font-weight:700">High School Department</div>
              <div style="font-size:11px">Naic, Cavite</div>
              <div style="font-size:11px">Email: wcihighschool@gmail.com | Tel. No. (046) 507 0500</div>
            </td>
          </tr>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:10px">
          <tr>
            <td style="border:2px solid #000;padding:8px;text-align:center;background:#D3D3D3">
              <b>SECTION SCHEDULE FOR SY ${schoolYear}</b>
            </td>
          </tr>
          <tr>
            <td style="border:2px solid #000;border-top:none;padding:8px;text-align:center">
              <div style="font-size:14px;font-weight:700">${gradeLabel} - ${section.name}</div>
              <div style="font-size:11px">${section.room || ''}</div>
              <div style="font-size:11px">${periodInfo}</div>
            </td>
          </tr>
        </table>
        <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
            <thead><tr>
                <th style="${TH}">Time In</th>
                <th style="${TH}">Time Out</th>
                <th style="${TH}">Min</th>
                ${allDays.map(d => `<th style="${TH}">${d}</th>`).join('')}
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:30px">
          <tr>
            <td style="text-align:center;width:45%;border-top:2px solid #000;padding-top:5px">
              <b>DR. DANILO CABALU</b><br/>
              <i>Adviser</i>
            </td>
            <td style="width:10%"></td>
            <td style="text-align:center;width:45%;border-top:2px solid #000;padding-top:5px">
              <b>MR. DARNIELL C. BALBUENA, Ph.D.</b><br/>
              <i>School Principal</i>
            </td>
          </tr>
        </table>
        </body>
        </html>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `Section_Schedule_${section.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xls`;
    console.log('Downloading file:', a.download);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✓ Excel file downloaded', 'success');
}

function printSectionSchedule() {
    if (!currentSection) { showToast('Select a section first', 'error'); return; }
    const section = SECTIONS.find(s => s.id === currentSection);
    if (!section) return;

    const isSHS   = section.grade >= 11;
    const allDays = isSHS
        ? ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        : ['Monday','Tuesday','Wednesday','Thursday','Friday'];

    // Find the advisory teacher for this section
    const advisoryTeacher = teachersCache.find(t => t.advisory_section === currentSection);
    
    // Determine first period slot based on grade level
    const firstPeriodSlot = isSHS ? 'p2' : 'p1';

    const lookup = {};
    allDays.forEach(day => {
        lookup[day] = {};
        PERIOD_SLOTS.forEach(slot => {
            lookup[day][slot] = null;
            
            // AUTO-INJECT PRELIMINARIES: If this is first period slot and section has advisory teacher
            if (slot === firstPeriodSlot && advisoryTeacher) {
                // Check if there's already something scheduled in database
                let hasScheduledEntry = false;
                Object.entries(scheduleCache).forEach(([tid, tData]) => {
                    if (tData[day]?.[slot]?.section === currentSection) {
                        hasScheduledEntry = true;
                    }
                });
                
                // If nothing scheduled in database, auto-inject PRELIMINARIES
                if (!hasScheduledEntry) {
                    lookup[day][slot] = { 
                        teacher: advisoryTeacher.name, 
                        subject: 'PRELIMINARIES', 
                        conflict: false,
                        autoInjected: true
                    };
                }
            }
            
            // Load from database (this will override auto-injected if exists in DB)
            Object.entries(scheduleCache).forEach(([tid, tData]) => {
                if (tData[day]?.[slot]?.section === currentSection) {
                    const teacher = teachersCache.find(t => t.id === tid);
                    const tName   = teacher?.name || tid;
                    const subj    = tData[day][slot].subject || '';
                    if (!lookup[day][slot] || lookup[day][slot].autoInjected) {
                        lookup[day][slot] = { teacher: tName, subject: subj, conflict: false };
                    } else {
                        lookup[day][slot].conflict = true;
                        lookup[day][slot].teacher += ' / ' + tName;
                    }
                }
            });
        });
    });

    const TH  = 'border:1px solid #000;padding:7px 6px;text-align:center;font-size:11px;font-weight:700;background:#fff;';
    const TC  = 'border:1px solid #000;padding:5px 6px;text-align:center;vertical-align:middle;';
    const TBK = 'border:1px solid #000;padding:7px 6px;text-align:center;font-size:11px;font-weight:700;background:#f5c518;color:#000;';

    if (isSHS) {
        const shsSlots = [
            { time:'7:30 AM',   timeOut:'8:30 AM',   min:'60', type:'period', id:'p2' },
            { time:'8:30 AM',   timeOut:'9:30 AM',   min:'60', type:'period', id:'p3' },
            { time:'9:30 AM',   timeOut:'10:30 AM',  min:'60', type:'period', id:'p4' },
            { time:'10:30 AM',  timeOut:'10:45 AM',  min:'15', type:'break',  label:'Break' },
            { time:'10:45 AM',  timeOut:'11:45 AM',  min:'60', type:'period', id:'p5' },
            { time:'11:45 AM',  timeOut:'12:45 PM',  min:'60', type:'period', id:'p6' },
            { time:'12:45 PM',  timeOut:'1:15 PM',   min:'30', type:'lunch',  label:'Lunch Break' },
            { time:'1:15 PM',   timeOut:'2:15 PM',   min:'60', type:'period', id:'p7' },
            { time:'2:15 PM',   timeOut:'3:15 PM',   min:'60', type:'period', id:'p8' },
            { time:'3:15 PM',   timeOut:'3:30 PM',   min:'15', type:'break',  label:'Break' },
            { time:'3:30 PM',   timeOut:'4:30 PM',   min:'60', type:'period', id:'p9' },
            { time:'4:30 PM',   timeOut:'5:30 PM',   min:'60', type:'period', id:'p10' },
        ];

        const TH  = 'border:1px solid #000;padding:6px 4px;text-align:center;font-size:10px;font-weight:700;background:#fff;vertical-align:middle;';
        const TC  = 'border:1px solid #000;padding:5px 4px;text-align:center;vertical-align:middle;font-size:9px;';
        const TBK = 'border:1px solid #000;padding:6px;text-align:center;font-size:11px;font-weight:700;background:#f5a623;color:#fff;font-style:italic;';

        let rows = '';
        shsSlots.forEach(slot => {
            if (slot.type === 'break' || slot.type === 'lunch') {
                rows += `<tr style="height:28px">
                    <td style="${TC}">${slot.time}</td>
                    <td style="${TC}">${slot.timeOut}</td>
                    <td style="${TC}">${slot.min}</td>
                    <td colspan="${allDays.length}" style="${TBK}">${slot.label}</td>
                </tr>`;
                return;
            }
            rows += `<tr style="height:30px">
                <td style="${TC}">${slot.time}</td>
                <td style="${TC}">${slot.timeOut}</td>
                <td style="${TC}">${slot.min}</td>`;
            allDays.forEach(day => {
                const e = lookup[day]?.[slot.id];
                if (!e) {
                    rows += `<td style="${TC}"></td>`;
                } else if (e.conflict) {
                    rows += `<td style="${TC}"><div style="font-weight:700;font-size:8px;color:#8b0000">&#9888; ${e.teacher}</div></td>`;
                } else {
                    // For PRELIMINARIES, show only the subject name without teacher
                    if (e.subject === 'PRELIMINARIES') {
                        rows += `<td style="${TC}">
                            <div style="font-weight:700;font-size:9px;line-height:1.2;color:#333">${e.subject}</div>
                        </td>`;
                    } else {
                        rows += `<td style="${TC}">
                            <div style="font-weight:700;font-size:8px;line-height:1.2;margin-bottom:1px">${e.teacher}</div>
                            <div style="font-size:7px;color:#333">${e.subject || ''}</div>
                        </td>`;
                    }
                }
            });
            rows += '</tr>';
        });

        const w = window.open('','_blank','width=1200,height=850');
        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Section Schedule - ${section.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#fff;color:#000;padding:12mm}
table{border-collapse:collapse;width:100%;table-layout:fixed}
@page{size:A4 landscape;margin:12mm}
@media print{
    body{padding:0}
    .no-print{display:none!important}
}
</style>
</head><body>
${wcHeader()}
<div style="background:#c00;padding:2px;margin-bottom:1px"></div>
<div style="border:1px solid #000;padding:6px;text-align:center;margin-bottom:1px">
    <strong style="font-size:12px;letter-spacing:1px">SECTION SCHEDULE FOR SY ${schoolYear}</strong>
</div>
<div style="border:1px solid #000;border-top:none;padding:6px;text-align:center;margin-bottom:8px">
    <div style="font-size:14px;font-weight:700;text-transform:uppercase">${section.name}</div>
    <div style="font-size:11px;margin-top:2px;min-height:14px">${section.room || ''}</div>
    <div style="font-size:10px;margin-top:2px;color:#666">${(function(){
        const sem = window.currentSemester || '1';
        const semNames = {'1':'1st Semester','2':'2nd Semester'};
        return semNames[sem];
    })()}</div>
</div>
<table>
    <thead><tr>
        <th style="${TH}width:75px">TIME IN</th>
        <th style="${TH}width:75px">TIME OUT</th>
        <th style="${TH}width:55px">MINUTES</th>
        ${allDays.map(d => `<th style="${TH}">${d.toUpperCase()}</th>`).join('')}
    </tr></thead>
    <tbody>${rows}</tbody>
</table>
<div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px;text-transform:uppercase;min-height:14px">${(function(){ var adv=teachersCache.find(function(t){ return t.advisory_section===currentSection; }); return adv?adv.name:''; })()}</div>
        <div style="font-size:9px;margin-top:4px">Adviser</div>
    </div>
    <div style="width:20%"></div>
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px">MR. DARNIELL C. BALBUENA, Ph.D.</div>
        <div style="font-size:9px;margin-top:4px">School Principal</div>
    </div>
</div>
<button class="no-print" onclick="window.print()" style="background:#8b0000;color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:700;margin-top:20px">🖨 Print / Save as PDF</button>
</body></html>`);
        w.document.close();

    } else {
        const jhsSlots = [
            { time:'7:00 AM',   timeOut:'7:30 AM',   min:'30', type:'period', id:'p1' },
            { time:'7:30 AM',   timeOut:'8:30 AM',   min:'60', type:'period', id:'p2' },
            { time:'8:30 AM',   timeOut:'9:30 AM',   min:'60', type:'period', id:'p3' },
            { time:'9:30 AM',   timeOut:'9:45 AM',   min:'15', type:'break',  label:'Break' },
            { time:'9:45 AM',   timeOut:'10:45 AM',  min:'60', type:'period', id:'p4' },
            { time:'10:45 AM',  timeOut:'11:45 AM',  min:'60', type:'period', id:'p5' },
            { time:'11:45 AM',  timeOut:'12:15 PM',  min:'30', type:'lunch',  label:'Lunch Break' },
            { time:'12:15 PM',  timeOut:'1:15 PM',   min:'60', type:'period', id:'p6' },
            { time:'1:15 PM',   timeOut:'2:15 PM',   min:'60', type:'period', id:'p7' },
            { time:'2:15 PM',   timeOut:'2:30 PM',   min:'15', type:'break',  label:'Break' },
            { time:'2:30 PM',   timeOut:'3:30 PM',   min:'60', type:'period', id:'p8' },
            { time:'3:30 PM',   timeOut:'4:30 PM',   min:'60', type:'period', id:'p9' },
        ];

        const TH  = 'border:1px solid #000;padding:6px 4px;text-align:center;font-size:10px;font-weight:700;background:#fff;vertical-align:middle;';
        const TC  = 'border:1px solid #000;padding:5px 4px;text-align:center;vertical-align:middle;font-size:9px;';
        const TBK = 'border:1px solid #000;padding:6px;text-align:center;font-size:11px;font-weight:700;background:#f5a623;color:#fff;font-style:italic;';

        let rows = '';
        jhsSlots.forEach(slot => {
            if (slot.type === 'break' || slot.type === 'lunch') {
                rows += `<tr style="height:28px">
                    <td style="${TC}">${slot.time}</td>
                    <td style="${TC}">${slot.timeOut}</td>
                    <td style="${TC}">${slot.min}</td>
                    <td colspan="${allDays.length}" style="${TBK}">${slot.label}</td>
                </tr>`;
                return;
            }
            rows += `<tr style="height:30px">
                <td style="${TC}">${slot.time}</td>
                <td style="${TC}">${slot.timeOut}</td>
                <td style="${TC}">${slot.min}</td>`;
            allDays.forEach(day => {
                const e = lookup[day]?.[slot.id];
                if (!e) {
                    rows += `<td style="${TC}"></td>`;
                } else if (e.conflict) {
                    rows += `<td style="${TC}"><div style="font-weight:700;font-size:8px;color:#8b0000">&#9888; ${e.teacher}</div></td>`;
                } else {
                    // For PRELIMINARIES, show only the subject name without teacher
                    if (e.subject === 'PRELIMINARIES') {
                        rows += `<td style="${TC}">
                            <div style="font-weight:700;font-size:9px;line-height:1.2;color:#333">${e.subject}</div>
                        </td>`;
                    } else {
                        rows += `<td style="${TC}">
                            <div style="font-weight:700;font-size:8px;line-height:1.2;margin-bottom:1px">${e.teacher}</div>
                            <div style="font-size:7px;color:#333">${e.subject || ''}</div>
                        </td>`;
                    }
                }
            });
            rows += '</tr>';
        });

        const w = window.open('','_blank','width=1200,height=850');
        w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Section Schedule - ${section.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;background:#fff;color:#000;padding:12mm}
table{border-collapse:collapse;width:100%;table-layout:fixed}
@page{size:A4 landscape;margin:12mm}
@media print{
    body{padding:0}
    .no-print{display:none!important}
}
</style>
</head><body>
${wcHeader()}
<div style="background:#c00;padding:2px;margin-bottom:1px"></div>
<div style="border:1px solid #000;padding:6px;text-align:center;margin-bottom:1px">
    <strong style="font-size:12px;letter-spacing:1px">SECTION SCHEDULE FOR SY ${schoolYear}</strong>
</div>
<div style="border:1px solid #000;border-top:none;padding:6px;text-align:center;margin-bottom:8px">
    <div style="font-size:14px;font-weight:700;text-transform:uppercase">${section.name}</div>
    <div style="font-size:11px;margin-top:2px;min-height:14px">${section.room || ''}</div>
    <div style="font-size:10px;margin-top:2px;color:#666">${(function(){
        const curr = window.currentCurriculum || 'new';
        const term = window.currentTerm || '1';
        const termNames = {'1':'1st Term','2':'2nd Term','3':'3rd Term'};
        return curr === 'new' ? termNames[term] : 'Term ' + term;
    })()}</div>
</div>
<table>
    <thead><tr>
        <th style="${TH}width:75px">TIME IN</th>
        <th style="${TH}width:75px">TIME OUT</th>
        <th style="${TH}width:55px">MINUTES</th>
        ${allDays.map(d => `<th style="${TH}">${d.toUpperCase()}</th>`).join('')}
    </tr></thead>
    <tbody>${rows}</tbody>
</table>
<div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px;text-transform:uppercase;min-height:14px">${(function(){ var adv=teachersCache.find(function(t){ return t.advisory_section===currentSection; }); return adv?adv.name:''; })()}</div>
        <div style="font-size:9px;margin-top:4px">Adviser</div>
    </div>
    <div style="width:20%"></div>
    <div style="text-align:center;width:40%">
        <div style="border-bottom:1.5px solid #000;padding-bottom:2px;font-weight:700;font-size:11px">MR. DARNIELL C. BALBUENA, Ph.D.</div>
        <div style="font-size:9px;margin-top:4px">School Principal</div>
    </div>
</div>
<button class="no-print" onclick="window.print()" style="background:#8b0000;color:#fff;border:none;padding:10px 28px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:700;margin-top:20px">🖨 Print / Save as PDF</button>
</body></html>`);
        w.document.close();
    }
}
 
 
// ============================================================
// 12. SUBJECTS MANAGEMENT
// ============================================================

async function loadSubjectsFromDB() {
    // Initialize cache if not defined
    if (typeof subjectsCache === 'undefined') {
        window.subjectsCache = { jhs: [], g11Sem1: [], g11Sem2: [], g12Sem1: [], g12Sem2: [] };
    }
    
    if (!API || !API.subjects) {
        console.error('API.subjects is not defined');
        return;
    }
    
    const curriculum = window.currentCurriculum || 'new';
    console.log('Loading subjects from:', API.subjects, 'curriculum:', curriculum);
    const data = await apiFetch(API.subjects + '?curriculum=' + curriculum);
    console.log('Subjects data received:', data);
    
    if (data?.success) {
        subjectsCache.jhs = data.jhs || [];
        subjectsCache.g11Sem1 = data.g11Sem1 || [];
        subjectsCache.g11Sem2 = data.g11Sem2 || [];
        subjectsCache.g12Sem1 = data.g12Sem1 || [];
        subjectsCache.g12Sem2 = data.g12Sem2 || [];
        console.log('Subjects cache updated:', subjectsCache);
    } else {
        console.error('Failed to load subjects:', data);
    }
}

async function populateElectiveFilters() {
    // Fetch Grade 11 subtypes
    const g11Res = await apiFetch(API.electives + '?grade=11');
    const g11Academic = g11Res?.academic || [];
    const g11Techpro = g11Res?.techpro || [];
    
    // Fetch Grade 12 subtypes
    const g12Res = await apiFetch(API.electives + '?grade=12');
    const g12Academic = g12Res?.academic || [];
    const g12Techpro = g12Res?.techpro || [];
    
    // Populate G11 Sem1 Academic Subtypes
    const g11Sem1AcademicContainer = document.querySelector('#g11Sem1AcademicSubtypes .filter-subtype');
    if (g11Sem1AcademicContainer) {
        g11Sem1AcademicContainer.innerHTML = g11Academic.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g11Sem1AcademicSubtype" value="${subtype.name}" onchange="filterG11Sem1ByElective('academic','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G11 Sem1 TechPro Subtypes
    const g11Sem1TechproContainer = document.querySelector('#g11Sem1TechproSubtypes .filter-subtype');
    if (g11Sem1TechproContainer) {
        g11Sem1TechproContainer.innerHTML = g11Techpro.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g11Sem1TechproSubtype" value="${subtype.name}" onchange="filterG11Sem1ByElective('techpro','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G11 Sem2 Academic Subtypes
    const g11Sem2AcademicContainer = document.querySelector('#g11Sem2AcademicSubtypes .filter-subtype');
    if (g11Sem2AcademicContainer) {
        g11Sem2AcademicContainer.innerHTML = g11Academic.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g11Sem2AcademicSubtype" value="${subtype.name}" onchange="filterG11Sem2ByElective('academic','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G11 Sem2 TechPro Subtypes
    const g11Sem2TechproContainer = document.querySelector('#g11Sem2TechproSubtypes .filter-subtype');
    if (g11Sem2TechproContainer) {
        g11Sem2TechproContainer.innerHTML = g11Techpro.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g11Sem2TechproSubtype" value="${subtype.name}" onchange="filterG11Sem2ByElective('techpro','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G12 Sem1 Academic Subtypes
    const g12Sem1AcademicContainer = document.querySelector('#g12Sem1AcademicSubtypes .filter-subtype');
    if (g12Sem1AcademicContainer) {
        g12Sem1AcademicContainer.innerHTML = g12Academic.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g12Sem1AcademicSubtype" value="${subtype.name}" onchange="filterG12Sem1ByElective('academic','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G12 Sem1 TechPro Subtypes
    const g12Sem1TechproContainer = document.querySelector('#g12Sem1TechproSubtypes .filter-subtype');
    if (g12Sem1TechproContainer) {
        g12Sem1TechproContainer.innerHTML = g12Techpro.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g12Sem1TechproSubtype" value="${subtype.name}" onchange="filterG12Sem1ByElective('techpro','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G12 Sem2 Academic Subtypes
    const g12Sem2AcademicContainer = document.querySelector('#g12Sem2AcademicSubtypes .filter-subtype');
    if (g12Sem2AcademicContainer) {
        g12Sem2AcademicContainer.innerHTML = g12Academic.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g12Sem2AcademicSubtype" value="${subtype.name}" onchange="filterG12Sem2ByElective('academic','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
    
    // Populate G12 Sem2 TechPro Subtypes
    const g12Sem2TechproContainer = document.querySelector('#g12Sem2TechproSubtypes .filter-subtype');
    if (g12Sem2TechproContainer) {
        g12Sem2TechproContainer.innerHTML = g12Techpro.map(subtype => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:11px;font-weight:600">
              <input type="radio" name="g12Sem2TechproSubtype" value="${subtype.name}" onchange="filterG12Sem2ByElective('techpro','${subtype.name.replace(/'/g, "\\'")}')" style="cursor:pointer;width:12px;height:12px"> <span>${subtype.name}</span>
            </label>
        `).join('');
    }
}

async function renderSubjectsView() {
    await loadSubjectsFromDB();
    
    // Populate elective filters from database
    await populateElectiveFilters();
    
    // Initialize cache if not defined
    if (typeof subjectsCache === 'undefined') {
        window.subjectsCache = { jhs: [], g11Sem1: [], g11Sem2: [], g12Sem1: [], g12Sem2: [] };
    }
    
    // Update radio button state to match current curriculum
    const currentCurr = window.currentCurriculum || 'new';
    const radioButtons = document.querySelectorAll('input[name="curriculum"]');
    radioButtons.forEach(radio => {
        radio.checked = radio.value === currentCurr;
    });
    
    // Check if we're in list view mode and adjust container layout
    const isListView = currentSubjectView === 'list';
    const jhsNewContainer = document.getElementById('jhsNewCurriculumContainer');
    const g11Container = document.querySelector('#view-subjects > div:nth-of-type(4)');
    const g12Container = document.querySelector('#view-subjects > div:nth-of-type(5)');
    
    if (isListView) {
        // List view: stack containers vertically
        if (jhsNewContainer) {
            jhsNewContainer.style.gridTemplateColumns = '1fr';
            jhsNewContainer.style.gap = '12px';
        }
        if (g11Container) {
            g11Container.style.gridTemplateColumns = '1fr';
            g11Container.style.gap = '12px';
        }
        if (g12Container) {
            g12Container.style.gridTemplateColumns = '1fr';
            g12Container.style.gap = '12px';
        }
    } else {
        // Tile view: original grid layout
        if (jhsNewContainer) {
            jhsNewContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
            jhsNewContainer.style.gap = '16px';
        }
        if (g11Container) {
            g11Container.style.gridTemplateColumns = '1fr 1fr';
            g11Container.style.gap = '16px';
        }
        if (g12Container) {
            g12Container.style.gridTemplateColumns = '1fr 1fr';
            g12Container.style.gap = '16px';
        }
    }
    
    const renderSubjectCard = (s, idx, color, type) => {
        let categoryBadge;
        if (s.category === 'applied') {
            categoryBadge = '<span style="font-size:9px;padding:2px 6px;background:rgba(251,146,60,0.15);color:#f97316;border-radius:4px;font-weight:700;margin-left:auto">APPLIED</span>';
        } else if (s.category === 'major') {
            categoryBadge = '<span style="font-size:9px;padding:2px 6px;background:rgba(59,130,246,0.15);color:#3b82f6;border-radius:4px;font-weight:700;margin-left:auto">MAJOR</span>';
        } else if (s.category === 'minor') {
            categoryBadge = '<span style="font-size:9px;padding:2px 6px;background:rgba(168,85,247,0.15);color:#a855f7;border-radius:4px;font-weight:700;margin-left:auto">MINOR</span>';
        } else {
            categoryBadge = '<span style="font-size:9px;padding:2px 6px;background:rgba(34,197,94,0.15);color:#22c55e;border-radius:4px;font-weight:700;margin-left:auto">CORE</span>';
        }
        
        // Add grade level display for JHS subjects
        const gradeDisplay = s.grade ? `<span style="font-size:10px;color:var(--text2);margin-left:8px">Grade ${s.grade}</span>` : '';
        
        // Check current view mode
        const isListView = currentSubjectView === 'list';
        
        if (isListView) {
            // List view - compact horizontal layout
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;transition:all 0.2s" 
                 onmouseover="this.style.borderColor='${color}';this.style.background='var(--bg3)'" 
                 onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg2)'">
                <div style="flex-shrink:0;width:28px;height:28px;background:${color};border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px">${idx + 1}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:600;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
                </div>
                <div style="flex-shrink:0;font-size:11px;color:var(--text2)">${s.units || 1} units</div>
                ${categoryBadge}
                <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','${type}','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || 1}')" 
                    style="flex-shrink:0;width:26px;height:26px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:5px;color:#3b82f6;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                    onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                    onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                    title="Edit subject">✏</button>
                <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','${type}')" 
                    style="flex-shrink:0;width:26px;height:26px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:5px;color:#ef4444;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                    onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                    onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                    title="Remove subject">✕</button>
            </div>`;
        } else {
            // Tile view - original layout
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1)" 
                 onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${color}33'" 
                 onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
                <div style="flex-shrink:0;width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${idx + 1}</div>
                <div style="flex:1">
                    <div style="font-size:14px;font-weight:600;color:var(--text1)">${s.name}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
                        <span style="font-size:12px;color:var(--text2)">${s.units || 1} units/week</span>
                        ${gradeDisplay}
                    </div>
                </div>
                ${categoryBadge}
                <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','${type}','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || 1}')" 
                    style="flex-shrink:0;width:28px;height:28px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#3b82f6;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                    onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                    onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                    title="Edit subject">✏</button>
                <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','${type}')" 
                    style="flex-shrink:0;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                    onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                    onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                    title="Remove subject">✕</button>
            </div>`;
        }
    };
    
    const renderListWithCategories = (subjects, color, type, emptyIcon, emptyMsg) => {
        if (subjects.length === 0) {
            return `<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">${emptyIcon}</div><p style="font-size:13px">${emptyMsg}</p></div>`;
        }
        
        const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
        const appliedSubjects = subjects.filter(s => s.category === 'applied');
        const majorSubjects = subjects.filter(s => s.category === 'major');
        const minorSubjects = subjects.filter(s => s.category === 'minor');
        
        let html = '';
        
        if (coreSubjects.length > 0) {
            html += '<div style="margin-bottom:20px">';
            html += '<div style="font-size:11px;font-weight:800;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:6px;display:inline-block">📚 CORE SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + coreSubjects.map((s, idx) => renderSubjectCard(s, idx, color, type)).join('') + '</div>';
            html += '</div>';
        }
        
        if (majorSubjects.length > 0) {
            html += '<div style="margin-bottom:20px">';
            html += '<div style="font-size:11px;font-weight:800;color:#3b82f6;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(59,130,246,0.1);border-radius:6px;display:inline-block">📖 MAJOR SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + majorSubjects.map((s, idx) => renderSubjectCard(s, idx, color, type)).join('') + '</div>';
            html += '</div>';
        }
        
        if (minorSubjects.length > 0) {
            html += '<div style="margin-bottom:20px">';
            html += '<div style="font-size:11px;font-weight:800;color:#a855f7;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(168,85,247,0.1);border-radius:6px;display:inline-block">📝 MINOR SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + minorSubjects.map((s, idx) => renderSubjectCard(s, idx, color, type)).join('') + '</div>';
            html += '</div>';
        }
        
        if (appliedSubjects.length > 0) {
            html += '<div>';
            html += '<div style="font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(251,146,60,0.1);border-radius:6px;display:inline-block">🎯 APPLIED/SPECIALIZED SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + appliedSubjects.map((s, idx) => renderSubjectCard(s, idx, color, type)).join('') + '</div>';
            html += '</div>';
        }
        
        return html;
    };
    
    // Show/hide JHS containers based on curriculum (reuse variables from above)
    const jhsOldContainer = document.getElementById('jhsOldCurriculumContainer');
    
    if (currentCurr === 'new') {
        // New curriculum: show term containers
        if (jhsOldContainer) jhsOldContainer.style.display = 'none';
        if (jhsNewContainer) jhsNewContainer.style.display = 'grid';
        
        document.getElementById('jhsTerm1SubjectsList').innerHTML = renderListWithCategories(
            (subjectsCache.jhs || []).filter(s => s.term === '1' || s.term === 'all'), 
            'linear-gradient(135deg,#22c55e,#16a34a)', 
            'jhs', 
            '📚', 
            'No subjects for 1st term yet'
        );
        
        document.getElementById('jhsTerm2SubjectsList').innerHTML = renderListWithCategories(
            (subjectsCache.jhs || []).filter(s => s.term === '2' || s.term === 'all'), 
            'linear-gradient(135deg,#10b981,#059669)', 
            'jhs', 
            '📚', 
            'No subjects for 2nd term yet'
        );
        
        document.getElementById('jhsTerm3SubjectsList').innerHTML = renderListWithCategories(
            (subjectsCache.jhs || []).filter(s => s.term === '3' || s.term === 'all'), 
            'linear-gradient(135deg,#059669,#047857)', 
            'jhs', 
            '📚', 
            'No subjects for 3rd term yet'
        );
    } else {
        // Old curriculum: show single container
        if (jhsOldContainer) jhsOldContainer.style.display = 'block';
        if (jhsNewContainer) jhsNewContainer.style.display = 'none';
        
        document.getElementById('jhsSubjectsList').innerHTML = renderListWithCategories(
            subjectsCache.jhs || [], 
            'linear-gradient(135deg,#22c55e,#16a34a)', 
            'jhs', 
            '📚', 
            'No JHS subjects yet'
        );
    }
    
    // Show/hide filters for Grade 11 based on curriculum
    const g11Sem1ElectiveFilter = document.getElementById('g11Sem1ElectiveFilter');
    const g11Sem2ElectiveFilter = document.getElementById('g11Sem2ElectiveFilter');
    const g11Sem1StrandFilter = document.getElementById('g11Sem1StrandFilter');
    const g11Sem2StrandFilter = document.getElementById('g11Sem2StrandFilter');
    
    if (currentCurr === 'new') {
        if (g11Sem1ElectiveFilter) g11Sem1ElectiveFilter.style.display = 'block';
        if (g11Sem2ElectiveFilter) g11Sem2ElectiveFilter.style.display = 'block';
        if (g11Sem1StrandFilter) g11Sem1StrandFilter.style.display = 'none';
        if (g11Sem2StrandFilter) g11Sem2StrandFilter.style.display = 'none';
    } else {
        if (g11Sem1ElectiveFilter) g11Sem1ElectiveFilter.style.display = 'none';
        if (g11Sem2ElectiveFilter) g11Sem2ElectiveFilter.style.display = 'none';
        if (g11Sem1StrandFilter) g11Sem1StrandFilter.style.display = 'block';
        if (g11Sem2StrandFilter) g11Sem2StrandFilter.style.display = 'block';
    }
    
    // Render Grade 11 with elective filtering
    renderG11Sem1Subjects();
    renderG11Sem2Subjects();
    
    // Show/hide filters for Grade 12 based on curriculum
    const g12Sem1StrandFilter = document.getElementById('g12Sem1StrandFilter');
    const g12Sem2StrandFilter = document.getElementById('g12Sem2StrandFilter');
    const g12Sem1ElectiveFilter = document.getElementById('g12Sem1ElectiveFilter');
    const g12Sem2ElectiveFilter = document.getElementById('g12Sem2ElectiveFilter');
    
    if (currentCurr === 'old') {
        if (g12Sem1StrandFilter) g12Sem1StrandFilter.style.display = 'block';
        if (g12Sem2StrandFilter) g12Sem2StrandFilter.style.display = 'block';
        if (g12Sem1ElectiveFilter) g12Sem1ElectiveFilter.style.display = 'none';
        if (g12Sem2ElectiveFilter) g12Sem2ElectiveFilter.style.display = 'none';
    } else {
        if (g12Sem1StrandFilter) g12Sem1StrandFilter.style.display = 'none';
        if (g12Sem2StrandFilter) g12Sem2StrandFilter.style.display = 'none';
        if (g12Sem1ElectiveFilter) g12Sem1ElectiveFilter.style.display = 'block';
        if (g12Sem2ElectiveFilter) g12Sem2ElectiveFilter.style.display = 'block';
    }
    
    // Render Grade 12 with strand filtering
    renderG12Sem1Subjects();
    renderG12Sem2Subjects();
}

function renderG11Sem1Subjects() {
    const electiveType = window.g11Sem1ElectiveType || 'none';
    const electiveSubtype = window.g11Sem1ElectiveSubtype || null;
    const selectedStrand = window.g11Sem1SelectedStrand || 'all';
    const subjects = subjectsCache.g11Sem1 || [];
    const currentCurr = window.currentCurriculum || 'new';
    
    const renderSubjectCard = (s, idx, color, badgeLabel, badgeColor, electiveSubtype = null) => {
        const categoryBadge = `<span style="font-size:9px;padding:2px 6px;background:${badgeColor};color:${badgeLabel === 'CORE' ? '#22c55e' : (badgeLabel === 'ACADEMIC' ? '#3b82f6' : '#f97316')};border-radius:4px;font-weight:700;margin-left:auto">${badgeLabel}</span>`;
        const unitsDisplay = s.units ? `<span style="font-size:10px;color:var(--text2);margin-left:8px">${s.units} units/week</span>` : '';
        
        // If there's an elective subtype, show it as the main title with the subject name below
        const titleDisplay = electiveSubtype 
            ? `<div style="font-size:14px;font-weight:600;color:var(--text1)">${electiveSubtype.toUpperCase()}</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${s.name}</div>`
            : `<div style="font-size:14px;font-weight:600;color:var(--text1)">${s.name}</div>`;
        
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1)" 
             onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${color}33'" 
             onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            <div style="flex-shrink:0;width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${idx + 1}</div>
            <div style="flex:1">
                ${titleDisplay}
                ${unitsDisplay}
            </div>
            ${categoryBadge}
            <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || ''}')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#3b82f6;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                title="Edit subject">✏</button>
            <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                title="Remove subject">✕</button>
        </div>`;
    };
    
    if (subjects.length === 0) {
        document.getElementById('g11Sem1SubjectsList').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">📘</div><p style="font-size:13px">No subjects yet</p></div>`;
        return;
    }
    
    const color = 'linear-gradient(135deg,#3b82f6,#1d4ed8)';
    const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
    const appliedSubjects = subjects.filter(s => s.category === 'applied');
    
    let html = '';
    
    // Always show core subjects
    if (coreSubjects.length > 0) {
        html += '<div style="margin-bottom:20px">';
        html += '<div style="font-size:11px;font-weight:800;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:6px;display:inline-block">📚 CORE SUBJECTS</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + coreSubjects.map((s, idx) => renderSubjectCard(s, idx, color, 'CORE', 'rgba(34,197,94,0.15)')).join('') + '</div>';
        html += '</div>';
    }
    
    // For new curriculum: group electives by type, then by subtype
    if (currentCurr === 'new' && appliedSubjects.length > 0) {
        // Group by elective type (treat null, undefined, 'all' as needing to be shown in both)
        const academicElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'academic');
        const techproElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'techpro');
        
        // Show Academic Electives if selected or if 'none' is selected
        if (electiveType === 'none' || electiveType === 'academic') {
            let filteredAcademic = academicElectives;
            if (electiveType === 'academic' && electiveSubtype) {
                filteredAcademic = academicElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredAcademic.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#3b82f6;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(59,130,246,0.1);border-left:4px solid #3b82f6;border-radius:6px">🎓 ACADEMIC</div>';
                
                // Group by subtype
                const groupedBySubtype = {};
                filteredAcademic.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                // Render each subtype group (skip "Other")
                Object.keys(groupedBySubtype).forEach(subtype => {
                    if (subtype === 'Other') return; // Hide "Other" group
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'ACADEMIC', 'rgba(59,130,246,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
        
        // Show TechPro Electives if selected or if 'none' is selected
        if (electiveType === 'none' || electiveType === 'techpro') {
            let filteredTechpro = techproElectives;
            if (electiveType === 'techpro' && electiveSubtype) {
                filteredTechpro = techproElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredTechpro.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#f97316;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(251,146,60,0.1);border-left:4px solid #f97316;border-radius:6px">🔧 TECHPRO</div>';
                
                // Group by subtype
                const groupedBySubtype = {};
                filteredTechpro.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                // Render each subtype group (skip "Other")
                Object.keys(groupedBySubtype).forEach(subtype => {
                    if (subtype === 'Other') return; // Hide "Other" group
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'TECHPRO', 'rgba(251,146,60,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
    } else if (currentCurr === 'old' && appliedSubjects.length > 0) {
        // For old curriculum: filter by strand
        const filteredSubjects = appliedSubjects.filter(s => {
            if (selectedStrand === 'all') return true;
            return s.strand === selectedStrand || s.strand === 'all';
        });
        
        if (filteredSubjects.length > 0) {
            html += '<div>';
            html += '<div style="font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(251,146,60,0.1);border-radius:6px;display:inline-block">🎯 APPLIED/SPECIALIZED SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + filteredSubjects.map((s, idx) => {
                const badgeLabel = s.strand && s.strand !== 'all' ? `APPLIED - ${s.strand}` : 'APPLIED';
                return renderSubjectCard(s, idx, color, badgeLabel, 'rgba(251,146,60,0.15)');
            }).join('') + '</div>';
            html += '</div>';
        }
    }
    
    document.getElementById('g11Sem1SubjectsList').innerHTML = html;
}

function renderG11Sem2Subjects() {
    const electiveType = window.g11Sem2ElectiveType || 'none';
    const electiveSubtype = window.g11Sem2ElectiveSubtype || null;
    const selectedStrand = window.g11Sem2SelectedStrand || 'all';
    const subjects = subjectsCache.g11Sem2 || [];
    const currentCurr = window.currentCurriculum || 'new';
    
    const renderSubjectCard = (s, idx, color, badgeLabel, badgeColor, electiveSubtype = null) => {
        const categoryBadge = `<span style="font-size:9px;padding:2px 6px;background:${badgeColor};color:${badgeLabel === 'CORE' ? '#22c55e' : (badgeLabel === 'ACADEMIC' ? '#8b5cf6' : '#f97316')};border-radius:4px;font-weight:700;margin-left:auto">${badgeLabel}</span>`;
        const unitsDisplay = s.units ? `<span style="font-size:10px;color:var(--text2);margin-left:8px">${s.units} units/week</span>` : '';
        
        // If there's an elective subtype, show it as the main title with the subject name below
        const titleDisplay = electiveSubtype 
            ? `<div style="font-size:14px;font-weight:600;color:var(--text1)">${electiveSubtype.toUpperCase()}</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${s.name}</div>`
            : `<div style="font-size:14px;font-weight:600;color:var(--text1)">${s.name}</div>`;
        
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1)" 
             onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${color}33'" 
             onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            <div style="flex-shrink:0;width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${idx + 1}</div>
            <div style="flex:1">
                ${titleDisplay}
                ${unitsDisplay}
            </div>
            ${categoryBadge}
            <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || ''}')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#3b82f6;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                title="Edit subject">✏</button>
            <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                title="Remove subject">✕</button>
        </div>`;
    };
    
    if (subjects.length === 0) {
        document.getElementById('g11Sem2SubjectsList').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">📗</div><p style="font-size:13px">No subjects yet</p></div>`;
        return;
    }
    
    const color = 'linear-gradient(135deg,#8b5cf6,#7c3aed)';
    const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
    const appliedSubjects = subjects.filter(s => s.category === 'applied');
    
    let html = '';
    
    // Always show core subjects
    if (coreSubjects.length > 0) {
        html += '<div style="margin-bottom:20px">';
        html += '<div style="font-size:11px;font-weight:800;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:6px;display:inline-block">📚 CORE SUBJECTS</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + coreSubjects.map((s, idx) => renderSubjectCard(s, idx, color, 'CORE', 'rgba(34,197,94,0.15)')).join('') + '</div>';
        html += '</div>';
    }
    
    // For new curriculum: group electives by type, then by subtype
    if (currentCurr === 'new' && appliedSubjects.length > 0) {
        // Group by elective type (treat null, undefined, 'all' as needing to be shown in both)
        const academicElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'academic');
        const techproElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'techpro');
        
        // Show Academic Electives if selected or if 'none' is selected
        if (electiveType === 'none' || electiveType === 'academic') {
            let filteredAcademic = academicElectives;
            if (electiveType === 'academic' && electiveSubtype) {
                filteredAcademic = academicElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredAcademic.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#8b5cf6;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(139,92,246,0.1);border-left:4px solid #8b5cf6;border-radius:6px">🎓 ACADEMIC</div>';
                
                // Group by subtype
                const groupedBySubtype = {};
                filteredAcademic.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                // Render each subtype group (skip "Other")
                Object.keys(groupedBySubtype).forEach(subtype => {
                    if (subtype === 'Other') return; // Hide "Other" group
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'ACADEMIC', 'rgba(139,92,246,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
        
        // Show TechPro Electives if selected or if 'none' is selected
        if (electiveType === 'none' || electiveType === 'techpro') {
            let filteredTechpro = techproElectives;
            if (electiveType === 'techpro' && electiveSubtype) {
                filteredTechpro = techproElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredTechpro.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#f97316;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(251,146,60,0.1);border-left:4px solid #f97316;border-radius:6px">🔧 TECHPRO</div>';
                
                // Group by subtype
                const groupedBySubtype = {};
                filteredTechpro.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                // Render each subtype group (skip "Other")
                Object.keys(groupedBySubtype).forEach(subtype => {
                    if (subtype === 'Other') return; // Hide "Other" group
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'TECHPRO', 'rgba(251,146,60,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
    } else if (currentCurr === 'old' && appliedSubjects.length > 0) {
        // For old curriculum: filter by strand
        const filteredSubjects = appliedSubjects.filter(s => {
            if (selectedStrand === 'all') return true;
            return s.strand === selectedStrand || s.strand === 'all';
        });
        
        if (filteredSubjects.length > 0) {
            html += '<div>';
            html += '<div style="font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(251,146,60,0.1);border-radius:6px;display:inline-block">🎯 APPLIED/SPECIALIZED SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + filteredSubjects.map((s, idx) => {
                const badgeLabel = s.strand && s.strand !== 'all' ? `APPLIED - ${s.strand}` : 'APPLIED';
                return renderSubjectCard(s, idx, color, badgeLabel, 'rgba(251,146,60,0.15)');
            }).join('') + '</div>';
            html += '</div>';
        }
    }
    
    document.getElementById('g11Sem2SubjectsList').innerHTML = html;
}

function switchG11Sem1ElectiveType(type) {
    window.g11Sem1ElectiveType = type;
    window.g11Sem1ElectiveSubtype = null;
    
    // Show/hide subtype panels
    const academicPanel = document.getElementById('g11Sem1AcademicSubtypes');
    const techproPanel = document.getElementById('g11Sem1TechproSubtypes');
    
    if (academicPanel) academicPanel.style.display = type === 'academic' ? 'block' : 'none';
    if (techproPanel) techproPanel.style.display = type === 'techpro' ? 'block' : 'none';
    
    renderG11Sem1Subjects();
}

function switchG11Sem2ElectiveType(type) {
    window.g11Sem2ElectiveType = type;
    window.g11Sem2ElectiveSubtype = null;
    
    // Show/hide subtype panels
    const academicPanel = document.getElementById('g11Sem2AcademicSubtypes');
    const techproPanel = document.getElementById('g11Sem2TechproSubtypes');
    
    if (academicPanel) academicPanel.style.display = type === 'academic' ? 'block' : 'none';
    if (techproPanel) techproPanel.style.display = type === 'techpro' ? 'block' : 'none';
    
    renderG11Sem2Subjects();
}

function filterG11Sem1ByElective(type, subtype) {
    window.g11Sem1ElectiveType = type;
    window.g11Sem1ElectiveSubtype = subtype;
    renderG11Sem1Subjects();
}

function filterG11Sem2ByElective(type, subtype) {
    window.g11Sem2ElectiveType = type;
    window.g11Sem2ElectiveSubtype = subtype;
    renderG11Sem2Subjects();
}

function switchG12Sem1ElectiveType(type) {
    window.g12Sem1ElectiveType = type;
    window.g12Sem1ElectiveSubtype = null;
    
    // Show/hide subtype panels
    const academicPanel = document.getElementById('g12Sem1AcademicSubtypes');
    const techproPanel = document.getElementById('g12Sem1TechproSubtypes');
    
    if (academicPanel) academicPanel.style.display = type === 'academic' ? 'block' : 'none';
    if (techproPanel) techproPanel.style.display = type === 'techpro' ? 'block' : 'none';
    
    renderG12Sem1Subjects();
}

function switchG12Sem2ElectiveType(type) {
    window.g12Sem2ElectiveType = type;
    window.g12Sem2ElectiveSubtype = null;
    
    // Show/hide subtype panels
    const academicPanel = document.getElementById('g12Sem2AcademicSubtypes');
    const techproPanel = document.getElementById('g12Sem2TechproSubtypes');
    
    if (academicPanel) academicPanel.style.display = type === 'academic' ? 'block' : 'none';
    if (techproPanel) techproPanel.style.display = type === 'techpro' ? 'block' : 'none';
    
    renderG12Sem2Subjects();
}

function filterG12Sem1ByElective(type, subtype) {
    window.g12Sem1ElectiveType = type;
    window.g12Sem1ElectiveSubtype = subtype;
    renderG12Sem1Subjects();
}

function filterG12Sem2ByElective(type, subtype) {
    window.g12Sem2ElectiveType = type;
    window.g12Sem2ElectiveSubtype = subtype;
    renderG12Sem2Subjects();
}

function renderG12Sem1Subjects() {
    const electiveType = window.g12Sem1ElectiveType || 'none';
    const electiveSubtype = window.g12Sem1ElectiveSubtype || null;
    const selectedStrand = window.g12Sem1SelectedStrand || 'all';
    const subjects = subjectsCache.g12Sem1 || [];
    const currentCurr = window.currentCurriculum || 'new';
    
    const renderSubjectCard = (s, idx, color, badgeLabel, badgeColor, electiveSubtype = null) => {
        const categoryBadge = `<span style="font-size:9px;padding:2px 6px;background:${badgeColor};color:${badgeLabel === 'CORE' ? '#22c55e' : (badgeLabel === 'ACADEMIC' ? '#06b6d4' : '#f97316')};border-radius:4px;font-weight:700;margin-left:auto">${badgeLabel}</span>`;
        const unitsDisplay = s.units ? `<span style="font-size:10px;color:var(--text2);margin-left:8px">${s.units} units/week</span>` : '';
        
        const titleDisplay = electiveSubtype 
            ? `<div style="font-size:14px;font-weight:600;color:var(--text1)">${electiveSubtype.toUpperCase()}</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${s.name}</div>`
            : `<div style="font-size:14px;font-weight:600;color:var(--text1)">${s.name}</div>`;
        
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1)" 
             onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${color}33'" 
             onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            <div style="flex-shrink:0;width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${idx + 1}</div>
            <div style="flex:1">
                ${titleDisplay}
                ${unitsDisplay}
            </div>
            ${categoryBadge}
            <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || ''}')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#3b82f6;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                title="Edit subject">✏</button>
            <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                title="Remove subject">✕</button>
        </div>`;
    };
    
    if (subjects.length === 0) {
        document.getElementById('g12Sem1SubjectsList').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">📙</div><p style="font-size:13px">No subjects yet</p></div>`;
        return;
    }
    
    const color = 'linear-gradient(135deg,#06b6d4,#0891b2)';
    const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
    const appliedSubjects = subjects.filter(s => s.category === 'applied');
    
    let html = '';
    
    // Always show core subjects
    if (coreSubjects.length > 0) {
        html += '<div style="margin-bottom:20px">';
        html += '<div style="font-size:11px;font-weight:800;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:6px;display:inline-block">📚 CORE SUBJECTS</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + coreSubjects.map((s, idx) => renderSubjectCard(s, idx, color, 'CORE', 'rgba(34,197,94,0.15)')).join('') + '</div>';
        html += '</div>';
    }
    
    // For new curriculum: group electives by type, then by subtype
    if (currentCurr === 'new' && appliedSubjects.length > 0) {
        const academicElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'academic');
        const techproElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'techpro');
        
        if (electiveType === 'none' || electiveType === 'academic') {
            let filteredAcademic = academicElectives;
            if (electiveType === 'academic' && electiveSubtype) {
                filteredAcademic = academicElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredAcademic.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#06b6d4;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(6,182,212,0.1);border-left:4px solid #06b6d4;border-radius:6px">🎓 ACADEMIC</div>';
                
                const groupedBySubtype = {};
                filteredAcademic.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                Object.keys(groupedBySubtype).forEach(subtype => {
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'ACADEMIC', 'rgba(6,182,212,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
        
        if (electiveType === 'none' || electiveType === 'techpro') {
            let filteredTechpro = techproElectives;
            if (electiveType === 'techpro' && electiveSubtype) {
                filteredTechpro = techproElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredTechpro.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#f97316;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(251,146,60,0.1);border-left:4px solid #f97316;border-radius:6px">🔧 TECHPRO</div>';
                
                const groupedBySubtype = {};
                filteredTechpro.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                Object.keys(groupedBySubtype).forEach(subtype => {
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'TECHPRO', 'rgba(251,146,60,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
    } else if (currentCurr === 'old' && appliedSubjects.length > 0) {
        // For old curriculum: filter by strand
        const filteredSubjects = appliedSubjects.filter(s => {
            if (selectedStrand === 'all') return true;
            return s.strand === selectedStrand || s.strand === 'all';
        });
        
        if (filteredSubjects.length > 0) {
            html += '<div>';
            html += '<div style="font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(251,146,60,0.1);border-radius:6px;display:inline-block">🎯 APPLIED/SPECIALIZED SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + filteredSubjects.map((s, idx) => {
                const badgeLabel = s.strand && s.strand !== 'all' ? `APPLIED - ${s.strand}` : 'APPLIED';
                return renderSubjectCard(s, idx, color, badgeLabel, 'rgba(251,146,60,0.15)');
            }).join('') + '</div>';
            html += '</div>';
        }
    }
    
    document.getElementById('g12Sem1SubjectsList').innerHTML = html;
}

function renderG12Sem2Subjects() {
    const electiveType = window.g12Sem2ElectiveType || 'none';
    const electiveSubtype = window.g12Sem2ElectiveSubtype || null;
    const selectedStrand = window.g12Sem2SelectedStrand || 'all';
    const subjects = subjectsCache.g12Sem2 || [];
    const currentCurr = window.currentCurriculum || 'new';
    
    const renderSubjectCard = (s, idx, color, badgeLabel, badgeColor, electiveSubtype = null) => {
        const categoryBadge = `<span style="font-size:9px;padding:2px 6px;background:${badgeColor};color:${badgeLabel === 'CORE' ? '#22c55e' : (badgeLabel === 'ACADEMIC' ? '#ec4899' : '#f97316')};border-radius:4px;font-weight:700;margin-left:auto">${badgeLabel}</span>`;
        const unitsDisplay = s.units ? `<span style="font-size:10px;color:var(--text2);margin-left:8px">${s.units} units/week</span>` : '';
        
        const titleDisplay = electiveSubtype 
            ? `<div style="font-size:14px;font-weight:600;color:var(--text1)">${electiveSubtype.toUpperCase()}</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${s.name}</div>`
            : `<div style="font-size:14px;font-weight:600;color:var(--text1)">${s.name}</div>`;
        
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.1)" 
             onmouseover="this.style.borderColor='${color}';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px ${color}33'" 
             onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
            <div style="flex-shrink:0;width:32px;height:32px;background:${color};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${idx + 1}</div>
            <div style="flex:1">
                ${titleDisplay}
                ${unitsDisplay}
            </div>
            ${categoryBadge}
            <button onclick="openEditSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs','${s.category || 'core'}','${s.curriculum || 'new'}','${s.units || ''}')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:6px;color:#3b82f6;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#3b82f6';this.style.color='#fff';this.style.borderColor='#3b82f6'" 
                onmouseout="this.style.background='rgba(59,130,246,0.1)';this.style.color='#3b82f6';this.style.borderColor='rgba(59,130,246,0.3)'"
                title="Edit subject">✏</button>
            <button onclick="removeSubject('${s.id}','${s.name.replace(/'/g,"\\'")}','shs')" 
                style="flex-shrink:0;width:28px;height:28px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:6px;color:#ef4444;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all 0.2s" 
                onmouseover="this.style.background='#ef4444';this.style.color='#fff';this.style.borderColor='#ef4444'" 
                onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';this.style.borderColor='rgba(239,68,68,0.3)'"
                title="Remove subject">✕</button>
        </div>`;
    };
    
    if (subjects.length === 0) {
        document.getElementById('g12Sem2SubjectsList').innerHTML = `<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:36px;margin-bottom:8px">📕</div><p style="font-size:13px">No subjects yet</p></div>`;
        return;
    }
    
    const color = 'linear-gradient(135deg,#ec4899,#db2777)';
    const coreSubjects = subjects.filter(s => s.category === 'core' || !s.category);
    const appliedSubjects = subjects.filter(s => s.category === 'applied');
    
    let html = '';
    
    // Always show core subjects
    if (coreSubjects.length > 0) {
        html += '<div style="margin-bottom:20px">';
        html += '<div style="font-size:11px;font-weight:800;color:#22c55e;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(34,197,94,0.1);border-radius:6px;display:inline-block">📚 CORE SUBJECTS</div>';
        html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + coreSubjects.map((s, idx) => renderSubjectCard(s, idx, color, 'CORE', 'rgba(34,197,94,0.15)')).join('') + '</div>';
        html += '</div>';
    }
    
    // For new curriculum: group electives by type, then by subtype
    if (currentCurr === 'new' && appliedSubjects.length > 0) {
        const academicElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'academic');
        const techproElectives = appliedSubjects.filter(s => !s.elective_type || s.elective_type === 'all' || s.elective_type === 'techpro');
        
        if (electiveType === 'none' || electiveType === 'academic') {
            let filteredAcademic = academicElectives;
            if (electiveType === 'academic' && electiveSubtype) {
                filteredAcademic = academicElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredAcademic.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#ec4899;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(236,72,153,0.1);border-left:4px solid #ec4899;border-radius:6px">🎓 ACADEMIC</div>';
                
                const groupedBySubtype = {};
                filteredAcademic.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                Object.keys(groupedBySubtype).forEach(subtype => {
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'ACADEMIC', 'rgba(236,72,153,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
        
        if (electiveType === 'none' || electiveType === 'techpro') {
            let filteredTechpro = techproElectives;
            if (electiveType === 'techpro' && electiveSubtype) {
                filteredTechpro = techproElectives.filter(s => !s.elective_subtype || s.elective_subtype === electiveSubtype);
            }
            
            if (filteredTechpro.length > 0) {
                html += '<div style="margin-bottom:24px">';
                html += '<div style="font-size:16px;font-weight:800;color:#f97316;letter-spacing:1px;margin-bottom:16px;padding:12px 16px;background:rgba(251,146,60,0.1);border-left:4px solid #f97316;border-radius:6px">🔧 TECHPRO</div>';
                
                const groupedBySubtype = {};
                filteredTechpro.forEach(s => {
                    const subtype = s.elective_subtype || 'Other';
                    if (!groupedBySubtype[subtype]) {
                        groupedBySubtype[subtype] = [];
                    }
                    groupedBySubtype[subtype].push(s);
                });
                
                Object.keys(groupedBySubtype).forEach(subtype => {
                    const subjects = groupedBySubtype[subtype];
                    html += '<div style="margin-bottom:16px;margin-left:16px">';
                    html += `<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:6px">${subtype.toUpperCase()}</div>`;
                    html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + subjects.map((s, idx) => {
                        return renderSubjectCard(s, idx, color, 'TECHPRO', 'rgba(251,146,60,0.15)', null);
                    }).join('') + '</div>';
                    html += '</div>';
                });
                
                html += '</div>';
            }
        }
    } else if (currentCurr === 'old' && appliedSubjects.length > 0) {
        // For old curriculum: filter by strand
        const filteredSubjects = appliedSubjects.filter(s => {
            if (selectedStrand === 'all') return true;
            return s.strand === selectedStrand || s.strand === 'all';
        });
        
        if (filteredSubjects.length > 0) {
            html += '<div>';
            html += '<div style="font-size:11px;font-weight:800;color:#f97316;letter-spacing:0.5px;margin-bottom:8px;padding:4px 8px;background:rgba(251,146,60,0.1);border-radius:6px;display:inline-block">🎯 APPLIED/SPECIALIZED SUBJECTS</div>';
            html += '<div style="display:grid;grid-template-columns:1fr;gap:8px">' + filteredSubjects.map((s, idx) => {
                const badgeLabel = s.strand && s.strand !== 'all' ? `APPLIED - ${s.strand}` : 'APPLIED';
                return renderSubjectCard(s, idx, color, badgeLabel, 'rgba(251,146,60,0.15)');
            }).join('') + '</div>';
            html += '</div>';
        }
    }
    
    document.getElementById('g12Sem2SubjectsList').innerHTML = html;
}

function filterG11Sem1ByStrand(strand) {
    window.g11Sem1SelectedStrand = strand;
    renderG11Sem1Subjects();
}

function filterG11Sem2ByStrand(strand) {
    window.g11Sem2SelectedStrand = strand;
    renderG11Sem2Subjects();
}

function filterG11Sem1ByStrand(strand) {
    window.g11Sem1SelectedStrand = strand;
    renderG11Sem1Subjects();
}

function filterG11Sem2ByStrand(strand) {
    window.g11Sem2SelectedStrand = strand;
    renderG11Sem2Subjects();
}

function filterG12Sem1ByStrand(strand) {
    window.g12Sem1SelectedStrand = strand;
    renderG12Sem1Subjects();
}

function filterG12Sem2ByStrand(strand) {
    window.g12Sem2SelectedStrand = strand;
    renderG12Sem2Subjects();
}

function openAddSubject(type, semester = 'both', grade = 'both', term = 'all') {
    const gradeLabel = grade === '11' ? ' (Grade 11)' : grade === '12' ? ' (Grade 12)' : '';
    const semLabel = semester === '1' ? ' - 1st Semester' : semester === '2' ? ' - 2nd Semester' : '';
    const termLabel = term === '1' ? ' - 1st Term' : term === '2' ? ' - 2nd Term' : term === '3' ? ' - 3rd Term' : '';
    const title = type === 'jhs' ? 'Add JHS Subject' + termLabel : 'Add SHS Subject' + gradeLabel + semLabel;
    const modalId = 'addSubjectModal';
    const currentCurr = window.currentCurriculum || 'new';
    
    // Determine if we should show elective types (Grade 11 or 12 + new curriculum) or strands
    const showElectiveTypes = ((grade === '11' || grade === '12') && currentCurr === 'new');
    
    // Determine category options based on type and curriculum
    let categoryOptionsHTML = '';
    if (type === 'jhs') {
        // For JHS (both curricula): show Major/Minor
        categoryOptionsHTML = `
            <option value="major">Major Subject</option>
            <option value="minor">Minor Subject</option>`;
    } else {
        // For SHS: show Core/Applied
        categoryOptionsHTML = `
            <option value="core">Core Subject</option>
            <option value="applied">Applied/Specialized Subject</option>`;
    }
    
    // Build the strand/elective field HTML
    let strandFieldHTML = '';
    if (showElectiveTypes) {
        // For Grade 11 or 12 new curriculum: show Academic/TechPro
        strandFieldHTML = `
            <div id="strandFieldContainer" style="display:none">
                <label class="form-label" style="margin-top:16px">Elective Type (for Applied Subjects)</label>
                <select id="subjectElectiveType" class="form-input" onchange="toggleElectiveSubtype()">
                    <option value="">-- Select Elective Type --</option>
                    <option value="academic">Academic</option>
                    <option value="techpro">TechPro</option>
                </select>
                <p class="form-hint">Select which elective type this applied subject belongs to</p>
                <div id="electiveSubtypeContainer" style="display:none;margin-top:12px">
                    <label class="form-label">Elective Subtype (Optional)</label>
                    <select id="subjectElectiveSubtype" class="form-input">
                        <option value="">-- No Subtype --</option>
                    </select>
                    <p class="form-hint">Optional: Select a specific subtype for this elective</p>
                </div>
            </div>`;
    } else {
        // For old curriculum: show traditional strands
        strandFieldHTML = `
            <div id="strandFieldContainer" style="display:none">
                <label class="form-label" style="margin-top:16px">Strand (for Applied Subjects)</label>
                <select id="subjectStrand" class="form-input">
                    <option value="all">All Strands</option>
                    <option value="ABM">ABM</option>
                    <option value="STEM">STEM</option>
                    <option value="TVL">TVL</option>
                    <option value="HUMSS">HUMSS</option>
                </select>
                <p class="form-hint">Select which strand this applied subject belongs to</p>
            </div>`;
    }
    
    // Build the JHS term field HTML (only for JHS subjects in new curriculum)
    let termFieldHTML = '';
    if (type === 'jhs' && currentCurr === 'new') {
        termFieldHTML = `
            <label class="form-label" style="margin-top:16px">Term (for JHS Subjects)</label>
            <select id="subjectTerm" class="form-input">
                <option value="all">All Terms</option>
                <option value="1">1st Term</option>
                <option value="2">2nd Term</option>
                <option value="3">3rd Term</option>
            </select>
            <p class="form-hint">Select which term this JHS subject belongs to</p>`;
    }
    
    if (!document.getElementById(modalId)) {
        ensureModal(modalId,
            `<div class="modal-header"><h3 id="addSubjectTitle">${title}</h3><button class="panel-close" onclick="closeAddSubject()">X</button></div>` +
            '<div class="modal-body">' +
                '<input type="hidden" id="subjectType">' +
                '<input type="hidden" id="subjectGrade">' +
                '<input type="hidden" id="subjectSemester">' +
                '<label class="form-label">Subject Name</label>' +
                '<input type="text" id="newSubjectName" class="form-input" placeholder="e.g. MATHEMATICS or ORAL COMMUNICATION" onkeydown="if(event.key===\'Enter\')submitAddSubject()">' +
                '<p class="form-hint">Enter the subject name in UPPERCASE</p>' +
                '<label class="form-label" style="margin-top:16px">Subject Category</label>' +
                '<select id="subjectCategory" class="form-input" onchange="toggleStrandField()">' +
                    categoryOptionsHTML +
                '</select>' +
                '<p class="form-hint" id="categoryHint">Core subjects are required for all students, Applied/Specialized are track-specific</p>' +
                '<label class="form-label" style="margin-top:16px">Units per Week</label>' +
                '<input type="number" id="subjectUnits" class="form-input" placeholder="e.g. 3" min="1" max="10" style="width:120px">' +
                '<p class="form-hint">Number of periods/hours per week for this subject</p>' +
                strandFieldHTML +
                '<label class="form-label" style="margin-top:16px">Curriculum</label>' +
                '<select id="subjectCurriculum" class="form-input">' +
                    '<option value="new">New Curriculum (Matatag)</option>' +
                    '<option value="old">Old Curriculum (K-12)</option>' +
                '</select>' +
                '<p class="form-hint">Select which curriculum this subject belongs to</p>' +
                termFieldHTML +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeAddSubject()">Cancel</button><button class="btn-confirm" onclick="submitAddSubject()">Add Subject</button></div>'
        );
    } else {
        // Update the category options if modal already exists
        const categorySelect = document.getElementById('subjectCategory');
        if (categorySelect) {
            categorySelect.innerHTML = categoryOptionsHTML;
        }
        
        // Update the strand field container if modal already exists
        const container = document.getElementById('strandFieldContainer');
        if (container && container.parentElement) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = strandFieldHTML;
            container.parentElement.replaceChild(tempDiv.firstElementChild, container);
        }
    }
    
    // Update category hint text
    const categoryHint = document.getElementById('categoryHint');
    if (categoryHint) {
        if (type === 'jhs') {
            categoryHint.textContent = 'Major subjects are core academic subjects, Minor subjects are additional subjects';
        } else {
            categoryHint.textContent = 'Core subjects are required for all students, Applied/Specialized are track-specific';
        }
    }
    
    document.getElementById('subjectType').value = type;
    document.getElementById('subjectGrade').value = grade;
    document.getElementById('subjectSemester').value = semester;
    document.getElementById('newSubjectName').value = '';
    document.getElementById('subjectCategory').value = type === 'jhs' ? 'major' : 'core';
    document.getElementById('subjectCurriculum').value = currentCurr;
    document.getElementById('subjectUnits').value = '';
    
    // Initialize term field for JHS subjects
    if (type === 'jhs') {
        const termField = document.getElementById('subjectTerm');
        if (termField) {
            termField.value = term;
        }
    }
    
    // Initialize strand/elective fields
    if (showElectiveTypes) {
        const electiveTypeField = document.getElementById('subjectElectiveType');
        const electiveSubtypeField = document.getElementById('subjectElectiveSubtype');
        if (electiveTypeField) electiveTypeField.value = '';
        if (electiveSubtypeField) electiveSubtypeField.value = '';
        const subtypeContainer = document.getElementById('electiveSubtypeContainer');
        if (subtypeContainer) subtypeContainer.style.display = 'none';
    } else {
        const strandField = document.getElementById('subjectStrand');
        if (strandField) strandField.value = 'all';
    }
    
    document.getElementById('strandFieldContainer').style.display = 'none';
    document.getElementById('addSubjectTitle').textContent = title;
    document.getElementById('addSubjectModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('newSubjectName').focus(), 50);
}

async function toggleElectiveSubtype() {
    const electiveType = document.getElementById('subjectElectiveType')?.value;
    const subtypeContainer = document.getElementById('electiveSubtypeContainer');
    
    if (subtypeContainer) {
        if (electiveType === 'academic' || electiveType === 'techpro') {
            subtypeContainer.style.display = 'block';
            await populateElectiveSubtypeDropdown('subjectElectiveSubtype', electiveType);
        } else {
            subtypeContainer.style.display = 'none';
            const subtypeSelect = document.getElementById('subjectElectiveSubtype');
            if (subtypeSelect) subtypeSelect.value = '';
        }
    }
}

function toggleStrandField() {
    const category = document.getElementById('subjectCategory').value;
    const strandContainer = document.getElementById('strandFieldContainer');
    if (strandContainer) {
        strandContainer.style.display = category === 'applied' ? 'block' : 'none';
    }
}

function closeAddSubject() {
    const m = document.getElementById('addSubjectModal');
    if (m) m.classList.add('hidden');
}

async function submitAddSubject() {
    const name = document.getElementById('newSubjectName').value.trim().toUpperCase();
    const type = document.getElementById('subjectType').value;
    const grade = document.getElementById('subjectGrade').value;
    const semester = document.getElementById('subjectSemester').value;
    const category = document.getElementById('subjectCategory').value;
    const curriculum = document.getElementById('subjectCurriculum').value;
    const units = document.getElementById('subjectUnits').value.trim();
    
    let strand = 'all';
    let electiveType = null;
    let electiveSubtype = null;
    let term = 'all';
    
    // Get term for JHS subjects in new curriculum
    if (type === 'jhs' && curriculum === 'new') {
        const termField = document.getElementById('subjectTerm');
        if (termField) {
            term = termField.value;
        }
    }
    
    if (category === 'applied') {
        // Check if we're using elective types (Grade 11 new curriculum) or strands
        const electiveTypeField = document.getElementById('subjectElectiveType');
        const strandField = document.getElementById('subjectStrand');
        
        if (electiveTypeField) {
            // Grade 11 new curriculum: use elective type
            electiveType = electiveTypeField.value;
            
            // Validate that an elective type is selected
            if (!electiveType) {
                showToast('⚠ Please select an elective type (Academic or TechPro)', 'error');
                return;
            }
            
            const electiveSubtypeField = document.getElementById('subjectElectiveSubtype');
            if (electiveSubtypeField && electiveSubtypeField.value) {
                electiveSubtype = electiveSubtypeField.value;
            }
        } else if (strandField) {
            // Grade 12 or old curriculum: use strand
            strand = strandField.value;
        }
    }
    
    if (!name) { 
        showToast('⚠ Enter a subject name', 'error'); 
        return; 
    }
    
    if (!units || isNaN(units) || parseInt(units) < 1) {
        showToast('⚠ Enter valid units per week (1 or more)', 'error');
        return;
    }
    
    const res = await apiFetch(API.subjects, {
        method: 'POST',
        body: JSON.stringify({ 
            name, 
            type, 
            grade, 
            semester, 
            term,
            category, 
            curriculum, 
            strand,
            elective_type: electiveType,
            elective_subtype: electiveSubtype,
            units: parseInt(units)
        }),
    });
    
    if (res?.success) {
        closeAddSubject();
        renderSubjectsView();
        showToast('✓ Subject added', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}

async function filterByCurriculum(curriculum) {
    window.currentCurriculum = curriculum;
    
    // Save to localStorage so it persists across page reloads
    localStorage.setItem('selectedCurriculum', curriculum);
    
    // Sync with G12 Section curriculum
    window.g12SectionCurriculum = curriculum;
    const g12CurrRadios = document.querySelectorAll('input[name="g12Curriculum"]');
    g12CurrRadios.forEach(radio => {
        radio.checked = radio.value === curriculum;
    });
    
    // Reload subjects from database with new curriculum filter
    await renderSubjectsView();
    
    showToast(`Switched to ${curriculum === 'new' ? 'New Curriculum (Matatag)' : 'Old Curriculum (K-12)'}`, 'success');
}

async function switchEditCurriculum(curriculum) {
    // Update global curriculum
    window.currentCurriculum = curriculum;
    localStorage.setItem('selectedCurriculum', curriculum);
    
    // Check if SHS is checked
    const shsChecked = document.getElementById('editDeptSHS')?.checked;
    const jhsChecked = document.getElementById('editDeptJHS')?.checked;
    
    // Show/hide JHS term panel for new curriculum
    const jhsTermPanel = document.getElementById('editJhsTermPanel');
    if (jhsTermPanel) {
        jhsTermPanel.style.display = (curriculum === 'new' && jhsChecked) ? 'block' : 'none';
        // Set default term to current term from dashboard
        if (curriculum === 'new' && jhsChecked) {
            const currentTerm = window.currentTerm || '1';
            window.editSelectedJhsTerm = currentTerm;
            const termRadios = document.querySelectorAll('input[name="editJhsTerm"]');
            termRadios.forEach(radio => {
                radio.checked = radio.value === currentTerm;
            });
        }
    }
    
    // Show/hide SHS semester panel
    const shsSemesterPanel = document.getElementById('editShsSemesterPanel');
    if (shsSemesterPanel) {
        shsSemesterPanel.style.display = shsChecked ? 'block' : 'none';
        // Set default semester to current semester from dashboard
        if (shsChecked) {
            const currentSemester = window.currentSemester || '1';
            window.editSelectedShsSemester = currentSemester;
            const semesterRadios = document.querySelectorAll('input[name="editShsSemester"]');
            semesterRadios.forEach(radio => {
                radio.checked = radio.value === currentSemester;
            });
        }
    }
    
    // Show/hide strand panel for old curriculum
    const strandPanel = document.getElementById('editStrandPanel');
    const electiveTypePanel = document.getElementById('editElectiveTypePanel');
    
    if (strandPanel) {
        strandPanel.style.display = (curriculum === 'old' && shsChecked) ? 'block' : 'none';
        // Reset strand selection when switching curriculum
        if (curriculum === 'new') {
            window.editSelectedStrand = 'all';
        } else {
            // Default to ABM for old curriculum
            window.editSelectedStrand = 'ABM';
            const strandRadios = document.querySelectorAll('input[name="editStrand"]');
            strandRadios.forEach(radio => {
                radio.checked = radio.value === 'ABM';
            });
        }
    }
    
    // Show/hide elective type panel for new curriculum + SHS
    if (electiveTypePanel) {
        electiveTypePanel.style.display = (curriculum === 'new' && shsChecked) ? 'block' : 'none';
        // Reset elective type selection
        if (curriculum === 'new' && shsChecked) {
            window.editSelectedElectiveType = 'academic';
            const electiveRadios = document.querySelectorAll('input[name="editElectiveType"]');
            electiveRadios.forEach(radio => {
                radio.checked = radio.value === 'academic';
            });
        } else {
            window.editSelectedElectiveType = 'all';
        }
    }
    
    // Reload subjects from database
    await loadSubjectsFromDB();
    
    // Reload the subjects table with new curriculum
    if (document.getElementById('editTeacherSubjectsTable')) {
        await loadEditTeacherSubjects();
    }
}

async function switchNewCurriculum(curriculum) {
    // Update global curriculum
    window.currentCurriculum = curriculum;
    localStorage.setItem('selectedCurriculum', curriculum);
    
    // Show/hide strand panel for old curriculum
    const strandPanel = document.getElementById('newStrandPanel');
    if (strandPanel) {
        strandPanel.style.display = curriculum === 'old' ? 'block' : 'none';
        // Reset strand selection when switching curriculum
        if (curriculum === 'new') {
            window.newSelectedStrand = 'all';
        } else {
            // Default to ABM for old curriculum
            window.newSelectedStrand = 'ABM';
            const strandRadios = document.querySelectorAll('input[name="newStrand"]');
            strandRadios.forEach(radio => {
                radio.checked = radio.value === 'ABM';
            });
        }
    }
    
    // Reload subjects from database
    await loadSubjectsFromDB();
    
    // Remember currently checked subjects
    const checkedSubjects = Array.from(document.querySelectorAll('[data-new-subj]:checked')).map(cb => cb.value);
    
    // Regenerate subject checkboxes with new curriculum
    const box = document.getElementById('newTeacherSubjectsBox');
    if (box) {
        box.innerHTML = subjectCheckboxes('new');
        
        // Re-check subjects that were previously checked (if they exist in new curriculum)
        checkedSubjects.forEach(subj => {
            const cb = box.querySelector(`[data-new-subj][value="${subj}"]`);
            if (cb) cb.checked = true;
        });
        
        // Reapply department filters
        filterNewSubjects();
    }
}

function filterEditByStrand(strand) {
    window.editSelectedStrand = strand;
    
    // Reload the subjects table with new strand filter
    if (document.getElementById('editTeacherSubjectsTable')) {
        loadEditTeacherSubjects();
    }
}

function filterEditByJhsTerm(term) {
    window.editSelectedJhsTerm = term;
    window.currentTerm = term;
    
    // Reload the subjects table with new term filter
    if (document.getElementById('editTeacherSubjectsTable')) {
        loadEditTeacherSubjects();
    }
}

function filterEditByShsSemester(semester) {
    window.editSelectedShsSemester = semester;
    window.currentSemester = semester;
    
    // Reload the subjects table with new semester filter
    if (document.getElementById('editTeacherSubjectsTable')) {
        loadEditTeacherSubjects();
    }
}

function filterEditByElectiveType(electiveType) {
    window.editSelectedElectiveType = electiveType;
    
    // AUTO-SAVE: Remember the selected elective type in localStorage
    localStorage.setItem('editTeacherElectiveType', electiveType);
    
    // Show/hide subtype panels based on elective type
    const academicSubtypePanel = document.getElementById('editAcademicSubtypePanel');
    const techproSubtypePanel = document.getElementById('editTechproSubtypePanel');
    
    if (academicSubtypePanel) {
        academicSubtypePanel.style.display = electiveType === 'academic' ? 'block' : 'none';
    }
    if (techproSubtypePanel) {
        techproSubtypePanel.style.display = electiveType === 'techpro' ? 'block' : 'none';
    }
    
    // Reset subtype selection when switching elective type
    window.editSelectedElectiveSubtype = null;
    localStorage.removeItem('editTeacherElectiveSubtype'); // Clear saved subtype
    
    // Reload the subjects table with new elective type filter
    if (document.getElementById('editTeacherSubjectsTable')) {
        loadEditTeacherSubjects();
    }
}

function filterEditByElectiveSubtype(electiveType, subtype) {
    window.editSelectedElectiveSubtype = subtype;
    
    // AUTO-SAVE: Remember the selected subtype in localStorage
    localStorage.setItem('editTeacherElectiveSubtype', subtype);
    
    // Reload the subjects table with new subtype filter
    if (document.getElementById('editTeacherSubjectsTable')) {
        loadEditTeacherSubjects();
    }
}

function filterNewByStrand(strand) {
    window.newSelectedStrand = strand;
    
    // Remember currently checked subjects
    const checkedSubjects = Array.from(document.querySelectorAll('[data-new-subj]:checked')).map(cb => cb.value);
    
    // Regenerate subject checkboxes with new strand filter
    const box = document.getElementById('newTeacherSubjectsBox');
    if (box) {
        box.innerHTML = subjectCheckboxes('new');
        
        // Re-check subjects that were previously checked (if they exist in new strand)
        checkedSubjects.forEach(subj => {
            const cb = box.querySelector(`[data-new-subj][value="${subj}"]`);
            if (cb) cb.checked = true;
        });
        
        // Reapply department filters
        filterNewSubjects();
    }
}

async function openEditSubject(id, name, type, category, curriculum, units) {
    const modalId = 'editSubjectModal';
    
    // Fetch full subject data to get elective_type, elective_subtype, grade, etc.
    const subjectRes = await apiFetch(API.subjects + '?id=' + id);
    const subject = subjectRes?.subject || {};
    
    // Determine category options based on type
    let categoryOptionsHTML = '';
    if (type === 'jhs') {
        // For JHS: show Major/Minor
        categoryOptionsHTML = `
            <option value="major">Major Subject</option>
            <option value="minor">Minor Subject</option>`;
    } else {
        // For SHS: show Core/Applied
        categoryOptionsHTML = `
            <option value="core">Core Subject</option>
            <option value="applied">Applied/Specialized Subject</option>`;
    }
    
    // Determine hint text based on type
    const categoryHintText = type === 'jhs'
        ? 'Major subjects are core academic subjects, Minor subjects are additional subjects'
        : 'Core subjects are required for all students, Applied/Specialized are track-specific';
    
    // Check if we should show elective types (SHS + new curriculum)
    const showElectiveTypes = (type === 'shs' && (curriculum === 'new' || subject.curriculum === 'new'));
    
    // Build elective fields HTML
    let electiveFieldsHTML = '';
    if (showElectiveTypes) {
        electiveFieldsHTML = `
            <div id="editElectiveFieldContainer" style="display:none;margin-top:16px">
                <label class="form-label">Elective Type (for Applied Subjects)</label>
                <select id="editSubjectElectiveType" class="form-input" onchange="toggleEditElectiveSubtype()">
                    <option value="">-- Select Elective Type --</option>
                    <option value="academic">Academic</option>
                    <option value="techpro">TechPro</option>
                </select>
                <p class="form-hint">Select which elective type this applied subject belongs to</p>
                <div id="editElectiveSubtypeContainer" style="display:none;margin-top:12px">
                    <label class="form-label">Elective Subtype (Optional)</label>
                    <select id="editSubjectElectiveSubtype" class="form-input">
                        <option value="">-- No Subtype --</option>
                    </select>
                    <p class="form-hint">Optional: Select a specific subtype for this elective</p>
                </div>
            </div>`;
    }
    
    if (!document.getElementById(modalId)) {
        ensureModal(modalId,
            `<div class="modal-header"><h3>✏ Edit Subject</h3><button class="panel-close" onclick="closeEditSubject()">✕</button></div>` +
            '<div class="modal-body">' +
                '<input type="hidden" id="editSubjectId">' +
                '<input type="hidden" id="editSubjectType">' +
                '<input type="hidden" id="editSubjectGrade">' +
                '<label class="form-label">Subject Name</label>' +
                '<input type="text" id="editSubjectName" class="form-input" placeholder="e.g. MATHEMATICS or ORAL COMMUNICATION" onkeydown="if(event.key===\'Enter\')submitEditSubject()">' +
                '<p class="form-hint">Enter the subject name in UPPERCASE</p>' +
                '<label class="form-label" style="margin-top:16px">Subject Category</label>' +
                '<select id="editSubjectCategory" class="form-input" onchange="toggleEditElectiveField()">' +
                    categoryOptionsHTML +
                '</select>' +
                '<p class="form-hint" id="editCategoryHint">' + categoryHintText + '</p>' +
                '<label class="form-label" style="margin-top:16px">Units per Week</label>' +
                '<input type="number" id="editSubjectUnits" class="form-input" placeholder="e.g. 3" min="1" max="10" style="width:120px">' +
                '<p class="form-hint">Number of periods/hours per week for this subject</p>' +
                electiveFieldsHTML +
                '<label class="form-label" style="margin-top:16px">Curriculum</label>' +
                '<select id="editSubjectCurriculum" class="form-input">' +
                    '<option value="new">New Curriculum (Matatag)</option>' +
                    '<option value="old">Old Curriculum (K-12)</option>' +
                '</select>' +
                '<p class="form-hint">Select which curriculum this subject belongs to</p>' +
            '</div>' +
            '<div class="modal-footer"><button class="btn-cancel" onclick="closeEditSubject()">Cancel</button><button class="btn-confirm" onclick="submitEditSubject()">Save Changes</button></div>'
        );
    } else {
        // Update category options if modal already exists
        const categorySelect = document.getElementById('editSubjectCategory');
        if (categorySelect) {
            categorySelect.innerHTML = categoryOptionsHTML;
        }
        
        // Update hint text
        const categoryHint = document.getElementById('editCategoryHint');
        if (categoryHint) {
            categoryHint.textContent = categoryHintText;
        }
        
        // Update elective fields container if modal already exists
        const electiveContainer = document.getElementById('editElectiveFieldContainer');
        if (showElectiveTypes && !electiveContainer) {
            // Need to add elective fields
            const unitsHint = document.querySelector('#editSubjectUnits').nextElementSibling;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = electiveFieldsHTML;
            unitsHint.parentNode.insertBefore(tempDiv.firstElementChild, unitsHint.nextSibling);
        }
    }
    
    document.getElementById('editSubjectId').value = id;
    document.getElementById('editSubjectType').value = type;
    document.getElementById('editSubjectGrade').value = subject.grade || '11';
    document.getElementById('editSubjectName').value = name;
    document.getElementById('editSubjectCategory').value = category || (type === 'jhs' ? 'major' : 'core');
    document.getElementById('editSubjectCurriculum').value = curriculum || 'new';
    document.getElementById('editSubjectUnits').value = units || '';
    
    // Set elective type and subtype if available
    if (showElectiveTypes) {
        const electiveTypeField = document.getElementById('editSubjectElectiveType');
        const electiveSubtypeField = document.getElementById('editSubjectElectiveSubtype');
        
        if (electiveTypeField) {
            electiveTypeField.value = subject.elective_type || '';
            if (subject.elective_type) {
                await populateEditElectiveSubtypeDropdown(subject.elective_type);
                if (electiveSubtypeField) {
                    electiveSubtypeField.value = subject.elective_subtype || '';
                }
            }
        }
        
        // Show/hide elective fields based on category
        toggleEditElectiveField();
    }
    
    document.getElementById('editSubjectModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('editSubjectName').focus(), 50);
}

function toggleEditElectiveField() {
    const category = document.getElementById('editSubjectCategory')?.value;
    const electiveContainer = document.getElementById('editElectiveFieldContainer');
    if (electiveContainer) {
        electiveContainer.style.display = category === 'applied' ? 'block' : 'none';
    }
}

async function toggleEditElectiveSubtype() {
    const electiveType = document.getElementById('editSubjectElectiveType')?.value;
    const subtypeContainer = document.getElementById('editElectiveSubtypeContainer');
    
    if (subtypeContainer) {
        if (electiveType === 'academic' || electiveType === 'techpro') {
            subtypeContainer.style.display = 'block';
            await populateEditElectiveSubtypeDropdown(electiveType);
        } else {
            subtypeContainer.style.display = 'none';
            const subtypeSelect = document.getElementById('editSubjectElectiveSubtype');
            if (subtypeSelect) subtypeSelect.value = '';
        }
    }
}

async function populateEditElectiveSubtypeDropdown(type) {
    const select = document.getElementById('editSubjectElectiveSubtype');
    if (!select) return;
    
    // Get grade from the subject being edited
    const gradeField = document.getElementById('editSubjectGrade');
    const grade = gradeField ? gradeField.value : '11';
    
    const res = await apiFetch(API.electives + '?grade=' + grade);
    if (!res?.success) return;
    
    const subtypes = type === 'academic' ? res.academic : res.techpro;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- No Subtype --</option>';
    
    // Add options from database
    subtypes.forEach(subtype => {
        const option = document.createElement('option');
        option.value = subtype.name;
        option.textContent = subtype.name;
        select.appendChild(option);
    });
}

function closeEditSubject() {
    const m = document.getElementById('editSubjectModal');
    if (m) m.classList.add('hidden');
}

async function submitEditSubject() {
    const id = document.getElementById('editSubjectId').value;
    const name = document.getElementById('editSubjectName').value.trim().toUpperCase();
    const category = document.getElementById('editSubjectCategory').value;
    const curriculum = document.getElementById('editSubjectCurriculum').value;
    const units = document.getElementById('editSubjectUnits').value.trim();
    
    let electiveType = null;
    let electiveSubtype = null;
    
    // Get elective type and subtype if category is applied
    if (category === 'applied') {
        const electiveTypeField = document.getElementById('editSubjectElectiveType');
        if (electiveTypeField) {
            electiveType = electiveTypeField.value || null;
            
            const electiveSubtypeField = document.getElementById('editSubjectElectiveSubtype');
            if (electiveSubtypeField && electiveSubtypeField.value) {
                electiveSubtype = electiveSubtypeField.value;
            }
        }
    }
    
    if (!name) { showToast('Enter a subject name', 'error'); return; }
    
    if (!units || isNaN(units) || parseInt(units) < 1) {
        showToast('⚠ Enter valid units per week (1 or more)', 'error');
        return;
    }
    
    const res = await apiFetch(API.subjects, {
        method: 'PUT',
        body: JSON.stringify({ 
            id, 
            name, 
            category, 
            curriculum, 
            units: parseInt(units),
            elective_type: electiveType,
            elective_subtype: electiveSubtype
        }),
    });
    
    if (res?.success) {
        closeEditSubject();
        renderSubjectsView();
        showToast('✓ Subject updated', 'success');
    } else {
        showToast('✗ ' + (res?.error || 'Failed'), 'error');
    }
}

async function removeSubject(id, name, type) {
    if (!confirm(`Remove "${name}"? This will affect teacher subject assignments.`)) return;
    
    const res = await apiFetch(API.subjects + '?id=' + encodeURIComponent(id), { method: 'DELETE' });
    
    if (res?.success) {
        renderSubjectsView();
        showToast('✓ Subject removed', 'success');
    } else {
        showToast('✗ Failed to remove', 'error');
    }
}

// ============================================================
// STRAND MANAGEMENT
// ============================================================

function openManageStrands() {
    const modalId = 'manageStrandsModal';
    
    // Initialize current grade if not set
    if (!window.currentElectiveGrade) {
        window.currentElectiveGrade = '11';
    }
    
    if (!document.getElementById(modalId)) {
        ensureModal(modalId,
            '<div class="modal-header">' +
                '<h3 id="manageElectivesTitle">🎓 Manage Elective Types & Subtypes (Grade 11 New Curriculum)</h3>' +
                '<button class="panel-close" onclick="closeManageStrands()">✕</button>' +
            '</div>' +
            '<div class="modal-body" style="max-height:70vh;overflow-y:auto">' +
                '<div style="display:flex;gap:8px;margin-bottom:16px;padding:8px;background:var(--bg3);border-radius:8px">' +
                    '<button id="electiveGrade11Btn" class="btn-confirm" onclick="switchElectiveGrade(\'11\')" style="flex:1">Grade 11</button>' +
                    '<button id="electiveGrade12Btn" class="btn-cancel" onclick="switchElectiveGrade(\'12\')" style="flex:1">Grade 12</button>' +
                '</div>' +
                '<p class="form-hint" id="electiveGradeHint" style="margin-bottom:16px">Manage elective types and their subtypes for Grade 11 subjects in the new curriculum.</p>' +
                
                '<div style="margin-bottom:24px">' +
                    '<h4 style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--blue)">� Academic</h4>' +
                    '<div id="academicElectivesList"></div>' +
                    '<div style="margin-top:12px;padding:12px;background:var(--bg3);border-radius:8px">' +
                        '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Add Academic Subtype</div>' +
                        '<div style="display:flex;gap:8px">' +
                            '<input type="text" id="newAcademicSubtype" class="form-input" placeholder="e.g., Arts and Humanities" style="flex:1" onkeydown="if(event.key===\'Enter\')addElectiveSubtype(\'academic\')">' +
                            '<button class="btn-confirm" onclick="addElectiveSubtype(\'academic\')" style="white-space:nowrap">＋ Add</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                
                '<div style="margin-bottom:24px">' +
                    '<h4 style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--orange)">🔧 Tech-Pro</h4>' +
                    '<div id="techproElectivesList"></div>' +
                    '<div style="margin-top:12px;padding:12px;background:var(--bg3);border-radius:8px">' +
                        '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Add Tech-Pro Subtype</div>' +
                        '<div style="display:flex;gap:8px">' +
                            '<input type="text" id="newTechproSubtype" class="form-input" placeholder="e.g., ICT Programming" style="flex:1" onkeydown="if(event.key===\'Enter\')addElectiveSubtype(\'techpro\')">' +
                            '<button class="btn-confirm" onclick="addElectiveSubtype(\'techpro\')" style="white-space:nowrap">＋ Add</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                
            '</div>' +
            '<div class="modal-footer">' +
                '<button class="btn-cancel" onclick="closeManageStrands()">Close</button>' +
            '</div>'
        );
    }
    
    switchElectiveGrade(window.currentElectiveGrade);
    document.getElementById(modalId).classList.remove('hidden');
}

function switchElectiveGrade(grade) {
    window.currentElectiveGrade = grade;
    
    // Update button states
    const g11Btn = document.getElementById('electiveGrade11Btn');
    const g12Btn = document.getElementById('electiveGrade12Btn');
    
    if (g11Btn && g12Btn) {
        if (grade === '11') {
            g11Btn.className = 'btn-confirm';
            g12Btn.className = 'btn-cancel';
        } else {
            g11Btn.className = 'btn-cancel';
            g12Btn.className = 'btn-confirm';
        }
    }
    
    // Update title and hint
    const title = document.getElementById('manageElectivesTitle');
    const hint = document.getElementById('electiveGradeHint');
    
    if (title) {
        title.textContent = `🎓 Manage Elective Types & Subtypes (Grade ${grade} New Curriculum)`;
    }
    
    if (hint) {
        hint.textContent = `Manage elective types and their subtypes for Grade ${grade} subjects in the new curriculum.`;
    }
    
    // Reload elective subtypes for the selected grade
    loadElectiveSubtypes();
}

function closeManageStrands() {
    const modal = document.getElementById('manageStrandsModal');
    if (modal) modal.classList.add('hidden');
}

async function populateElectiveSubtypeDropdown(selectId, type) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Get current grade from the subject being added/edited
    const gradeField = document.getElementById('subjectGrade');
    const grade = gradeField ? gradeField.value : '11';
    
    const res = await apiFetch(API.electives + '?grade=' + grade);
    if (!res?.success) return;
    
    const subtypes = type === 'academic' ? res.academic : res.techpro;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">-- No Subtype --</option>';
    
    // Add options from database
    subtypes.forEach(subtype => {
        const option = document.createElement('option');
        option.value = subtype.name;
        option.textContent = subtype.name;
        select.appendChild(option);
    });
}

async function loadElectiveSubtypes() {
    console.log('Loading elective subtypes...');
    
    const grade = window.currentElectiveGrade || '11';
    const res = await apiFetch(API.electives + '?grade=' + grade);
    
    console.log('Elective subtypes API response:', res);
    
    if (!res?.success) {
        console.error('Failed to load elective subtypes:', res);
        showToast('Failed to load elective subtypes', 'error');
        return;
    }
    
    const academic = res.academic || [];
    const techpro = res.techpro || [];
    window.ELECTIVE_SUBTYPES = { academic, techpro };
    
    console.log('Elective subtypes loaded:', window.ELECTIVE_SUBTYPES);

    // Render academic electives
    const academicList = document.getElementById('academicElectivesList');
    if (academicList) {
        if (academic.length === 0) {
            academicList.innerHTML = '<p style="color:var(--text2);font-size:12px;padding:12px;text-align:center;background:var(--bg2);border-radius:6px">No academic subtypes found</p>';
        } else {
            academicList.innerHTML = academic.map(subtype => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg2);border-radius:6px;margin-bottom:6px">
                    <div style="flex:1;font-size:13px;font-weight:600;color:var(--text1)">${subtype.name}</div>
                    <button class="btn-edit" onclick="editElectiveSubtype(${subtype.id}, 'academic', '${subtype.name.replace(/'/g, "\\'")}')" style="padding:4px 10px;font-size:11px">✏ Edit</button>
                    <button class="btn-cancel" onclick="deleteElectiveSubtype(${subtype.id}, '${subtype.name.replace(/'/g, "\\'")}')" style="padding:4px 10px;font-size:11px">🗑 Delete</button>
                </div>
            `).join('');
        }
    }
    
    // Render techpro electives
    const techproList = document.getElementById('techproElectivesList');
    if (techproList) {
        if (techpro.length === 0) {
            techproList.innerHTML = '<p style="color:var(--text2);font-size:12px;padding:12px;text-align:center;background:var(--bg2);border-radius:6px">No tech-pro subtypes found</p>';
        } else {
            techproList.innerHTML = techpro.map(subtype => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg2);border-radius:6px;margin-bottom:6px">
                    <div style="flex:1;font-size:13px;font-weight:600;color:var(--text1)">${subtype.name}</div>
                    <button class="btn-edit" onclick="editElectiveSubtype(${subtype.id}, 'techpro', '${subtype.name.replace(/'/g, "\\'")}')" style="padding:4px 10px;font-size:11px">✏ Edit</button>
                    <button class="btn-cancel" onclick="deleteElectiveSubtype(${subtype.id}, '${subtype.name.replace(/'/g, "\\'")}')" style="padding:4px 10px;font-size:11px">🗑 Delete</button>
                </div>
            `).join('');
        }
    }
}

async function addElectiveSubtype(type) {
    const inputId = type === 'academic' ? 'newAcademicSubtype' : 'newTechproSubtype';
    const input = document.getElementById(inputId);
    const name = input.value.trim();
    const grade = window.currentElectiveGrade || '11';
    
    if (!name) {
        showToast('Please enter a subtype name', 'error');
        return;
    }
    
    const res = await apiFetch(API.electives, {
        method: 'POST',
        body: JSON.stringify({ grade, type, name })
    });
    
    if (res?.success) {
        showToast(`✓ Elective subtype "${name}" added successfully for Grade ${grade}`, 'success');
        input.value = '';
        loadElectiveSubtypes();
        // Refresh subjects view if it's open
        if (document.getElementById('view-subjects').classList.contains('active')) {
            renderSubjectsView();
        }
    } else {
        showToast('✗ ' + (res?.error || 'Failed to add elective subtype'), 'error');
    }
}

async function editElectiveSubtype(id, type, currentName) {
    const newName = prompt(`Edit ${type} elective subtype:`, currentName);
    if (!newName || newName.trim() === '' || newName === currentName) return;
    
    const res = await apiFetch(API.electives, {
        method: 'PUT',
        body: JSON.stringify({ id, name: newName.trim() })
    });
    
    if (res?.success) {
        showToast('✓ Elective subtype updated successfully', 'success');
        loadElectiveSubtypes();
        // Refresh subjects view if it's open
        if (document.getElementById('view-subjects').classList.contains('active')) {
            renderSubjectsView();
        }
    } else {
        showToast('✗ ' + (res?.error || 'Failed to update elective subtype'), 'error');
    }
}

async function deleteElectiveSubtype(id, name) {
    // First, check how many subjects are using this subtype
    const checkRes = await apiFetch(API.electives + '?id=' + id + '&check=true', { method: 'GET' });
    
    let confirmMessage = `Delete "${name}" subtype?`;
    if (checkRes?.count > 0) {
        confirmMessage = `⚠️ Warning: ${checkRes.count} subject(s) are currently using "${name}".\n\nDeleting this will remove the elective subtype from those subjects.\n\nAre you sure you want to continue?`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    const res = await apiFetch(API.electives + '?id=' + id + '&force=true', { method: 'DELETE' });
    
    if (res?.success) {
        showToast('✓ Elective subtype deleted successfully', 'success');
        loadElectiveSubtypes();
        // Refresh subjects view if it's open
        if (document.getElementById('view-subjects').classList.contains('active')) {
            renderSubjectsView();
        }
    } else {
        showToast('✗ ' + (res?.error || 'Failed to delete elective subtype'), 'error');
    }
}


// ============================================================
// 13. RESET
// ============================================================
 

async function doResetAdvisoryAndRooms() {
    if (!confirm('Clear ALL advisory sections and room assignments? This cannot be undone.')) return;
    closeResetModal();
    await apiFetch(API.teachers + '?action=clearadvisory', { method: 'DELETE' });
    await apiFetch(API.teachers + '?action=clearrooms', { method: 'DELETE' });
    await loadTeachersFromDB();
    showToast('✓ Advisory sections and rooms cleared', 'success');
    switchView(currentView);
}

async function doResetSectionAvailability() {
    if (!confirm('Clear ALL section availability? This cannot be undone.')) return;
    closeResetModal();
    const res = await apiFetch(API.sections + '?action=clearavailability', { method: 'DELETE' });
    if (res?.success) {
        // Update local SECTIONS cache
        if (typeof SECTIONS !== 'undefined') {
            SECTIONS.forEach(s => { s.availability = {}; });
        }
        showToast('✓ All section availability cleared', 'success');
        switchView(currentView);
    } else {
        showToast('✗ Failed to clear section availability', 'error');
    }
}

function closeResetModal() { var m=document.getElementById("resetModal"); if(m) m.classList.add("hidden"); }

function resetAllSchedules() {
    if (!document.getElementById("resetModal")) {
        var m = document.createElement("div");
        m.id = "resetModal";
        m.className = "modal-overlay hidden";
        m.onclick = function(e){ if(e.target===m) closeResetModal(); };
        m.innerHTML = [
            "<div class='modal-box'>",
            "<div class='modal-header'><h3>Reset / Clear Data</h3><button class='panel-close' onclick='closeResetModal()'>X</button></div>",
            "<div class='modal-body'>",
            "<p style='color:var(--text2);font-size:13px;margin-bottom:16px'>Choose what to clear. This cannot be undone.</p>",
            "<div style='display:flex;flex-direction:column;gap:10px'>",
            "<button class='btn-confirm' style='background:var(--orange);border-color:var(--orange)' onclick='doResetSchedules()'>📅 Clear All Schedules Only</button>",
            "<button class='btn-confirm' style='background:var(--yellow);border-color:var(--yellow)' onclick='doResetSubjects()'>📚 Clear All Teacher Subjects Only</button>",
            "<button class='btn-confirm' style='background:var(--red);border-color:var(--red)' onclick='doResetBoth()'>⚠️ Clear Both Schedules and Subjects</button>",
            "<button class='btn-confirm' style='background:#7c3aed;border-color:#7c3aed' onclick='doResetAdvisoryAndRooms()'>🏫 Clear All Advisory Sections & Rooms</button>",
            "<button class='btn-confirm' style='background:#0e7490;border-color:#0e7490' onclick='doResetSectionAvailability()'>🗓️ Clear All Section Availability</button>",
            "</div></div>",
            "<div class='modal-footer'><button class='btn-cancel' onclick='closeResetModal()'>Cancel</button></div>",
            "</div>"
        ].join("");
        document.body.appendChild(m);
    }
    document.getElementById("resetModal").classList.remove("hidden");
}

async function doResetSchedules() {
    if (!confirm('Clear ALL schedule assignments? This cannot be undone.')) return;
    closeResetModal();
    const res = await apiFetch(API.schedule, { method: 'DELETE' });
    if (res?.success) {
        scheduleCache = {};
        showToast('✓ All schedules cleared', 'success');
        switchView(currentView);
    } else { showToast('✗ Reset failed', 'error'); }
}

async function doResetSubjects() {
    if (!confirm('Clear ALL teacher subjects? This cannot be undone.')) return;
    closeResetModal();
    const res = await apiFetch(API.teachers + '?action=clearsubjects', { method: 'DELETE' });
    if (res?.success) {
        await loadTeachersFromDB();
        showToast('✓ All subjects cleared', 'success');
        switchView(currentView);
    } else { showToast('✗ Failed to clear subjects', 'error'); }
}

async function doResetBoth() {
    if (!confirm('Clear ALL schedules AND subjects? This cannot be undone.')) return;
    closeResetModal();
    await apiFetch(API.schedule, { method: 'DELETE' });
    await apiFetch(API.teachers + '?action=clearsubjects', { method: 'DELETE' });
    scheduleCache = {};
    await loadTeachersFromDB();
    showToast('✓ Schedules and subjects cleared', 'success');
    switchView(currentView);
}

// ============================================================
// AUTO GENERATE SCHEDULE
// ============================================================

async function autoGenerateSchedule() {
    // Confirm action
    if (!confirm('This will clear existing schedules and automatically generate new ones without conflicts. Continue?')) {
        return;
    }
    
    showLoader(true);
    showToast('🤖 Generating schedule...', 'info');
    
    try {
        // Get current term and semester from global variables
        const currentTerm = window.currentTerm || '1';
        const currentSemester = window.currentSemester || '1';
        const g12Curriculum = window.g12SectionCurriculum || 'old';
        
        console.log('Sending auto-generate request with:', { currentTerm, currentSemester, g12Curriculum });
        
        const res = await apiFetch(API.autoSchedule, { 
            method: 'POST',
            body: JSON.stringify({
                currentTerm: currentTerm,
                currentSemester: currentSemester,
                g12Curriculum: g12Curriculum
            })
        });
        
        console.log('Auto-generate response:', res);
        
        if (res?.success) {
            // Reload schedule data
            await loadScheduleFromDB();
            
            // Show success message with stats
            const stats = res.stats || {};
            let message = `✓ Schedule generated! ${stats.successful || 0} assignments created`;
            
            if (stats.failed > 0) {
                message += ` (${stats.failed} could not be assigned)`;
            }
            
            // Determine toast type based on conflicts
            let toastType = 'success';
            if (res.has_conflicts && stats.conflicts_detected > 0) {
                message += `\n⚠️ ${stats.conflicts_detected} conflicts detected - check Schedule Conflicts`;
                toastType = 'warning';
            }
            
            showToast(message, toastType);
            
            // Log conflicts if any
            if (res.has_conflicts && res.conflicts) {
                console.warn('Schedule generated with conflicts:', res.conflicts.length);
                console.log('First 10 conflicts:', res.conflicts.slice(0, 10));
            }
            
            // Show detailed results if there were failures
            if (res.failed_assignments && res.failed_assignments.length > 0) {
                console.log('Failed assignments:', res.failed_assignments);
                
                // Create a modal to show failed assignments
                setTimeout(() => {
                    const failedList = res.failed_assignments.slice(0, 10).map(f => 
                        `• ${f.section}: ${f.subject} - ${f.reason}`
                    ).join('\n');
                    
                    if (res.failed_assignments.length > 10) {
                        alert(`Some assignments could not be made:\n\n${failedList}\n\n...and ${res.failed_assignments.length - 10} more. Check console for details.`);
                    } else {
                        alert(`Some assignments could not be made:\n\n${failedList}`);
                    }
                }, 1000);
            }
            
            // Refresh current view
            switchView(currentView);
        } else {
            const errorMsg = res?.error || res?.message || 'Unknown error';
            console.error('Auto-generate error response:', res);
            
            // Log detailed conflict breakdown if available
            if (res?.conflict_summary) {
                console.log('Conflict Summary:', res.conflict_summary);
                console.log('- Double Bookings:', res.conflict_summary.double_bookings);
                console.log('- Unit Deficits:', res.conflict_summary.unit_deficits);
                console.log('- Unit Excesses:', res.conflict_summary.unit_excesses);
                console.log('- Same-Day Duplicates:', res.conflict_summary.same_day_duplicates);
                console.log('- Schedule Gaps:', res.conflict_summary.schedule_gaps);
            }
            
            // Show first few conflicts for debugging
            if (res?.conflicts && res.conflicts.length > 0) {
                console.log('First 10 conflicts:', res.conflicts.slice(0, 10));
            }
            
            showToast('✗ Auto-generation failed: ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('Auto-generate exception:', error);
        showToast('✗ Auto-generation failed: ' + error.message, 'error');
    } finally {
        showLoader(false);
    }
}
 
 
// ============================================================
// 14. LOADER & TOAST
// ============================================================
 
function showLoader(visible) {
    document.getElementById('pageLoader').classList.toggle('hidden', !visible);
}
 
let toastTimer;
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className   = `toast ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}
 
 
// ============================================================
// 15. INIT
// ============================================================
 
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure body is visible from the start with proper colors
    document.body.style.display = 'block';
    document.body.style.visibility = 'visible';
    document.body.style.minHeight = '100vh';
    // Remove hardcoded colors - let CSS variables handle theme colors
    
    initTheme();
    
    // Load school year from localStorage and update display
    schoolYear = localStorage.getItem('schoolYear') || '2025–2026';
    document.getElementById('displaySchoolYear').textContent = schoolYear;
    
    window.ELECTIVE_SUBTYPES = { academic: [], techpro: [] };
    showLoader(true);
    try {
        await Promise.all([
            loadScheduleFromDB(), 
            loadTeachersFromDB(), 
            loadSectionsFromDB(), 
            loadSubjectsFromDB(),
            loadElectiveSubtypes()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data from database', 'error');
    }
    showLoader(false);
    
    // Ensure navbar and loader are properly set
    const navbar = document.getElementById('navbar');
    if (navbar) {
        navbar.style.display = 'flex';
        navbar.style.visibility = 'visible';
    }
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('hidden');
    
    // CRITICAL FIX: Ensure all view parent elements are visible
    document.querySelectorAll('.view').forEach(v => {
        if (v.parentElement) {
            v.parentElement.style.display = 'block';
        }
    });
    
    console.log('Initialization complete, body height:', document.body.offsetHeight);
    
    renderDashboard();
});


// ============================================================
// HEADER EXPORT FUNCTIONS
// ============================================================

function exportToExcel() {
    console.log('exportToExcel called');
    
    // Determine which view is currently active
    const activeView = document.querySelector('.view.active');
    if (!activeView) {
        showToast('No active view to export', 'error');
        return;
    }
    
    const viewId = activeView.id;
    console.log('Active view:', viewId);
    
    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
        showToast('Excel library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    switch(viewId) {
        case 'view-dashboard':
            exportDashboardToExcel();
            break;
        case 'view-teachers':
            exportAllTeachersToExcel();
            break;
        case 'view-sections':
            if (currentSection) {
                exportSectionScheduleExcel();
            } else {
                showToast('Please select a section first', 'error');
            }
            break;
        case 'view-subjects':
            exportSubjectsToExcel();
            break;
        case 'view-teacherinfo':
            exportTeacherInfoToExcel();
            break;
        default:
            showToast('Export not available for this view', 'error');
    }
}

function exportToPDF() {
    console.log('exportToPDF called');
    
    // Determine which view is currently active
    const activeView = document.querySelector('.view.active');
    if (!activeView) {
        showToast('No active view to export', 'error');
        return;
    }
    
    const viewId = activeView.id;
    console.log('Active view for PDF:', viewId);
    
    switch(viewId) {
        case 'view-dashboard':
            exportDashboardToPDF();
            break;
        case 'view-teachers':
            if (currentTeacher) {
                printTeacherSchedule(currentTeacher);
            } else {
                showToast('Please open a teacher schedule first', 'error');
            }
            break;
        case 'view-sections':
            if (currentSection) {
                printSectionSchedule();
            } else {
                showToast('Please select a section first', 'error');
            }
            break;
        case 'view-subjects':
            exportSubjectsToPDF();
            break;
        case 'view-teacherinfo':
            exportTeacherInfoToPDF();
            break;
        default:
            showToast('PDF export not available for this view', 'error');
    }
}

// Dashboard Excel Export with scope selection
function exportDashboardToExcelWithScope(scope) {
    try {
        console.log('exportDashboardToExcelWithScope called with scope:', scope);
        
        if (typeof ExcelJS === 'undefined') {
            throw new Error('ExcelJS library not loaded');
        }
        
        const workbook = new ExcelJS.Workbook();
        const currentDate = new Date().toLocaleDateString();
        
        // Determine scope details
        let scopeTitle = '';
        let scopeDescription = '';
        let filterTerm = null;
        let filterSemester = null;
        
        switch(scope) {
            case 'current':
                scopeTitle = 'Current Term/Semester';
                scopeDescription = `JHS Term ${window.currentTerm || '1'} | SHS Semester ${window.currentSemester || '1'}`;
                filterTerm = window.currentTerm || '1';
                filterSemester = window.currentSemester || '1';
                break;
            case 'jhs-term1':
                scopeTitle = 'JHS Term 1';
                scopeDescription = 'Junior High School - First Term';
                filterTerm = '1';
                break;
            case 'jhs-term2':
                scopeTitle = 'JHS Term 2';
                scopeDescription = 'Junior High School - Second Term';
                filterTerm = '2';
                break;
            case 'jhs-term3':
                scopeTitle = 'JHS Term 3';
                scopeDescription = 'Junior High School - Third Term';
                filterTerm = '3';
                break;
            case 'jhs-all':
                scopeTitle = 'JHS All Terms';
                scopeDescription = 'Junior High School - All Terms Combined';
                break;
            case 'shs-sem1':
                scopeTitle = 'SHS Semester 1';
                scopeDescription = 'Senior High School - First Semester';
                filterSemester = '1';
                break;
            case 'shs-sem2':
                scopeTitle = 'SHS Semester 2';
                scopeDescription = 'Senior High School - Second Semester';
                filterSemester = '2';
                break;
            case 'shs-all':
                scopeTitle = 'SHS All Semesters';
                scopeDescription = 'Senior High School - All Semesters Combined';
                break;
            case 'full-year':
                scopeTitle = 'Entire School Year';
                scopeDescription = 'All Terms and Semesters';
                break;
        }
        
        // ===== SHEET 1: DASHBOARD SUMMARY =====
        const summarySheet = workbook.addWorksheet('Dashboard Summary');
        
        // Western Colleges Header
        summarySheet.mergeCells('A1:F1');
        const summaryHeaderCell = summarySheet.getCell('A1');
        summaryHeaderCell.value = 'WESTERN COLLEGES';
        summaryHeaderCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF8B0000' } };
        summaryHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getRow(1).height = 30;
        
        // Red separator line
        summarySheet.mergeCells('A2:F2');
        const summaryRedLine = summarySheet.getCell('A2');
        summaryRedLine.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
        summarySheet.getRow(2).height = 3;
        
        // Report Title
        summarySheet.mergeCells('A4:F4');
        const reportTitle = summarySheet.getCell('A4');
        reportTitle.value = 'SCHEDULING SYSTEM DASHBOARD REPORT';
        reportTitle.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000000' } };
        reportTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getRow(4).height = 25;
        
        // Report Info
        let currentRow = 6;
        const infoData = [
            ['School Year:', schoolYear],
            ['Report Scope:', scopeTitle],
            ['Description:', scopeDescription],
            ['Generated:', currentDate],
            ['Curriculum:', window.currentCurriculum || 'new']
        ];
        
        infoData.forEach(([label, value]) => {
            const labelCell = summarySheet.getCell(`A${currentRow}`);
            const valueCell = summarySheet.getCell(`B${currentRow}`);
            labelCell.value = label;
            valueCell.value = value;
            labelCell.font = { bold: true, size: 11 };
            valueCell.font = { size: 11 };
            labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
            labelCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            valueCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            currentRow++;
        });
        
        // Summary Statistics Header
        currentRow += 2;
        summarySheet.mergeCells(`A${currentRow}:F${currentRow}`);
        const statsHeader = summarySheet.getCell(`A${currentRow}`);
        statsHeader.value = 'SUMMARY STATISTICS';
        statsHeader.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        statsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        statsHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getRow(currentRow).height = 25;
        currentRow++;
        
        // Statistics Data
        const totalTeachers = teachersCache.length;
        const totalSections = SECTIONS.length;
        const jhsSections = SECTIONS.filter(s => s.grade <= 10).length;
        const shsSections = SECTIONS.filter(s => s.grade > 10).length;
        
        const statsData = [
            ['Total Teachers:', totalTeachers],
            ['Total Sections:', totalSections],
            ['  • JHS Sections (Grades 7-10):', jhsSections],
            ['  • SHS Sections (Grades 11-12):', shsSections]
        ];
        
        statsData.forEach(([label, value]) => {
            const labelCell = summarySheet.getCell(`A${currentRow}`);
            const valueCell = summarySheet.getCell(`B${currentRow}`);
            labelCell.value = label;
            valueCell.value = value;
            labelCell.font = { bold: true, size: 11 };
            valueCell.font = { size: 11, bold: true, color: { argb: 'FF0066CC' } };
            labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
            valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
            labelCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            valueCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            currentRow++;
        });
        
        // Set column widths
        summarySheet.getColumn(1).width = 30;
        summarySheet.getColumn(2).width = 40;
        summarySheet.getColumn(3).width = 15;
        summarySheet.getColumn(4).width = 15;
        summarySheet.getColumn(5).width = 15;
        summarySheet.getColumn(6).width = 15;
        
        // ===== SHEET 2: TEACHERS REPORT =====
        const teachersSheet = workbook.addWorksheet('Teachers Report');
        
        // Western Colleges Header
        teachersSheet.mergeCells('A1:M1');
        const teachersHeaderCell = teachersSheet.getCell('A1');
        teachersHeaderCell.value = 'WESTERN COLLEGES';
        teachersHeaderCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF8B0000' } };
        teachersHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        teachersSheet.getRow(1).height = 30;
        
        // Red separator
        teachersSheet.mergeCells('A2:M2');
        const teachersRedLine = teachersSheet.getCell('A2');
        teachersRedLine.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
        teachersSheet.getRow(2).height = 3;
        
        // Title
        teachersSheet.mergeCells('A4:M4');
        const teachersTitle = teachersSheet.getCell('A4');
        teachersTitle.value = 'TEACHERS DETAILED REPORT';
        teachersTitle.font = { name: 'Arial', size: 14, bold: true };
        teachersTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        teachersSheet.getRow(4).height = 25;
        
        // Table Headers
        const teacherHeaders = ['Teacher Name', 'Employment', 'Advisory', 'Subjects', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Total', 'Load %', 'Status'];
        const teacherHeaderRow = teachersSheet.getRow(6);
        teacherHeaders.forEach((header, index) => {
            const cell = teacherHeaderRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        teacherHeaderRow.height = 30;
        
        // Teacher Data
        let teacherRowNum = 7;
        teachersCache.forEach(teacher => {
            const sched = scheduleCache[teacher.id] || {};
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const counts = days.map(d => {
                const dayData = sched[d] || {};
                return Object.keys(dayData).filter(k => dayData[k]?.subject).length;
            });
            const total = counts.reduce((a, b) => a + b, 0);
            
            let teachesJHS = false, teachesSHS = false;
            Object.values(sched).forEach(daySchedule => {
                Object.values(daySchedule).forEach(slot => {
                    if (slot.section) {
                        const section = SECTIONS.find(s => s.id === slot.section);
                        if (section) {
                            if (section.grade <= 10) teachesJHS = true;
                            else teachesSHS = true;
                        }
                    }
                });
            });
            
            let maxLoad = 40;
            if (teachesSHS && !teachesJHS) maxLoad = 54;
            else if (teachesSHS && teachesJHS) maxLoad = 50;
            
            const loadPct = Math.round((total / maxLoad) * 100);
            const status = loadPct >= 90 ? 'Full Load' : loadPct >= 70 ? 'High Load' : loadPct >= 50 ? 'Moderate' : 'Light';
            
            const advisorySection = SECTIONS.find(s => s.id === teacher.advisory_section);
            const advisoryName = advisorySection ? advisorySection.name : 'None';
            const subjectsList = Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : 'None';
            
            const rowData = [
                teacher.name,
                teacher.employment_type || 'Full-time',
                advisoryName,
                subjectsList,
                ...counts,
                total,
                loadPct + '%',
                status
            ];
            
            const dataRow = teachersSheet.getRow(teacherRowNum);
            rowData.forEach((value, index) => {
                const cell = dataRow.getCell(index + 1);
                cell.value = value;
                cell.font = { size: 9 };
                cell.alignment = { horizontal: index < 4 ? 'left' : 'center', vertical: 'middle', wrapText: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: teacherRowNum % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };
            });
            dataRow.height = 25;
            teacherRowNum++;
        });
        
        // Set column widths
        teachersSheet.getColumn(1).width = 25; // Name
        teachersSheet.getColumn(2).width = 12; // Employment
        teachersSheet.getColumn(3).width = 15; // Advisory
        teachersSheet.getColumn(4).width = 30; // Subjects
        for (let i = 5; i <= 10; i++) teachersSheet.getColumn(i).width = 8; // Days
        teachersSheet.getColumn(11).width = 8; // Total
        teachersSheet.getColumn(12).width = 10; // Load %
        teachersSheet.getColumn(13).width = 12; // Status
        
        // ===== SHEET 3: SECTIONS REPORT =====
        const sectionsSheet = workbook.addWorksheet('Sections Report');
        
        // Western Colleges Header
        sectionsSheet.mergeCells('A1:I1');
        const sectionsHeaderCell = sectionsSheet.getCell('A1');
        sectionsHeaderCell.value = 'WESTERN COLLEGES';
        sectionsHeaderCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF8B0000' } };
        sectionsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sectionsSheet.getRow(1).height = 30;
        
        // Red separator
        sectionsSheet.mergeCells('A2:I2');
        const sectionsRedLine = sectionsSheet.getCell('A2');
        sectionsRedLine.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCC0000' } };
        sectionsSheet.getRow(2).height = 3;
        
        // Title
        sectionsSheet.mergeCells('A4:I4');
        const sectionsTitle = sectionsSheet.getCell('A4');
        sectionsTitle.value = 'SECTIONS DETAILED REPORT';
        sectionsTitle.font = { name: 'Arial', size: 14, bold: true };
        sectionsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        sectionsSheet.getRow(4).height = 25;
        
        // Table Headers
        const sectionHeaders = ['Section', 'Grade', 'Strand', 'Advisory Teacher', 'Days', 'Total Slots', 'Filled', 'Complete %', 'Status'];
        const sectionHeaderRow = sectionsSheet.getRow(6);
        sectionHeaders.forEach((header, index) => {
            const cell = sectionHeaderRow.getCell(index + 1);
            cell.value = header;
            cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF808080' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        sectionHeaderRow.height = 30;
        
        // Section Data
        let sectionRowNum = 7;
        SECTIONS.forEach(section => {
            const days = section.grade <= 10 
                ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            const slots = section.grade <= 10
                ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']
                : ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
            
            let filled = 0;
            const total = days.length * slots.length;
            let advisoryTeacher = 'None';
            
            teachersCache.forEach(teacher => {
                if (teacher.advisory_section === section.id) {
                    advisoryTeacher = teacher.name;
                }
                
                const teacherSched = scheduleCache[teacher.id] || {};
                days.forEach(day => {
                    const dayData = teacherSched[day] || {};
                    slots.forEach(slot => {
                        if (dayData[slot]?.section === section.id && dayData[slot]?.subject) {
                            filled++;
                        }
                    });
                });
            });
            
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
            const status = pct >= 90 ? 'Complete' : pct >= 70 ? 'Nearly Done' : pct >= 50 ? 'Partial' : 'Incomplete';
            
            const rowData = [
                section.name,
                section.grade,
                section.strand || 'N/A',
                advisoryTeacher,
                days.length === 5 ? 'Mon-Fri' : 'Mon-Sat',
                total,
                filled,
                pct + '%',
                status
            ];
            
            const dataRow = sectionsSheet.getRow(sectionRowNum);
            rowData.forEach((value, index) => {
                const cell = dataRow.getCell(index + 1);
                cell.value = value;
                cell.font = { size: 9 };
                cell.alignment = { horizontal: index < 4 ? 'left' : 'center', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sectionRowNum % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
                    right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
                };
            });
            dataRow.height = 25;
            sectionRowNum++;
        });
        
        // Set column widths
        sectionsSheet.getColumn(1).width = 20; // Section
        sectionsSheet.getColumn(2).width = 8;  // Grade
        sectionsSheet.getColumn(3).width = 12; // Strand
        sectionsSheet.getColumn(4).width = 25; // Advisory
        sectionsSheet.getColumn(5).width = 12; // Days
        sectionsSheet.getColumn(6).width = 12; // Total
        sectionsSheet.getColumn(7).width = 10; // Filled
        sectionsSheet.getColumn(8).width = 12; // %
        sectionsSheet.getColumn(9).width = 15; // Status
        
        // Generate and download
        workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const scopeCode = scope.replace('-', '_').toUpperCase();
            a.download = `Dashboard_${scopeCode}_${schoolYear.replace(/[–\-\s]/g, '_')}_${currentDate.replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast(`✓ Dashboard report (${scopeTitle}) exported successfully!`, 'success');
        });
        
    } catch (error) {
        console.error('Error in exportDashboardToExcelWithScope:', error);
        showToast('Export failed: ' + error.message, 'error');
    }
}

function exportDashboardToExcel() {
    // Redirect to new function with 'current' scope
    exportDashboardToExcelWithScope('current');
}

// All Teachers Excel Export (with colors using ExcelJS)
async function exportAllTeachersToExcel() {
    console.log('=== EXPORT ALL TEACHERS TO EXCEL ===');
    
    if (typeof ExcelJS === 'undefined') {
        showToast('ExcelJS library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const workbook = new ExcelJS.Workbook();
    
    for (const teacher of teachersCache) {
        const worksheet = workbook.addWorksheet(teacher.name.substring(0, 30));
        const daysToShow = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        
        const slots = [
            { timeIn:'7:00 AM', timeOut:'7:30 AM', min:'30', type:'period', id:'p1' },
            { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
            { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
            { timeIn:'9:30 AM', timeOut:'10:30 AM', min:'60', type:'period', id:'p4' },
            { timeIn:'10:30 AM', timeOut:'10:45 AM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
            { timeIn:'11:45 AM', timeOut:'12:45 PM', min:'60', type:'period', id:'p6' },
            { timeIn:'12:45 PM', timeOut:'1:15 PM', min:'30', type:'lunch', label:'LUNCH' },
            { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
            { timeIn:'2:15 PM', timeOut:'3:15 PM', min:'60', type:'period', id:'p8' },
            { timeIn:'3:15 PM', timeOut:'3:30 PM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
            { timeIn:'4:30 PM', timeOut:'5:30 PM', min:'60', type:'period', id:'p10' },
        ];
        
        // Header - Western Colleges, Inc.
        const titleRow1 = worksheet.addRow(['Western Colleges, Inc.']);
        titleRow1.height = 22;
        titleRow1.getCell(1).font = { name: 'Old English Text MT', size: 18, bold: true };
        titleRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A1:${String.fromCharCode(65 + daysToShow.length + 1)}1`);
        
        const titleRow2 = worksheet.addRow(['(Formerly Western Cavite Institute)']);
        titleRow2.height = 16;
        titleRow2.getCell(1).font = { size: 10 };
        titleRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A2:${String.fromCharCode(65 + daysToShow.length + 1)}2`);
        
        const titleRow3 = worksheet.addRow(['High School Department']);
        titleRow3.height = 16;
        titleRow3.getCell(1).font = { size: 11, bold: true };
        titleRow3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A3:${String.fromCharCode(65 + daysToShow.length + 1)}3`);
        
        const titleRow4 = worksheet.addRow(['Naic, Cavite']);
        titleRow4.height = 16;
        titleRow4.getCell(1).font = { size: 10 };
        titleRow4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A4:${String.fromCharCode(65 + daysToShow.length + 1)}4`);
        
        const titleRow5 = worksheet.addRow(['Email: wcihighschool@gmail.com']);
        titleRow5.height = 16;
        titleRow5.getCell(1).font = { size: 10 };
        titleRow5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A5:${String.fromCharCode(65 + daysToShow.length + 1)}5`);
        
        const titleRow6 = worksheet.addRow(['Tel. No. (046) 507 0500']);
        titleRow6.height = 16;
        titleRow6.getCell(1).font = { size: 10 };
        titleRow6.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A6:${String.fromCharCode(65 + daysToShow.length + 1)}6`);
        
        // Red line (using border)
        const redLineRow = worksheet.addRow([]);
        redLineRow.height = 8;
        for (let i = 1; i <= daysToShow.length + 2; i++) {
            redLineRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
        }
        
        worksheet.addRow([]);
        
        // Title with schedule info
        const scheduleTitle = worksheet.addRow([`TEACHERS' SCHEDULE FOR SY ${schoolYear}`]);
        scheduleTitle.height = 20;
        scheduleTitle.getCell(1).font = { bold: true, size: 12 };
        scheduleTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A9:${String.fromCharCode(65 + daysToShow.length + 1)}9`);
        
        const semesterRow = worksheet.addRow(['SECOND SEMESTER']);
        semesterRow.height = 18;
        semesterRow.getCell(1).font = { size: 10 };
        semesterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A10:${String.fromCharCode(65 + daysToShow.length + 1)}10`);
        
        worksheet.addRow([]);
        
        // Teacher name
        const nameRow = worksheet.addRow([teacher.name.toUpperCase()]);
        nameRow.height = 22;
        nameRow.getCell(1).font = { bold: true, size: 13 };
        nameRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A12:${String.fromCharCode(65 + daysToShow.length + 1)}12`);
        
        worksheet.addRow([]);
        
        // Table header
        const headerRow = worksheet.addRow(['TIME', 'MINUTES', ...daysToShow.map(d => d.toUpperCase())]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
            cell.font = { bold: true, size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        
        // Data rows
        slots.forEach(slot => {
            if (slot.type === 'break' || slot.type === 'lunch') {
                const breakRow = worksheet.addRow([`${slot.timeIn} - ${slot.timeOut}`, slot.min, slot.label]);
                breakRow.height = 25;
                
                // Style first two cells
                breakRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
                breakRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
                breakRow.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
                breakRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
                
                // Merge and style break cell with orange/yellow background
                worksheet.mergeCells(breakRow.number, 3, breakRow.number, daysToShow.length + 2);
                const breakCell = breakRow.getCell(3);
                breakCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B942' } };
                breakCell.font = { bold: true, size: 11, color: { argb: 'FF8B0000' } };
                breakCell.alignment = { vertical: 'middle', horizontal: 'center' };
                breakCell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } }
                };
                return;
            }
            
            const rowData = [`${slot.timeIn} - ${slot.timeOut}`, slot.min];
            daysToShow.forEach(day => {
                const d = scheduleCache[teacher.id]?.[day]?.[slot.id];
                const secObj = d?.section ? SECTIONS.find(s => s.id === d.section) : null;
                const sec = secObj?.name || d?.section || '';
                const subj = d?.subject || '';
                
                if (sec || subj) {
                    rowData.push(`${subj}\n${sec}`);
                } else {
                    rowData.push('');
                }
            });
            
            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 35;
            dataRow.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.font = { size: 9 };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
        });
        
        // Footer
        worksheet.addRow([]);
        worksheet.addRow([]);
        
        const footerRow = worksheet.addRow([teacher.name.toUpperCase(), '', '', '', '', '', '', 'DR. DARNIELL C. BALBUENA']);
        footerRow.eachCell((cell, colNumber) => {
            if (colNumber === 1 || colNumber === 8) {
                cell.font = { bold: true, size: 10 };
                cell.alignment = { horizontal: 'center' };
                cell.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
            }
        });
        
        const roleRow = worksheet.addRow(['Teacher', '', '', '', '', '', '', 'School Principal']);
        roleRow.eachCell((cell, colNumber) => {
            if (colNumber === 1 || colNumber === 8) {
                cell.font = { size: 9 };
                cell.alignment = { horizontal: 'center' };
            }
        });
        
        // Set column widths
        worksheet.getColumn(1).width = 18;
        worksheet.getColumn(2).width = 10;
        for (let i = 3; i <= daysToShow.length + 2; i++) {
            worksheet.getColumn(i).width = 18;
        }
    }
    
    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `All_Teachers_${schoolYear.replace(/–/g, '-')}_${timestamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('All teachers exported with exact design');
    showToast(`${teachersCache.length} teachers exported to Excel`, 'success');
}

// All Sections Excel Export
// All Sections Excel Export (with colors using ExcelJS)
async function exportAllSectionsToExcel() {
    console.log('=== EXPORT ALL SECTIONS TO EXCEL ===');
    
    if (typeof ExcelJS === 'undefined') {
        showToast('ExcelJS library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    const workbook = new ExcelJS.Workbook();
    
    // Get term/semester info
    const currentCurr = window.currentCurriculum || 'new';
    const currentTerm = window.currentTerm || '1';
    const currentSemester = window.currentSemester || '1';
    const termNames = {'1':'FIRST TERM','2':'SECOND TERM','3':'THIRD TERM'};
    const semNames = {'1':'FIRST SEMESTER','2':'SECOND SEMESTER'};
    
    for (const section of SECTIONS) {
        const isJHS = section.grade <= 10;
        const daysToShow = isJHS 
            ? ['Monday','Tuesday','Wednesday','Thursday','Friday']
            : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        
        const slots = isJHS ? [
            { timeIn:'7:00 AM', timeOut:'7:30 AM', min:'30', type:'period', id:'p1' },
            { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
            { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
            { timeIn:'9:30 AM', timeOut:'9:45 AM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'9:45 AM', timeOut:'10:45 AM', min:'60', type:'period', id:'p4' },
            { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
            { timeIn:'11:45 AM', timeOut:'12:15 PM', min:'30', type:'lunch', label:'LUNCH' },
            { timeIn:'12:15 PM', timeOut:'1:15 PM', min:'60', type:'period', id:'p6' },
            { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
            { timeIn:'2:15 PM', timeOut:'2:30 PM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'2:30 PM', timeOut:'3:30 PM', min:'60', type:'period', id:'p8' },
            { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
        ] : [
            { timeIn:'7:30 AM', timeOut:'8:30 AM', min:'60', type:'period', id:'p2' },
            { timeIn:'8:30 AM', timeOut:'9:30 AM', min:'60', type:'period', id:'p3' },
            { timeIn:'9:30 AM', timeOut:'10:30 AM', min:'60', type:'period', id:'p4' },
            { timeIn:'10:30 AM', timeOut:'10:45 AM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'10:45 AM', timeOut:'11:45 AM', min:'60', type:'period', id:'p5' },
            { timeIn:'11:45 AM', timeOut:'12:45 PM', min:'60', type:'period', id:'p6' },
            { timeIn:'12:45 PM', timeOut:'1:15 PM', min:'30', type:'lunch', label:'LUNCH' },
            { timeIn:'1:15 PM', timeOut:'2:15 PM', min:'60', type:'period', id:'p7' },
            { timeIn:'2:15 PM', timeOut:'3:15 PM', min:'60', type:'period', id:'p8' },
            { timeIn:'3:15 PM', timeOut:'3:30 PM', min:'15', type:'break', label:'BREAK' },
            { timeIn:'3:30 PM', timeOut:'4:30 PM', min:'60', type:'period', id:'p9' },
            { timeIn:'4:30 PM', timeOut:'5:30 PM', min:'60', type:'period', id:'p10' },
        ];
        
        // Determine period info based on grade
        let periodInfo = '';
        if (isJHS) {
            periodInfo = termNames[currentTerm];
        } else {
            periodInfo = semNames[currentSemester];
        }
        
        const safeName = section.name.replace(/[^a-zA-Z0-9 ]/g, '_').substring(0, 30);
        const worksheet = workbook.addWorksheet(safeName);
        
        // Header - Western Colleges, Inc.
        const titleRow1 = worksheet.addRow(['Western Colleges, Inc.']);
        titleRow1.height = 22;
        titleRow1.getCell(1).font = { name: 'Old English Text MT', size: 18, bold: true };
        titleRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A1:${String.fromCharCode(65 + daysToShow.length + 1)}1`);
        
        const titleRow2 = worksheet.addRow(['(Formerly Western Cavite Institute)']);
        titleRow2.height = 16;
        titleRow2.getCell(1).font = { size: 10 };
        titleRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A2:${String.fromCharCode(65 + daysToShow.length + 1)}2`);
        
        const titleRow3 = worksheet.addRow(['High School Department']);
        titleRow3.height = 16;
        titleRow3.getCell(1).font = { size: 11, bold: true };
        titleRow3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A3:${String.fromCharCode(65 + daysToShow.length + 1)}3`);
        
        const titleRow4 = worksheet.addRow(['Naic, Cavite']);
        titleRow4.height = 16;
        titleRow4.getCell(1).font = { size: 10 };
        titleRow4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A4:${String.fromCharCode(65 + daysToShow.length + 1)}4`);
        
        const titleRow5 = worksheet.addRow(['Email: wcihighschool@gmail.com']);
        titleRow5.height = 16;
        titleRow5.getCell(1).font = { size: 10 };
        titleRow5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A5:${String.fromCharCode(65 + daysToShow.length + 1)}5`);
        
        const titleRow6 = worksheet.addRow(['Tel. No. (046) 507 0500']);
        titleRow6.height = 16;
        titleRow6.getCell(1).font = { size: 10 };
        titleRow6.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A6:${String.fromCharCode(65 + daysToShow.length + 1)}6`);
        
        // Red line (using border)
        const redLineRow = worksheet.addRow([]);
        redLineRow.height = 8;
        for (let i = 1; i <= daysToShow.length + 2; i++) {
            redLineRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
        }
        
        worksheet.addRow([]);
        
        // Title with schedule info
        const scheduleTitle = worksheet.addRow([`SECTION SCHEDULE FOR SY ${schoolYear}`]);
        scheduleTitle.height = 20;
        scheduleTitle.getCell(1).font = { bold: true, size: 12 };
        scheduleTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A9:${String.fromCharCode(65 + daysToShow.length + 1)}9`);
        
        const semesterRow = worksheet.addRow([periodInfo]);
        semesterRow.height = 18;
        semesterRow.getCell(1).font = { size: 10 };
        semesterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A10:${String.fromCharCode(65 + daysToShow.length + 1)}10`);
        
        worksheet.addRow([]);
        
        // Section name
        const nameRow = worksheet.addRow([section.name.toUpperCase()]);
        nameRow.height = 22;
        nameRow.getCell(1).font = { bold: true, size: 13 };
        nameRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(`A12:${String.fromCharCode(65 + daysToShow.length + 1)}12`);
        
        worksheet.addRow([]);
        
        // Table header
        const headerRow = worksheet.addRow(['TIME', 'MINUTES', ...daysToShow.map(d => d.toUpperCase())]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
            cell.font = { bold: true, size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
        
        // Data rows
        slots.forEach(slot => {
            if (slot.type === 'break' || slot.type === 'lunch') {
                const breakRow = worksheet.addRow([`${slot.timeIn} - ${slot.timeOut}`, slot.min, slot.label]);
                breakRow.height = 25;
                
                // Style first two cells
                breakRow.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
                breakRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
                breakRow.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
                breakRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
                
                // Merge and style break cell with orange/yellow background
                worksheet.mergeCells(breakRow.number, 3, breakRow.number, daysToShow.length + 2);
                const breakCell = breakRow.getCell(3);
                breakCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B942' } };
                breakCell.font = { bold: true, size: 11, color: { argb: 'FF8B0000' } };
                breakCell.alignment = { vertical: 'middle', horizontal: 'center' };
                breakCell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } }
                };
                return;
            }
            
            const rowData = [`${slot.timeIn} - ${slot.timeOut}`, slot.min];
            daysToShow.forEach(day => {
                // Find teacher assigned to this section at this time
                let cellContent = '';
                
                // AUTO-INJECT PRELIMINARIES: If this is first period slot and section has advisory teacher
                const isSHS = section.grade >= 11;
                const firstPeriodSlot = isSHS ? 'p2' : 'p1';
                
                if (slot.id === firstPeriodSlot) {
                    const advisoryTeacher = teachersCache.find(t => t.advisory_section === section.id);
                    if (advisoryTeacher) {
                        // Check if there's already something scheduled in database
                        let hasScheduledEntry = false;
                        teachersCache.forEach(teacher => {
                            const d = scheduleCache[teacher.id]?.[day]?.[slot.id];
                            if (d?.section === section.id) {
                                hasScheduledEntry = true;
                            }
                        });
                        
                        // If nothing scheduled, auto-inject PRELIMINARIES
                        if (!hasScheduledEntry) {
                            cellContent = 'PRELIMINARIES';
                        }
                    }
                }
                
                // Load from database (this will override auto-injected if exists)
                teachersCache.forEach(teacher => {
                    const d = scheduleCache[teacher.id]?.[day]?.[slot.id];
                    if (d?.section === section.id && d?.subject) {
                        const subj = d.subject;
                        if (subj === 'PRELIMINARIES') {
                            cellContent = subj;
                        } else {
                            cellContent = `${subj}\n${teacher.name}`;
                        }
                    }
                });
                rowData.push(cellContent);
            });
            
            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 35;
            dataRow.eachCell((cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.font = { size: 9 };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
        });
        
        // Footer
        worksheet.addRow([]);
        worksheet.addRow([]);
        
        const footerRow = worksheet.addRow(['DR. DANILO CABALU', '', '', '', '', '', '', 'MR. DARNIELL C. BALBUENA']);
        footerRow.eachCell((cell, colNumber) => {
            if (colNumber === 1 || colNumber === 8) {
                cell.font = { bold: true, size: 10 };
                cell.alignment = { horizontal: 'center' };
                cell.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
            }
        });
        
        const roleRow = worksheet.addRow(['Teacher', '', '', '', '', '', '', 'School Principal']);
        roleRow.eachCell((cell, colNumber) => {
            if (colNumber === 1 || colNumber === 8) {
                cell.font = { size: 9 };
                cell.alignment = { horizontal: 'center' };
            }
        });
        
        // Set column widths
        worksheet.getColumn(1).width = 18;
        worksheet.getColumn(2).width = 10;
        for (let i = 3; i <= daysToShow.length + 2; i++) {
            worksheet.getColumn(i).width = 18;
        }
    }
    
    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().getTime();
    a.download = `All_Sections_${schoolYear.replace(/–/g, '-')}_${timestamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('All sections exported with exact design');
    showToast(`${SECTIONS.length} sections exported to Excel`, 'success');
}

// Subjects Excel Export
function exportSubjectsToExcel() {
    const wb = XLSX.utils.book_new();
    const data = [];
    data.push(['Subject Name', 'Type', 'Category', 'Curriculum', 'Grade', 'Semester/Term', 'Strand']);
    
    // Flatten all subjects from the cache
    const allSubjects = [
        ...(subjectsCache.jhs || []),
        ...(subjectsCache.g11Sem1 || []),
        ...(subjectsCache.g11Sem2 || []),
        ...(subjectsCache.g12Sem1 || []),
        ...(subjectsCache.g12Sem2 || [])
    ];
    
    // Remove duplicates based on subject name
    const uniqueSubjects = [];
    const seen = new Set();
    allSubjects.forEach(subject => {
        if (!seen.has(subject.name)) {
            seen.add(subject.name);
            uniqueSubjects.push(subject);
        }
    });
    
    uniqueSubjects.forEach(subject => {
        data.push([
            subject.name || 'N/A',
            subject.type || 'N/A',
            subject.category || 'N/A',
            subject.curriculum || 'N/A',
            subject.grade || 'N/A',
            subject.term || subject.semester || 'N/A',
            subject.strand || 'N/A'
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Subjects');
    
    XLSX.writeFile(wb, `Subjects_${schoolYear.replace(/–/g, '-')}.xlsx`);
    showToast('Subjects exported to Excel', 'success');
}

// Teacher Info Excel Export
function exportTeacherInfoToExcel() {
    const wb = XLSX.utils.book_new();
    const data = [];
    data.push(['Teacher', 'Employment Type', 'Department', 'Advisory Section', 'Available Days']);
    
    teachersCache.forEach(teacher => {
        const empType = teacher.employment_type || 'N/A';
        const dept = teacher.department || 'N/A';
        const advisory = teacher.advisory_section || 'N/A';
        const availability = teacher.availability ? teacher.availability.join(', ') : 'All Days';
        
        data.push([
            teacher.name,
            empType,
            dept,
            advisory,
            availability
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Teacher Info');
    
    XLSX.writeFile(wb, `Teacher_Info_${schoolYear.replace(/–/g, '-')}.xlsx`);
    showToast('Teacher info exported to Excel', 'success');
}

// Dashboard PDF Export
function exportDashboardToPDF() {
    window.print();
    showToast('Use browser print dialog to save as PDF', 'success');
}

// Subjects PDF Export
function exportSubjectsToPDF() {
    window.print();
    showToast('Use browser print dialog to save as PDF', 'success');
}

// Dashboard PDF Export (comprehensive report)
function printDashboardReport() {
    try {
        const currentDate = new Date().toLocaleDateString();
        
        // Calculate summary statistics
        const totalTeachers = teachersCache.length;
        const totalSections = SECTIONS.length;
        const jhsSections = SECTIONS.filter(s => s.grade <= 10).length;
        const shsSections = SECTIONS.filter(s => s.grade > 10).length;
        const totalSubjects = [
            ...(subjectsCache.jhs || []),
            ...(subjectsCache.g11Sem1 || []),
            ...(subjectsCache.g11Sem2 || []),
            ...(subjectsCache.g12Sem1 || []),
            ...(subjectsCache.g12Sem2 || [])
        ].length;
        
        // Generate teacher summary
        let teacherSummary = '';
        teachersCache.forEach(teacher => {
            const sched = scheduleCache[teacher.id] || {};
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const totalPeriods = days.reduce((total, day) => {
                const dayData = sched[day] || {};
                return total + Object.keys(dayData).filter(k => dayData[k]?.subject).length;
            }, 0);
            
            // Use teacher's custom load if available, otherwise use default calculation
            let maxLoad = 50; // Default load
            if (teacher.load && teacher.load.trim() !== '') {
                maxLoad = parseInt(teacher.load) || 50;
            }
            
            const loadPct = Math.round((totalPeriods / maxLoad) * 100);
            const status = loadPct >= 90 ? 'Full Load' : loadPct >= 70 ? 'High Load' : loadPct >= 50 ? 'Moderate Load' : 'Light Load';
            const subjectsList = Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.subject || 'None');
            
            // Extract working days and calculate hours from availability
            const availability = teacher.availability || {};
            const workingDays = [];
            const hoursPerDay = [];
            
            const dayAbbrev = {
                'Monday': 'M',
                'Tuesday': 'T', 
                'Wednesday': 'W',
                'Thursday': 'Th',
                'Friday': 'F',
                'Saturday': 'S'
            };
            
            days.forEach(day => {
                const dayAvail = availability[day];
                if (dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
                    workingDays.push(dayAbbrev[day]);
                    const hours = calculateHoursRendered(dayAvail.timeIn, dayAvail.timeOut);
                    hoursPerDay.push(hours);
                }
            });
            
            const workingDaysStr = workingDays.length > 0 ? workingDays.join('-') : 'No schedule';
            const avgHours = hoursPerDay.length > 0 
                ? (hoursPerDay.reduce((a, b) => a + b, 0) / hoursPerDay.length).toFixed(1)
                : '0';
            
            teacherSummary += `
                <tr>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.name}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.employment_type || 'Full-time'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.advisory_section || 'None'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:11px">${subjectsList}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:11px;text-align:center">${workingDaysStr}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${avgHours}h</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${totalPeriods}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${loadPct}%</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${status}</td>
                </tr>`;
        });
        
        // Generate section summary
        let sectionSummary = '';
        SECTIONS.forEach(section => {
            const days = section.grade <= 10 
                ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            const slots = section.grade <= 10
                ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']
                : ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
            
            let filled = 0;
            const total = days.length * slots.length;
            let advisoryTeacher = 'None';
            
            // Find advisory teacher and count filled slots
            teachersCache.forEach(teacher => {
                if (teacher.advisory_section === section.id) {
                    advisoryTeacher = teacher.name;
                }
                
                const teacherSched = scheduleCache[teacher.id] || {};
                days.forEach(day => {
                    const dayData = teacherSched[day] || {};
                    slots.forEach(slot => {
                        if (dayData[slot]?.section === section.id && dayData[slot]?.subject) {
                            filled++;
                        }
                    });
                });
            });
            
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
            const status = pct >= 90 ? 'Complete' : pct >= 70 ? 'Nearly Complete' : pct >= 50 ? 'Partial' : 'Incomplete';
            
            sectionSummary += `
                <tr>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${section.name}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${section.grade}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${section.strand || 'N/A'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${advisoryTeacher}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${filled}/${total}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${pct}%</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${status}</td>
                </tr>`;
        });
        
        // Generate subjects table
        let subjectsTable = '';
        const allSubjects = [
            ...(subjectsCache.jhs || []).map(s => ({...s, level: 'JHS'})),
            ...(subjectsCache.g11Sem1 || []).map(s => ({...s, level: 'Grade 11 Sem 1'})),
            ...(subjectsCache.g11Sem2 || []).map(s => ({...s, level: 'Grade 11 Sem 2'})),
            ...(subjectsCache.g12Sem1 || []).map(s => ({...s, level: 'Grade 12 Sem 1'})),
            ...(subjectsCache.g12Sem2 || []).map(s => ({...s, level: 'Grade 12 Sem 2'}))
        ];
        
        // Remove duplicates and add teacher info
        const uniqueSubjects = [];
        const seen = new Set();
        allSubjects.forEach(subject => {
            const key = `${subject.name}-${subject.type}-${subject.grade}-${subject.semester || subject.term}`;
            if (!seen.has(key)) {
                seen.add(key);
                
                // Count teachers who can teach this subject
                const teacherCount = teachersCache.filter(teacher => {
                    const subjects = Array.isArray(teacher.subjects) ? teacher.subjects : 
                                   teacher.subject ? [teacher.subject] : [];
                    return subjects.includes(subject.name);
                }).length;
                
                uniqueSubjects.push({
                    ...subject,
                    teacherCount
                });
            }
        });
        
        // Sort subjects by type, then grade, then name
        uniqueSubjects.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.grade !== b.grade) return (a.grade || '').toString().localeCompare((b.grade || '').toString());
            return (a.name || '').localeCompare(b.name || '');
        });
        
        uniqueSubjects.forEach(subject => {
            subjectsTable += `
                <tr>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.name || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.type || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.grade || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.term || subject.semester || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.category || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.strand || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.curriculum || 'N/A'}</td>
                    <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.teacherCount}</td>
                </tr>`;
        });
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dashboard Report - ${schoolYear}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #c00; padding-bottom: 20px; }
                .header h1 { font-size: 24px; font-weight: bold; color: #c00; margin-bottom: 8px; }
                .header h2 { font-size: 20px; font-weight: bold; color: #8b0000; margin-bottom: 8px; }
                .header p { font-size: 14px; color: #666; }
                .wc-stripe { background: #c00; height: 4px; margin: 10px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .summary-card { background: linear-gradient(135deg, #f5c518 0%, #f5c518 100%); border: 2px solid #c00; border-radius: 8px; padding: 16px; text-align: center; }
                .summary-card h3 { font-size: 16px; color: #8b0000; margin-bottom: 8px; font-weight: bold; }
                .summary-card p { font-size: 24px; font-weight: bold; color: #000; }
                .summary-card small { font-size: 12px; color: #8b0000; }
                .section { margin-bottom: 40px; page-break-inside: avoid; }
                .section h2 { font-size: 18px; font-weight: bold; color: #c00; margin-bottom: 16px; border-bottom: 3px solid #c00; padding-bottom: 8px; background: linear-gradient(90deg, #f5c518 0%, #fff 100%); padding: 12px 16px; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                th { background: linear-gradient(135deg, #c00 0%, #8b0000 100%); color: white; padding: 12px 8px; font-size: 12px; font-weight: bold; border: 1px solid #8b0000; text-align: center; }
                td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
                tr:nth-child(even) { background: #f8f9fa; }
                tr:nth-child(odd) { background: #fff; }
                tr:hover { background: #fff3cd; }
                .no-print { display: none; }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 10px; }
                    .section { page-break-inside: avoid; }
                    .summary-grid { page-break-inside: avoid; }
                }
                @page { size: landscape; margin: 15mm; }
                .wc-logo { text-align: center; margin-bottom: 20px; }
                .wc-colors { display: flex; height: 8px; margin: 10px 0; }
                .wc-red { background: #c00; flex: 1; }
                .wc-gold { background: #f5c518; flex: 1; }
                .wc-dark-red { background: #8b0000; flex: 1; }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                <button onclick="window.print()" style="background: #c00; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Print / Save as PDF</button>
            </div>
            
            <div class="wc-logo">
                <div class="wc-colors">
                    <div class="wc-red"></div>
                    <div class="wc-gold"></div>
                    <div class="wc-dark-red"></div>
                </div>
            </div>
            
            <div class="header">
                <h1>WESTERN COLLEGES</h1>
                <h2>SCHEDULING SYSTEM DASHBOARD REPORT</h2>
                <div class="wc-stripe"></div>
                <p><strong>School Year:</strong> ${schoolYear} | <strong>Generated:</strong> ${currentDate}</p>
                <p><strong>Current JHS Term:</strong> ${window.currentTerm || '1'} | <strong>Current SHS Semester:</strong> ${window.currentSemester || '1'} | <strong>Curriculum:</strong> ${window.currentCurriculum || 'new'}</p>
            </div>
            
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>👥 TOTAL TEACHERS</h3>
                    <p>${totalTeachers}</p>
                </div>
                <div class="summary-card">
                    <h3>🏫 TOTAL SECTIONS</h3>
                    <p>${totalSections}</p>
                    <small>JHS: ${jhsSections} | SHS: ${shsSections}</small>
                </div>
                <div class="summary-card">
                    <h3>📚 TOTAL SUBJECTS</h3>
                    <p>${totalSubjects}</p>
                </div>
            </div>
            
            <div class="section">
                <h2>👥 TEACHERS SUMMARY</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Teacher Name</th>
                            <th>Employment</th>
                            <th>Advisory Section</th>
                            <th>Subjects Taught</th>
                            <th>Working Days</th>
                            <th>Hours/Day</th>
                            <th>Total Periods</th>
                            <th>Load %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teacherSummary}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>🏫 SECTIONS SUMMARY</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Section Name</th>
                            <th>Grade</th>
                            <th>Strand</th>
                            <th>Advisory Teacher</th>
                            <th>Filled/Total Slots</th>
                            <th>Completion %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sectionSummary}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>📚 ALL SUBJECTS</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Subject Name</th>
                            <th>Type</th>
                            <th>Grade</th>
                            <th>Term/Semester</th>
                            <th>Category</th>
                            <th>Strand</th>
                            <th>Curriculum</th>
                            <th>Teachers Available</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${subjectsTable}
                    </tbody>
                </table>
            </div>
        </body>
        </html>`;
        
        const w = window.open('', '_blank', 'width=1200,height=850');
        w.document.write(htmlContent);
        w.document.close();
        
        showToast('Dashboard report ready for printing/PDF export', 'success');
        
    } catch (error) {
        console.error('Error in printDashboardReport:', error);
        showToast('PDF export failed: ' + error.message, 'error');
        throw error;
    }
}

function printDashboardReportWithScope(scope) {
    try {
        console.log('printDashboardReportWithScope called with scope:', scope);
        
        const currentDate = new Date().toLocaleDateString();
        
        // Determine scope details
        let scopeTitle = '';
        let scopeDescription = '';
        let filterTerm = null;
        let filterSemester = null;
        
        switch(scope) {
            case 'current':
                scopeTitle = 'Current Term/Semester';
                scopeDescription = `JHS Term ${window.currentTerm || '1'} | SHS Semester ${window.currentSemester || '1'}`;
                filterTerm = window.currentTerm || '1';
                filterSemester = window.currentSemester || '1';
                break;
            case 'jhs-term1':
                scopeTitle = 'JHS Term 1';
                scopeDescription = 'Junior High School - First Term';
                filterTerm = '1';
                break;
            case 'jhs-term2':
                scopeTitle = 'JHS Term 2';
                scopeDescription = 'Junior High School - Second Term';
                filterTerm = '2';
                break;
            case 'jhs-term3':
                scopeTitle = 'JHS Term 3';
                scopeDescription = 'Junior High School - Third Term';
                filterTerm = '3';
                break;
            case 'jhs-only':
                scopeTitle = 'JHS Only (All Terms)';
                scopeDescription = 'Junior High School - All Terms Combined';
                break;
            case 'shs-sem1':
                scopeTitle = 'SHS Semester 1';
                scopeDescription = 'Senior High School - First Semester';
                filterSemester = '1';
                break;
            case 'shs-sem2':
                scopeTitle = 'SHS Semester 2';
                scopeDescription = 'Senior High School - Second Semester';
                filterSemester = '2';
                break;
            case 'shs-only':
                scopeTitle = 'SHS Only (All Semesters)';
                scopeDescription = 'Senior High School - All Semesters Combined';
                break;
            case 'full-year':
                scopeTitle = 'Entire School Year';
                scopeDescription = 'All Terms and Semesters';
                break;
        }
        
        // Calculate summary statistics
        const totalTeachers = teachersCache.length;
        const totalSections = SECTIONS.length;
        const jhsSections = SECTIONS.filter(s => s.grade <= 10).length;
        const shsSections = SECTIONS.filter(s => s.grade > 10).length;
        
        // Filter subjects based on scope
        let scopedSubjects = [];
        if (scope === 'current' || scope === 'full-year') {
            scopedSubjects = [
                ...(subjectsCache.jhs || []),
                ...(subjectsCache.g11Sem1 || []),
                ...(subjectsCache.g11Sem2 || []),
                ...(subjectsCache.g12Sem1 || []),
                ...(subjectsCache.g12Sem2 || [])
            ];
        } else if (scope.startsWith('jhs-term')) {
            scopedSubjects = (subjectsCache.jhs || []).filter(s => 
                s.term === filterTerm || s.term === 'all' || !s.term
            );
        } else if (scope === 'jhs-only') {
            scopedSubjects = [...(subjectsCache.jhs || [])];
        } else if (scope === 'shs-sem1') {
            scopedSubjects = [
                ...(subjectsCache.g11Sem1 || []),
                ...(subjectsCache.g12Sem1 || [])
            ];
        } else if (scope === 'shs-sem2') {
            scopedSubjects = [
                ...(subjectsCache.g11Sem2 || []),
                ...(subjectsCache.g12Sem2 || [])
            ];
        } else if (scope === 'shs-only') {
            scopedSubjects = [
                ...(subjectsCache.g11Sem1 || []),
                ...(subjectsCache.g11Sem2 || []),
                ...(subjectsCache.g12Sem1 || []),
                ...(subjectsCache.g12Sem2 || [])
            ];
        }
        
        const totalSubjects = scopedSubjects.length;
        
        // Generate teacher summary
        let teacherSummary = '';
        teachersCache.forEach(teacher => {
            const sched = scheduleCache[teacher.id] || {};
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const totalPeriods = days.reduce((total, day) => {
                const dayData = sched[day] || {};
                return total + Object.keys(dayData).filter(k => dayData[k]?.subject).length;
            }, 0);
            
            // Calculate proper load based on what they teach
            let teachesJHS = false, teachesSHS = false;
            Object.values(sched).forEach(daySchedule => {
                Object.values(daySchedule).forEach(slot => {
                    if (slot.section) {
                        const section = SECTIONS.find(s => s.id === slot.section);
                        if (section) {
                            if (section.grade <= 10) teachesJHS = true;
                            else teachesSHS = true;
                        }
                    }
                });
            });
            
            // Use teacher's custom load if available, otherwise calculate based on what they teach
            let maxLoad = 40; // Default JHS load
            if (teacher.load && teacher.load.trim() !== '') {
                maxLoad = parseInt(teacher.load) || 40;
            } else {
                if (teachesSHS && !teachesJHS) maxLoad = 54; // SHS only
                else if (teachesSHS && teachesJHS) maxLoad = 50; // Mixed
            }
            
            const loadPct = Math.round((totalPeriods / maxLoad) * 100);
            const status = loadPct >= 90 ? 'Full Load' : loadPct >= 70 ? 'High Load' : loadPct >= 50 ? 'Moderate Load' : 'Light Load';
            const subjectsList = Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.subject || 'None');
            
            // Extract working days and calculate hours from availability
            const availability = teacher.availability || {};
            const workingDays = [];
            const hoursPerDay = [];
            
            const dayAbbrev = {
                'Monday': 'M',
                'Tuesday': 'T', 
                'Wednesday': 'W',
                'Thursday': 'Th',
                'Friday': 'F',
                'Saturday': 'S'
            };
            
            days.forEach(day => {
                const dayAvail = availability[day];
                if (dayAvail && dayAvail.available && dayAvail.timeIn && dayAvail.timeOut) {
                    workingDays.push(dayAbbrev[day]);
                    const hours = calculateHoursRendered(dayAvail.timeIn, dayAvail.timeOut);
                    hoursPerDay.push(hours);
                }
            });
            
            const workingDaysStr = workingDays.length > 0 ? workingDays.join('-') : 'No schedule';
            const avgHours = hoursPerDay.length > 0 
                ? (hoursPerDay.reduce((a, b) => a + b, 0) / hoursPerDay.length).toFixed(1)
                : '0';
            
            teacherSummary += `
                <tr>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.name}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.employment_type || 'Full-time'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${teacher.advisory_section || 'None'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:11px">${subjectsList}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:11px;text-align:center">${workingDaysStr}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${avgHours}h</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${totalPeriods}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${loadPct}%</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${status}</td>
                </tr>`;
        });
        
        // Generate section summary
        let sectionSummary = '';
        SECTIONS.forEach(section => {
            const days = section.grade <= 10 
                ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            const slots = section.grade <= 10
                ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']
                : ['p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
            
            let filled = 0;
            const total = days.length * slots.length;
            let advisoryTeacher = 'None';
            
            // Find advisory teacher and count filled slots
            teachersCache.forEach(teacher => {
                if (teacher.advisory_section === section.id) {
                    advisoryTeacher = teacher.name;
                }
                
                const teacherSched = scheduleCache[teacher.id] || {};
                days.forEach(day => {
                    const dayData = teacherSched[day] || {};
                    slots.forEach(slot => {
                        if (dayData[slot]?.section === section.id && dayData[slot]?.subject) {
                            filled++;
                        }
                    });
                });
            });
            
            const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
            const status = pct >= 90 ? 'Complete' : pct >= 70 ? 'Nearly Complete' : pct >= 50 ? 'Partial' : 'Incomplete';
            
            sectionSummary += `
                <tr>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${section.name}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${section.grade}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${section.strand || 'N/A'}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${advisoryTeacher}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${filled}/${total}</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px;text-align:center">${pct}%</td>
                    <td style="padding:8px;border:1px solid #ddd;font-size:12px">${status}</td>
                </tr>`;
        });
        
        // Generate JHS subjects table
        let jhsSubjectsTable = '';
        if (!scope.startsWith('shs-') && scope !== 'shs-only') {
            let jhsSubjects = subjectsCache.jhs || [];
            if (scope.startsWith('jhs-term') && filterTerm) {
                jhsSubjects = jhsSubjects.filter(s => s.term === filterTerm || s.term === 'all' || !s.term);
            }
            
            // Remove duplicates by creating unique subjects based on name and category only
            const uniqueSubjects = [];
            const seen = new Set();
            
            jhsSubjects.forEach(subject => {
                const key = `${subject.name}-${subject.category}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueSubjects.push(subject);
                }
            });
            
            // Sort subjects by category then by name
            uniqueSubjects.sort((a, b) => {
                if (a.category !== b.category) {
                    // Sort by category: major first, then minor, then others
                    const categoryOrder = { 'major': 1, 'minor': 2, 'core': 3, 'applied': 4 };
                    return (categoryOrder[a.category] || 5) - (categoryOrder[b.category] || 5);
                }
                return (a.name || '').localeCompare(b.name || '');
            });
            
            uniqueSubjects.forEach(subject => {
                jhsSubjectsTable += `
                    <tr>
                        <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.name || 'N/A'}</td>
                        <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.category || 'N/A'}</td>
                        <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.term || 'All Terms'}</td>
                        <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.curriculum || 'N/A'}</td>
                    </tr>`;
            });
        }
        
        // Generate SHS subjects by strands table
        let shsSubjectsTable = '';
        if (!scope.startsWith('jhs-') && scope !== 'jhs-only') {
            let shsSubjects = [];
            if (scope === 'shs-sem1' || scope === 'current' || scope === 'full-year' || scope === 'shs-only') {
                shsSubjects = [...shsSubjects, ...(subjectsCache.g11Sem1 || []), ...(subjectsCache.g12Sem1 || [])];
            }
            if (scope === 'shs-sem2' || scope === 'current' || scope === 'full-year' || scope === 'shs-only') {
                shsSubjects = [...shsSubjects, ...(subjectsCache.g11Sem2 || []), ...(subjectsCache.g12Sem2 || [])];
            }
            
            // Organize subjects by category and elective type
            const organizedGroups = {
                'Core': [],
                'Academic': [],
                'TechPro': [],
                'Applied/Specialized': []
            };
            
            shsSubjects.forEach(subject => {
                let targetGroup = 'Core';
                
                if (subject.category === 'core' || !subject.category) {
                    targetGroup = 'Core';
                } else if (subject.category === 'applied') {
                    // Check elective type for applied subjects
                    if (subject.elective_type === 'academic') {
                        targetGroup = 'Academic';
                    } else if (subject.elective_type === 'techpro') {
                        targetGroup = 'TechPro';
                    } else {
                        targetGroup = 'Applied/Specialized';
                    }
                } else {
                    targetGroup = 'Applied/Specialized';
                }
                
                organizedGroups[targetGroup].push({
                    name: subject.name || 'N/A',
                    grade: subject.grade || 'N/A',
                    semester: subject.semester || 'N/A',
                    category: subject.category || 'N/A',
                    strand: subject.strand || 'All Strands',
                    elective_type: subject.elective_type || 'N/A',
                    elective_subtype: subject.elective_subtype || 'N/A',
                    curriculum: subject.curriculum || 'N/A'
                });
            });
            
            // Add subjects grouped by organized categories
            const groupOrder = ['Core', 'Academic', 'TechPro', 'Applied/Specialized'];
            const groupColors = {
                'Core': '#22c55e',
                'Academic': '#3b82f6', 
                'TechPro': '#f97316',
                'Applied/Specialized': '#8b5cf6'
            };
            
            groupOrder.forEach(groupName => {
                if (organizedGroups[groupName].length > 0) {
                    // Sort subjects within each group by name
                    organizedGroups[groupName].sort((a, b) => a.name.localeCompare(b.name));
                    
                    organizedGroups[groupName].forEach(subject => {
                        let displayInfo = '';
                        if (groupName === 'Academic' || groupName === 'TechPro') {
                            // For electives, show subtype if available
                            if (subject.elective_subtype && subject.elective_subtype !== 'N/A') {
                                displayInfo = `${subject.elective_subtype}`;
                            } else {
                                displayInfo = subject.strand;
                            }
                        } else {
                            displayInfo = subject.strand;
                        }
                        
                        shsSubjectsTable += `
                            <tr>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px;font-weight:bold;background:${groupColors[groupName]}22;color:${groupColors[groupName]}">${groupName}</td>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.name}</td>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.grade}</td>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${subject.semester}</td>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px;text-align:center">${displayInfo}</td>
                                <td style="padding:6px;border:1px solid #ddd;font-size:11px">${subject.curriculum}</td>
                            </tr>`;
                    });
                }
            });
        }
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dashboard Report - ${scopeTitle} - ${schoolYear}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #c00; padding-bottom: 20px; }
                .header-top { display: flex; align-items: center; justify-content: center; margin-bottom: 16px; gap: 60px; }
                .logo-left, .logo-right { flex: 0 0 80px; }
                .header-center { flex: 1; text-align: center; max-width: 400px; }
                .header h1 { font-size: 24px; font-weight: bold; color: #c00; margin-bottom: 8px; }
                .header h2 { font-size: 20px; font-weight: bold; color: #8b0000; margin-bottom: 8px; }
                .header p { font-size: 14px; color: #666; }
                .wc-stripe { background: #c00; height: 4px; margin: 10px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
                .summary-card { background: linear-gradient(135deg, #f5c518 0%, #f5c518 100%); border: 2px solid #c00; border-radius: 8px; padding: 16px; text-align: center; }
                .summary-card h3 { font-size: 16px; color: #8b0000; margin-bottom: 8px; font-weight: bold; }
                .summary-card p { font-size: 24px; font-weight: bold; color: #000; }
                .summary-card small { font-size: 12px; color: #8b0000; }
                .section { margin-bottom: 40px; page-break-inside: avoid; }
                .section h2 { font-size: 18px; font-weight: bold; color: #c00; margin-bottom: 16px; border-bottom: 3px solid #c00; padding-bottom: 8px; background: linear-gradient(90deg, #f5c518 0%, #fff 100%); padding: 12px 16px; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                th { background: linear-gradient(135deg, #c00 0%, #8b0000 100%); color: white; padding: 12px 8px; font-size: 12px; font-weight: bold; border: 1px solid #8b0000; text-align: center; }
                td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
                tr:nth-child(even) { background: #f8f9fa; }
                tr:nth-child(odd) { background: #fff; }
                tr:hover { background: #fff3cd; }
                .no-print { display: none; }
                @media print {
                    .no-print { display: none !important; }
                    body { padding: 10px; }
                    .section { page-break-inside: avoid; }
                    .summary-grid { page-break-inside: avoid; }
                }
                @page { size: landscape; margin: 15mm; }
                .wc-logo { text-align: center; margin-bottom: 20px; }
                .wc-colors { display: flex; height: 8px; margin: 10px 0; }
                .wc-red { background: #c00; flex: 1; }
                .wc-gold { background: #f5c518; flex: 1; }
                .wc-dark-red { background: #8b0000; flex: 1; }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                <button onclick="window.print()" style="background: #c00; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Print / Save as PDF</button>
            </div>
            
            <div class="wc-logo">
                <div class="wc-colors">
                    <div class="wc-red"></div>
                    <div class="wc-gold"></div>
                    <div class="wc-dark-red"></div>
                </div>
            </div>
            
            <div class="header">
                <div class="header-top">
                    <div class="logo-left">
                        <img src="assets/img/logo1.png" alt="Western Colleges Logo" style="width: 80px; height: 80px; object-fit: contain;">
                    </div>
                    <div class="header-center">
                        <h1 style="font-size: 28px; font-weight: bold; color: #8b0000; margin: 0; font-family: 'Old English Text MT', serif;">Western Colleges, Inc.</h1>
                        <p style="font-size: 14px; color: #666; margin: 2px 0;">(Formerly Western Cavite Institute)</p>
                        <p style="font-size: 16px; font-weight: 600; color: #000; margin: 4px 0;">High School Department</p>
                        <div style="margin: 8px 0;">
                            <p style="font-size: 14px; color: #666; margin: 4px 0;">Naic, Cavite</p>
                            <p style="font-size: 14px; color: #666; margin: 4px 0;">Email: wcihighschool@gmail.com</p>
                            <p style="font-size: 14px; color: #666; margin: 4px 0;">Tel. No. (046) 507 0500</p>
                        </div>
                    </div>
                    <div class="logo-right">
                        <img src="assets/img/logo 3.png" alt="Western Colleges Logo" style="width: 80px; height: 80px; object-fit: contain;">
                    </div>
                </div>
                <div style="background: #c00; height: 4px; margin: 10px 0 20px 0; width: 100%;"></div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <p><strong>S.Y. ${schoolYear}</strong> | <strong>Generated:</strong> ${currentDate}</p>
                    <p><strong>Report Scope:</strong> ${scopeDescription}</p>
                    <p><strong>Current Curriculum:</strong> ${window.currentCurriculum || 'new'}</p>
                </div>
            </div>
            
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>👥 TOTAL TEACHERS</h3>
                    <p>${totalTeachers}</p>
                </div>
                <div class="summary-card">
                    <h3>🏫 TOTAL SECTIONS</h3>
                    <p>${totalSections}</p>
                    <small>JHS: ${jhsSections} | SHS: ${shsSections}</small>
                </div>
                <div class="summary-card">
                    <h3>📚 SCOPED SUBJECTS</h3>
                    <p>${totalSubjects}</p>
                    <small>${scopeTitle}</small>
                </div>
            </div>
            
            <div class="section">
                <h2>👥 TEACHERS SUMMARY</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Teacher Name</th>
                            <th>Employment</th>
                            <th>Advisory Section</th>
                            <th>Subjects Taught</th>
                            <th>Working Days</th>
                            <th>Hours/Day</th>
                            <th>Total Periods</th>
                            <th>Load %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teacherSummary}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>🏫 SECTIONS SUMMARY</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Section Name</th>
                            <th>Grade</th>
                            <th>Strand</th>
                            <th>Advisory Teacher</th>
                            <th>Filled/Total Slots</th>
                            <th>Completion %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sectionSummary}
                    </tbody>
                </table>
            </div>
            
            ${jhsSubjectsTable ? `
            <div class="section">
                <h2>📚 JHS SUBJECTS - ${scopeTitle.toUpperCase()}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Subject Name</th>
                            <th>Category</th>
                            <th>Term</th>
                            <th>Curriculum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jhsSubjectsTable}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${shsSubjectsTable ? `
            <div class="section">
                <h2>📚 SHS SUBJECTS BY CATEGORIES - ${scopeTitle.toUpperCase()}</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Subject Name</th>
                            <th>Grade</th>
                            <th>Semester</th>
                            <th>Strand/Type</th>
                            <th>Curriculum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shsSubjectsTable}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </body>
        </html>`;
        
        const w = window.open('', '_blank', 'width=1200,height=850');
        w.document.write(htmlContent);
        w.document.close();
        
        showToast(`Dashboard report (${scopeTitle}) ready for printing/PDF export`, 'success');
        
    } catch (error) {
        console.error('Error in printDashboardReportWithScope:', error);
        showToast('PDF export failed: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
// TEACHER VIEW TOGGLE FUNCTIONS
// ============================================================

// Initialize teacher view state from localStorage
let currentTeacherView = localStorage.getItem('teacherView') || 'grid';

async function switchTeacherView(view) {
    currentTeacherView = view;
    localStorage.setItem('teacherView', view);
    
    // Update button states
    const gridBtn = document.getElementById('teacherViewGrid');
    const listBtn = document.getElementById('teacherViewList');
    
    if (gridBtn && listBtn) {
        gridBtn.classList.toggle('active', view === 'grid');
        listBtn.classList.toggle('active', view === 'list');
    }
    
    // Show/hide appropriate containers
    const gridContainer = document.getElementById('teacherListGrid');
    const listContainer = document.getElementById('teacherListView');
    
    if (gridContainer && listContainer) {
        if (view === 'grid') {
            gridContainer.style.display = 'grid';
            listContainer.style.display = 'none';
            await filterTeacherGrid();
        } else {
            gridContainer.style.display = 'none';
            listContainer.style.display = 'block';
            await filterTeacherGrid();
        }
    }
}

function renderTeacherList(list) {
    const tbody = document.getElementById('teacherListBody');
    if (!tbody) return;
    
    const teachers = list || teachersCache || [];
    
    tbody.innerHTML = teachers.map(t => {
        const subjDisplay = Array.isArray(t.subjects) && t.subjects.length
            ? t.subjects.join(', ')
            : t.subject || 'No subjects assigned';
        
        const deptDisplay = [];
        if (t.departments?.jhs) deptDisplay.push('JHS');
        if (t.departments?.shs) {
            let shsLabel = 'SHS';
            const grades = [];
            if (t.departments?.grade11) grades.push('G11');
            if (t.departments?.grade12) grades.push('G12');
            if (grades.length > 0) shsLabel += ` (${grades.join(', ')})`;
            deptDisplay.push(shsLabel);
        }
        
        const loadPercentage = calculateTeacherLoadPercentage(t);
        const loadColor = loadPercentage >= 90 ? '#ef4444' : loadPercentage >= 70 ? '#f97316' : '#22c55e';
        
        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:12px">
                        <div class="tc-avatar ${getAvatarColor(t.id)}" style="width:36px;height:36px;font-size:14px">${getInitials(t.name)}</div>
                        <div>
                            <div style="font-weight:600;font-size:14px">${t.name}</div>
                            <div style="font-size:11px;color:var(--text2);margin-top:2px">
                                <span style="padding:2px 6px;border-radius:10px;font-weight:600;${t.employment_type==='part-time'?'background:rgba(249,115,22,0.15);color:#f97316':'background:rgba(34,197,94,0.15);color:#22c55e'}">
                                    ${t.employment_type==='part-time'?'Part Time':'Full Time'}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${subjDisplay}">
                        ${subjDisplay}
                    </div>
                </td>
                <td>
                    <div style="font-size:13px">
                        ${deptDisplay.length > 0 ? deptDisplay.join(', ') : 'No departments'}
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="font-size:13px;font-weight:600;color:${loadColor}">
                            ${loadPercentage}%
                        </div>
                        <div style="width:60px;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden">
                            <div style="width:${Math.min(loadPercentage, 100)}%;height:100%;background:${loadColor};border-radius:3px;transition:width 0.3s"></div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text2);margin-top:2px">
                        ${t.total_periods || 0} periods
                    </div>
                </td>
                <td>
                    <div style="display:flex;gap:4px">
                        <button onclick="openTeacherPanel('${t.id}')" 
                            style="padding:4px 8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:4px;font-size:11px;cursor:pointer;transition:all 0.2s"
                            onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
                            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">
                            📅 Schedule
                        </button>
                        <button onclick="openEditTeacher('${t.id}')" 
                            style="padding:4px 8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:4px;font-size:11px;cursor:pointer;transition:all 0.2s"
                            onmouseover="this.style.borderColor='var(--green)';this.style.color='var(--green)'"
                            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">
                            ✏ Edit
                        </button>
                        <button onclick="removeTeacher('${t.id}','${t.name.replace(/'/g,"\\'")}') " 
                            style="padding:4px 8px;border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:4px;font-size:11px;cursor:pointer;transition:all 0.2s"
                            onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'"
                            onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text2)'">
                            ✕
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Initialize view on page load
function initializeTeacherView() {
    // Set initial view state
    switchTeacherView(currentTeacherView);
}

// Call initialization when teachers view is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize teacher view when the page loads
    setTimeout(() => {
        if (currentView === 'teachers') {
            initializeTeacherView();
        }
    }, 100);
});

// ============================================================
// SUBJECT VIEW TOGGLE FUNCTIONS
// ============================================================

// Initialize subject view state from localStorage
let currentSubjectView = localStorage.getItem('subjectView') || 'tile';

function switchSubjectView(view) {
    currentSubjectView = view;
    localStorage.setItem('subjectView', view);
    
    // Update button states
    const tileBtn = document.getElementById('subjectViewTile');
    const listBtn = document.getElementById('subjectViewList');
    
    if (tileBtn && listBtn) {
        tileBtn.classList.toggle('active', view === 'tile');
        listBtn.classList.toggle('active', view === 'list');
    }
    
    // Re-render subjects view with new layout
    renderSubjectsView();
}

function initializeSubjectView() {
    // Set initial view state
    const tileBtn = document.getElementById('subjectViewTile');
    const listBtn = document.getElementById('subjectViewList');
    
    if (tileBtn && listBtn) {
        tileBtn.classList.toggle('active', currentSubjectView === 'tile');
        listBtn.classList.toggle('active', currentSubjectView === 'list');
    }
}

// ============================================================
// ENHANCED EXPORT SCOPE HANDLING
// ============================================================

// Function to normalize scope values for backward compatibility
function normalizeScopeValue(scope) {
    const scopeMapping = {
        'jhs-all': 'jhs-only',
        'shs-all': 'shs-only',
        'jhs-section': 'jhs-only',  // Default to all JHS if section is selected but no sub-option
        'shs-section': 'shs-only'   // Default to all SHS if section is selected but no sub-option
    };
    
    return scopeMapping[scope] || scope;
}

// Override the executeDashboardExport function to handle new scope values
const originalExecuteDashboardExport = window.executeDashboardExport;
window.executeDashboardExport = function(modal) {
    const selectedScope = modal.querySelector('input[name="exportScope"]:checked').value;
    const normalizedScope = normalizeScopeValue(selectedScope);
    modal.remove();
    exportDashboardToExcelWithScope(normalizedScope);
};

// Override the executeDashboardPDFExport function to handle new scope values
const originalExecuteDashboardPDFExport = window.executeDashboardPDFExport;
window.executeDashboardPDFExport = function(modal) {
    const selectedScope = modal.querySelector('input[name="pdfExportScope"]:checked').value;
    const normalizedScope = normalizeScopeValue(selectedScope);
    modal.remove();
    printDashboardReportWithScope(normalizedScope);
};
// ============================================================
// COLLAPSIBLE EXPORT SCOPE OPTIONS
// ============================================================

function toggleScopeOptions(prefix) {
    const idPrefix = prefix === 'pdf' ? 'pdf' : 'excel';
    const selectorName = prefix === 'pdf' ? 'pdfExportScope' : 'exportScope';
    const jhsOptions = document.getElementById(`${idPrefix}JhsOptions`);
    const shsOptions = document.getElementById(`${idPrefix}ShsOptions`);
    const selectedValue = document.querySelector(`input[name="${selectorName}"]:checked`)?.value;
    const jhsVisible = jhsOptions && jhsOptions.style.display === 'block';
    const shsVisible = shsOptions && shsOptions.style.display === 'block';
    
    if (jhsOptions) jhsOptions.style.display = 'none';
    if (shsOptions) shsOptions.style.display = 'none';
    
    if (selectedValue === 'jhs-section' && jhsOptions) {
        if (!jhsVisible) {
            jhsOptions.style.display = 'block';
            const jhsAllOption = document.querySelector(`input[name="${selectorName}"][value="jhs-all"]`);
            if (jhsAllOption) jhsAllOption.checked = true;
        } else {
            const currentOption = document.querySelector(`input[name="${selectorName}"][value="current"]`);
            if (currentOption) currentOption.checked = true;
        }
    } else if (selectedValue === 'shs-section' && shsOptions) {
        if (!shsVisible) {
            shsOptions.style.display = 'block';
            const shsAllOption = document.querySelector(`input[name="${selectorName}"][value="shs-all"]`);
            if (shsAllOption) shsAllOption.checked = true;
        } else {
            const currentOption = document.querySelector(`input[name="${selectorName}"][value="current"]`);
            if (currentOption) currentOption.checked = true;
        }
    }
}

const togglePDFScopeOptions = () => toggleScopeOptions('pdf');
const toggleExcelScopeOptions = () => toggleScopeOptions('excel');



