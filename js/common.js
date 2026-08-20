/**
 * Pathology Core - Common UI Controller
 * Handles Navigation, Header Actions (Search, Filters, Notifications, History, Emergency Log, Profile),
 * Modals, and Clinical Toast Alerts across all pages.
 */

// Organ Icon Mapping
const ORGAN_ICONS = {
    'Lung': 'pulmonology',
    'Heart': 'cardiology',
    'Liver': 'fluid',
    'Kidney': 'nephrology',
    'Pancreas': 'prescriptions',
    'Spleen': 'water_drop',
    'Intestines': 'airline_seat_flat',
    'Other': 'more_horiz'
};

function getOrganIcon(organ) {
    return ORGAN_ICONS[organ] || 'biotech';
}

// Date and Time formatting utilities (English)
function formatDateTime(dateString) {
    if (!dateString) return '--';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString.replace('T', ' ');
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatDateOnly(dateString) {
    if (!dateString) return '--';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString.split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Relative time formatter
function formatRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes} (Today)`;
    }
    if (diffDay === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Toast Notification System
function showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('clinical-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'clinical-toast-container';
        container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl transform transition-all duration-300 translate-y-4 opacity-0 text-sm font-medium';

    let icon = 'check_circle';
    if (type === 'success') {
        toast.className += ' bg-[#0B1326] border-primary/40 text-on-surface shadow-[0_0_20px_rgba(6,182,212,0.25)]';
        icon = 'check_circle';
    } else if (type === 'error') {
        toast.className += ' bg-[#0B1326] border-error/50 text-error shadow-[0_0_20px_rgba(255,180,171,0.25)]';
        icon = 'error';
    } else if (type === 'warning') {
        toast.className += ' bg-[#0B1326] border-tertiary-container/50 text-tertiary-container shadow-[0_0_20px_rgba(255,127,139,0.25)]';
        icon = 'warning';
    } else {
        toast.className += ' bg-[#0B1326] border-outline-variant text-on-surface';
        icon = 'info';
    }

    toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px] ${type === 'success' ? 'text-primary' : (type === 'error' ? 'text-error' : 'text-tertiary-container')}">${icon}</span>
        <span>${message}</span>
        <button class="ml-3 text-on-surface-variant hover:text-white" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Specimen Detail Modal Viewer
function openSpecimenModal(specimenId) {
    const specimen = SpecimenStore.getById(specimenId);
    if (!specimen) {
        showToast('Specimen not found', 'error');
        return;
    }

    let modal = document.getElementById('specimen-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'specimen-detail-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    const organIcon = getOrganIcon(specimen.organ);
    const medHist = (specimen.medicalHistory && specimen.medicalHistory.length)
        ? specimen.medicalHistory.map(m => `<span class="bg-surface-container-high px-2 py-0.5 rounded text-xs text-primary border border-outline-variant">${m}</span>`).join(' ')
        : '<span class="text-on-surface-variant text-xs">None documented</span>';

    const statusOptionsBadges = (specimen.statusOptions && specimen.statusOptions.length)
        ? specimen.statusOptions.map(opt => `<span class="bg-secondary/15 text-secondary border border-secondary/30 px-2 py-0.5 rounded text-xs font-semibold">${opt}</span>`).join(' ')
        : '<span class="text-on-surface-variant text-xs">None selected</span>';

    const statusBadge = specimen.status === 'Clear'
        ? '<span class="bg-secondary/10 text-secondary text-xs uppercase font-bold px-2 py-0.5 rounded border border-secondary/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Clear</span>'
        : (specimen.status === 'Pending'
            ? '<span class="bg-tertiary-container/10 text-tertiary-container text-xs uppercase font-bold px-2 py-0.5 rounded border border-tertiary-container/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span> Pending</span>'
            : '<span class="bg-error/10 text-error text-xs uppercase font-bold px-2 py-0.5 rounded border border-error/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> Flagged</span>');

    modal.innerHTML = `
        <div class="glass-panel bg-surface-container-low border border-[#334155] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col glow-shadow overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-md border-b border-outline-variant bg-surface-container">
                <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-primary text-[28px]">${organIcon}</span>
                    <div>
                        <div class="flex items-center gap-sm">
                            <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">${specimen.donorId}</h2>
                            ${statusBadge}
                        </div>
                        <span class="font-mono-data text-xs text-on-surface-variant">${specimen.tid || specimen.id} • ${specimen.organ}${specimen.position ? ' (' + specimen.position + ')' : ''}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="openEditSpecimenModal('${specimen.id}')" class="px-2.5 py-1 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 text-xs font-semibold flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">edit</span> Edit Record
                    </button>
                    <button class="text-on-surface-variant hover:text-white p-1 rounded-lg transition-colors" onclick="document.getElementById('specimen-detail-modal').classList.add('hidden')">
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="p-lg overflow-y-auto flex flex-col gap-md">
                <!-- Barcode & Tracking Section -->
                <div class="flex flex-col sm:flex-row justify-between items-center bg-surface-container/50 p-md rounded-lg border border-outline-variant/30 gap-md">
                    <div class="flex flex-col gap-1">
                        <span class="text-xs uppercase tracking-wider text-on-surface-variant font-semibold">Barcode / Tracking ID</span>
                        <svg id="modal-barcode-svg" class="max-w-[200px] h-12"></svg>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="openEditSpecimenModal('${specimen.id}')" class="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant text-xs font-semibold flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-[16px]">edit</span> Edit Info
                        </button>
                        <button onclick="printSpecimenLabel('${specimen.id}')" class="px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-[16px]">print</span> Print Tube Label
                        </button>
                    </div>
                </div>

                <!-- 2-Column Info Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-md text-sm">
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Organ & Preservation</span>
                        <span class="text-on-surface font-medium">${specimen.organ}${specimen.position ? ' (' + specimen.position + ')' : ''} • ${specimen.preservation}</span>
                    </div>
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Storage Location</span>
                        <span class="font-mono-data text-on-surface">${specimen.location || 'Unassigned'}</span>
                    </div>
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Demographics</span>
                        <span class="text-on-surface font-medium">${specimen.age ? specimen.age + ' yrs' : 'Age N/A'}, ${specimen.gender || 'Gender N/A'}, BMI: ${specimen.bmi ? specimen.bmi + ' kg/m²' : 'N/A'}</span>
                    </div>
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Cause of Death</span>
                        <span class="text-on-surface font-medium">${specimen.causeOfDeath || 'Not specified'}</span>
                    </div>
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Warm Ischemia</span>
                        <span class="font-mono-data text-on-surface">${specimen.warmIschemiaNA ? 'N/A' : (specimen.warmIschemia ? specimen.warmIschemia + ' mins' : 'N/A')}</span>
                    </div>
                    <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Cold Ischemia Duration</span>
                        <span class="font-mono-data text-secondary font-bold">${specimen.coldIschemia || 'N/A'} (Clamp: ${formatDateTime(specimen.clampTime)}, Collect: ${formatDateTime(specimen.collectionTime)})</span>
                    </div>
                </div>

                <!-- Perfusion / Modality Status Options -->
                <div class="flex flex-col gap-1.5 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-on-surface-variant uppercase font-semibold">Status / Perfusion & Modality</span>
                        <span class="text-xs font-semibold ${specimen.histology ? 'text-primary' : 'text-on-surface-variant'}">Histology: ${specimen.histology ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-1">
                        ${statusOptionsBadges}
                    </div>
                </div>

                <!-- Medical History -->
                <div class="flex flex-col gap-1.5 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                    <span class="text-xs text-on-surface-variant uppercase font-semibold">Documented Medical History</span>
                    <div class="flex flex-wrap gap-1.5 mt-1">
                        ${medHist}
                    </div>
                </div>

                <!-- Clinical Remarks -->
                <div class="flex flex-col gap-1 p-sm rounded bg-surface-container/30 border border-outline-variant/20">
                    <span class="text-xs text-on-surface-variant uppercase font-semibold">Clinical Remarks & Handling Notes</span>
                    <p class="text-xs text-on-surface font-body-md whitespace-pre-wrap">${specimen.remarks || 'No remarks entered.'}</p>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-between items-center p-md border-t border-outline-variant bg-surface-container">
                <button onclick="confirmDeleteSpecimen('${specimen.id}')" class="px-3 py-1.5 rounded bg-error/10 hover:bg-error/20 text-error border border-error/30 text-xs font-semibold flex items-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[16px]">delete</span> Delete Record
                </button>
                <div class="flex gap-2">
                    <button onclick="openEditSpecimenModal('${specimen.id}')" class="px-3 py-1.5 rounded bg-primary hover:bg-primary-fixed text-on-primary text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm">
                        <span class="material-symbols-outlined text-[16px]">edit</span> Edit Specimen
                    </button>
                    <button onclick="document.getElementById('specimen-detail-modal').classList.add('hidden')" class="px-4 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:text-white text-xs font-semibold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    if (typeof JsBarcode !== 'undefined') {
        try {
            JsBarcode('#modal-barcode-svg', specimen.donorId, {
                format: "CODE128",
                lineColor: "#4CD7F6",
                background: "transparent",
                width: 1.5,
                height: 35,
                displayValue: true,
                fontSize: 10,
                textColor: "#dae2fd"
            });
        } catch (e) {
            console.log('Barcode rendering error:', e);
        }
    }
}

// Specimen Edit Modal
function openEditSpecimenModal(specimenId) {
    const specimen = SpecimenStore.getById(specimenId);
    if (!specimen) return;

    let modal = document.getElementById('specimen-edit-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'specimen-edit-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    const organs = ['Lung', 'Heart', 'Liver', 'Kidney', 'Pancreas', 'Spleen', 'Intestines', 'Other'];
    const organOptionsHtml = organs.map(org => `<option value="${org}" ${specimen.organ === org ? 'selected' : ''}>${org}</option>`).join('');

    const medHistList = ['HTN', 'Diabetes', 'CAD', 'COPD', 'Obesity', 'CKD', 'Liver', 'Tobacco', 'Alcohol', 'Drugs'];
    const medHistMap = {
        'HTN': 'Hypertension (HTN)',
        'Diabetes': 'Diabetes Mellitus',
        'CAD': 'Coronary Artery Disease',
        'COPD': 'COPD',
        'Obesity': 'Clinical Obesity',
        'CKD': 'Chronic Kidney Disease',
        'Liver': 'Liver Cirrhosis',
        'Tobacco': 'Tobacco / Smoking',
        'Alcohol': 'Alcohol Consumption',
        'Drugs': 'Drug Abuse'
    };
    const medHistHtml = medHistList.map(item => {
        const checked = (specimen.medicalHistory && specimen.medicalHistory.includes(item)) ? 'checked' : '';
        return `
            <label class="flex items-center gap-1.5 cursor-pointer text-xs group">
                <input type="checkbox" class="checkbox-clinical edit-medhist-cb" value="${item}" ${checked}/>
                <span class="text-on-surface group-hover:text-primary transition-colors">${medHistMap[item] || item}</span>
            </label>
        `;
    }).join('');

    const statusOptions = ['NMP', 'HMP', 'Structure Image'];
    const statusOptionsHtml = statusOptions.map(opt => {
        const checked = (specimen.statusOptions && specimen.statusOptions.includes(opt)) ? 'checked' : '';
        const desc = opt === 'NMP' ? '(Normothermic)' : (opt === 'HMP' ? '(Hypothermic)' : '(OCT/PAI/Ultrasound)');
        return `
            <label class="flex items-center gap-1.5 cursor-pointer text-xs group">
                <input type="checkbox" class="checkbox-clinical edit-status-opt-cb" value="${opt}" ${checked}/>
                <span class="text-on-surface font-semibold group-hover:text-primary transition-colors">${opt}</span>
                <span class="text-[10px] text-on-surface-variant">${desc}</span>
            </label>
        `;
    }).join('');

    const isLungOrKidney = specimen.organ === 'Lung' || specimen.organ === 'Kidney';

    modal.innerHTML = `
        <div class="glass-panel bg-surface-container-low border border-[#334155] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col glow-shadow overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-md border-b border-outline-variant bg-surface-container">
                <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-primary text-[24px]">edit_note</span>
                    <div>
                        <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Edit Specimen Record</h2>
                        <span class="font-mono-data text-xs text-on-surface-variant">${specimen.donorId} • Tracking ID: ${specimen.tid || specimen.id}</span>
                    </div>
                </div>
                <button class="text-on-surface-variant hover:text-white p-1 rounded-lg transition-colors" onclick="document.getElementById('specimen-edit-modal').classList.add('hidden')">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <!-- Modal Form Body -->
            <form id="specimen-edit-form" class="p-lg overflow-y-auto flex flex-col gap-md">
                <!-- Row 1: Donor ID & Organ & Position -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Donor ID <span class="text-error">*</span></label>
                        <input id="edit-donor-id" type="text" required value="${specimen.donorId}" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 font-mono-data text-sm uppercase"/>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Organ Type <span class="text-error">*</span></label>
                        <select id="edit-organ" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 text-sm cursor-pointer">
                            ${organOptionsHtml}
                        </select>
                    </div>
                    <div id="edit-position-group" class="flex flex-col gap-1 ${isLungOrKidney ? '' : 'hidden'}">
                        <label class="text-xs text-primary uppercase font-semibold">Position (Side / Anatomy)</label>
                        <select id="edit-position" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 text-sm cursor-pointer">
                            <option value="" ${!specimen.position ? 'selected' : ''}>None / Unspecified</option>
                            <option value="Right" ${specimen.position === 'Right' ? 'selected' : ''}>Right</option>
                            <option value="Left" ${specimen.position === 'Left' ? 'selected' : ''}>Left</option>
                            <option value="Enbloc" ${specimen.position === 'Enbloc' ? 'selected' : ''}>Enbloc</option>
                        </select>
                    </div>
                </div>

                <!-- Row 2: Preservation, Storage Location, Status Flag -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Preservation</label>
                        <select id="edit-preservation" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 text-sm cursor-pointer">
                            <option value="-80C Frozen" ${specimen.preservation === '-80C Frozen' ? 'selected' : ''}>-80C Frozen</option>
                            <option value="Fixed" ${specimen.preservation === 'Fixed' ? 'selected' : ''}>Fixed</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Storage Location</label>
                        <input id="edit-location" type="text" value="${specimen.location || ''}" placeholder="e.g. S1/R2/B05" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 font-mono-data text-sm"/>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Quality Status Flag</label>
                        <select id="edit-status-flag" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1.5 px-2.5 text-sm cursor-pointer">
                            <option value="Clear" ${specimen.status === 'Clear' ? 'selected' : ''}>Clear (Passed)</option>
                            <option value="Pending" ${specimen.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Flagged" ${specimen.status === 'Flagged' ? 'selected' : ''}>Flagged</option>
                        </select>
                    </div>
                </div>

                <!-- Row 3: Demographics -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-md bg-surface-container/30 p-sm rounded-lg border border-outline-variant/30">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Age (Yrs)</label>
                        <input id="edit-age" type="number" min="0" max="120" value="${specimen.age || ''}" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm font-mono-data"/>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Gender</label>
                        <select id="edit-gender" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm cursor-pointer">
                            <option value="" ${!specimen.gender ? 'selected' : ''}>Select</option>
                            <option value="Male" ${specimen.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${specimen.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${specimen.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">BMI (kg/m²)</label>
                        <input id="edit-bmi" type="number" step="0.1" min="10" max="70" value="${specimen.bmi || ''}" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm font-mono-data"/>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Reason of Death</label>
                        <input id="edit-cause-of-death" type="text" value="${specimen.causeOfDeath || ''}" placeholder="Cause..." class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm"/>
                    </div>
                </div>

                <!-- Row 4: Timing & Cold Ischemia -->
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-md bg-surface-container/30 p-sm rounded-lg border border-outline-variant/30">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Warm Isch (Mins)</label>
                        <div class="flex items-center gap-1.5">
                            <input id="edit-warm-ischemia" type="number" min="0" value="${specimen.warmIschemia || ''}" ${specimen.warmIschemiaNA ? 'disabled' : ''} class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm font-mono-data"/>
                            <label class="flex items-center gap-1 text-[11px] text-on-surface-variant cursor-pointer whitespace-nowrap">
                                <input id="edit-warm-ischemia-na" type="checkbox" class="checkbox-clinical" ${specimen.warmIschemiaNA ? 'checked' : ''}/>
                                <span>N/A</span>
                            </label>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Clamp Time</label>
                        <input id="edit-clamp-time" type="text" value="${specimen.clampTime || ''}" placeholder="YYYY-MM-DD HH:mm" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm font-mono-data cursor-pointer"/>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Collection Time</label>
                        <input id="edit-collection-time" type="text" value="${specimen.collectionTime || ''}" placeholder="YYYY-MM-DD HH:mm" class="input-clinical bg-[#0F172A] text-white w-full rounded-md py-1 px-2 text-sm font-mono-data cursor-pointer"/>
                    </div>
                    <div class="flex flex-col gap-1 justify-center border-l border-outline-variant/30 pl-sm">
                        <span class="text-[11px] text-on-surface-variant uppercase font-semibold">Cold Ischemia Time</span>
                        <span id="edit-cold-isch-display" class="font-mono-data text-secondary font-bold text-sm">${specimen.coldIschemia || 'N/A'}</span>
                    </div>
                </div>

                <!-- Row 5: Status Options & Histology -->
                <div class="flex flex-col sm:flex-row gap-md bg-surface-container/30 p-sm rounded-lg border border-outline-variant/30">
                    <div class="flex-1 flex flex-col gap-1">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Status (Check all that apply)</label>
                        <div class="flex flex-wrap gap-md mt-1">
                            ${statusOptionsHtml}
                        </div>
                    </div>
                    <div class="sm:w-[150px] flex flex-col gap-1 sm:border-l sm:border-outline-variant/30 sm:pl-md justify-center">
                        <label class="text-xs text-on-surface-variant uppercase font-semibold">Histology</label>
                        <label class="flex items-center gap-2 cursor-pointer mt-1">
                            <input id="edit-histology" type="checkbox" class="checkbox-clinical" ${specimen.histology ? 'checked' : ''}/>
                            <span class="text-xs text-on-surface font-semibold">Histology</span>
                        </label>
                    </div>
                </div>

                <!-- Row 6: Medical History -->
                <div class="flex flex-col gap-1 bg-surface-container/20 p-sm rounded-lg border border-outline-variant/20">
                    <label class="text-xs text-on-surface-variant uppercase font-semibold">Medical History</label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        ${medHistHtml}
                    </div>
                </div>

                <!-- Row 7: Manual Remarks -->
                <div class="flex flex-col gap-1 bg-surface-container/20 p-sm rounded-lg border border-outline-variant/20">
                    <label class="text-xs text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px] text-primary">edit_note</span> Manual Remarks
                    </label>
                    <textarea id="edit-remarks" rows="3" class="input-clinical bg-[#0F172A] text-white w-full rounded-md p-2 text-xs font-body-md" placeholder="Enter clinical notes...">${specimen.remarks || ''}</textarea>
                </div>
            </form>

            <!-- Modal Footer -->
            <div class="flex justify-between items-center p-md border-t border-outline-variant bg-surface-container">
                <button type="button" onclick="document.getElementById('specimen-edit-modal').classList.add('hidden')" class="px-4 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:text-white text-xs font-semibold">
                    Cancel
                </button>
                <button type="button" id="btn-save-specimen-edit" class="px-5 py-1.5 rounded bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all">
                    <span class="material-symbols-outlined text-[16px]">save</span> Save Changes
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    // Attach dynamic listeners
    const editOrgan = document.getElementById('edit-organ');
    const editPosGroup = document.getElementById('edit-position-group');
    editOrgan.addEventListener('change', () => {
        if (editOrgan.value === 'Lung' || editOrgan.value === 'Kidney') {
            editPosGroup.classList.remove('hidden');
        } else {
            editPosGroup.classList.add('hidden');
            document.getElementById('edit-position').value = '';
        }
    });

    const warmNaCb = document.getElementById('edit-warm-ischemia-na');
    const warmInput = document.getElementById('edit-warm-ischemia');
    warmNaCb.addEventListener('change', () => {
        warmInput.disabled = warmNaCb.checked;
        if (warmNaCb.checked) warmInput.value = '';
    });

    // Initialize Flatpickr
    function recalculateEditColdIsch() {
        const clampVal = document.getElementById('edit-clamp-time').value.trim();
        const collectVal = document.getElementById('edit-collection-time').value.trim();
        const display = document.getElementById('edit-cold-isch-display');
        if (!clampVal || !collectVal) {
            display.textContent = 'N/A';
            return;
        }
        const d1 = new Date(clampVal.replace(' ', 'T'));
        const d2 = new Date(collectVal.replace(' ', 'T'));
        if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) {
            display.textContent = 'Invalid duration';
            return;
        }
        const diffMinutes = Math.floor((d2 - d1) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        display.textContent = `${hours}h ${mins}min`;
    }

    if (typeof flatpickr !== 'undefined') {
        const fpConfig = {
            enableTime: true,
            time_24hr: true,
            dateFormat: "Y-m-d H:i",
            altInput: false,
            allowInput: true,
            disableMobile: true,
            locale: "default",
            onChange: function() {
                recalculateEditColdIsch();
            }
        };
        flatpickr("#edit-clamp-time", fpConfig);
        flatpickr("#edit-collection-time", fpConfig);
    }

    document.getElementById('edit-clamp-time').addEventListener('input', recalculateEditColdIsch);
    document.getElementById('edit-collection-time').addEventListener('input', recalculateEditColdIsch);

    // Save handler
    document.getElementById('btn-save-specimen-edit').onclick = () => {
        const donorId = document.getElementById('edit-donor-id').value.trim();
        if (!donorId) {
            showToast('Donor ID is required.', 'error');
            return;
        }

        const organ = document.getElementById('edit-organ').value;
        const position = (organ === 'Lung' || organ === 'Kidney') ? document.getElementById('edit-position').value : '';
        const preservation = document.getElementById('edit-preservation').value;
        const location = document.getElementById('edit-location').value.trim();
        const status = document.getElementById('edit-status-flag').value;
        const age = document.getElementById('edit-age').value ? parseInt(document.getElementById('edit-age').value, 10) : null;
        const gender = document.getElementById('edit-gender').value;
        const bmi = document.getElementById('edit-bmi').value ? parseFloat(document.getElementById('edit-bmi').value) : null;
        const causeOfDeath = document.getElementById('edit-cause-of-death').value.trim();

        const warmIschemiaNA = document.getElementById('edit-warm-ischemia-na').checked;
        const warmIschemia = (!warmIschemiaNA && document.getElementById('edit-warm-ischemia').value) ? parseInt(document.getElementById('edit-warm-ischemia').value, 10) : null;

        const clampTime = document.getElementById('edit-clamp-time').value.trim();
        const collectionTime = document.getElementById('edit-collection-time').value.trim();

        let coldIschemia = 'N/A';
        let coldIschemiaMinutes = 0;
        if (clampTime && collectionTime) {
            const d1 = new Date(clampTime.replace(' ', 'T'));
            const d2 = new Date(collectionTime.replace(' ', 'T'));
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                coldIschemiaMinutes = Math.floor((d2 - d1) / 60000);
                coldIschemia = `${Math.floor(coldIschemiaMinutes / 60)}h ${coldIschemiaMinutes % 60}min`;
            }
        }

        const statusOptions = Array.from(document.querySelectorAll('.edit-status-opt-cb:checked')).map(cb => cb.value);
        const histology = document.getElementById('edit-histology').checked;
        const medicalHistory = Array.from(document.querySelectorAll('.edit-medhist-cb:checked')).map(cb => cb.value);
        const remarks = document.getElementById('edit-remarks').value.trim();

        const updatedSpecimen = {
            ...specimen,
            donorId,
            organ,
            position,
            preservation,
            location,
            status,
            age,
            gender,
            bmi,
            causeOfDeath,
            warmIschemia,
            warmIschemiaNA,
            clampTime,
            collectionTime,
            coldIschemia,
            coldIschemiaMinutes,
            statusOptions,
            histology,
            medicalHistory,
            remarks
        };

        SpecimenStore.save(updatedSpecimen);
        showToast(`Specimen ${donorId} updated successfully!`, 'success');
        modal.classList.add('hidden');

        // If detail modal is open, refresh it
        const detailModal = document.getElementById('specimen-detail-modal');
        if (detailModal && !detailModal.classList.contains('hidden')) {
            openSpecimenModal(specimen.id);
        }
    };
}

// Print Specimen Label Helper
function printSpecimenLabel(specimenId) {
    const specimen = SpecimenStore.getById(specimenId);
    if (!specimen) return;

    const settings = SpecimenStore.getSettings();
    const statusText = (specimen.statusOptions && specimen.statusOptions.length) ? specimen.statusOptions.join(', ') : 'None';
    const organLabel = specimen.organ + (specimen.position ? ` (${specimen.position})` : '');

    const printWin = window.open('', '_blank', 'width=500,height=440');
    printWin.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <title>Specimen Label - ${specimen.donorId}</title>
            <style>
                body { font-family: monospace; padding: 15px; margin: 0; color: #000; }
                .label-box { border: 2px solid #000; padding: 10px; width: 330px; border-radius: 6px; }
                .title { font-size: 13px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: 0.5px; }
                .row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
                .barcode { text-align: center; margin-top: 8px; font-size: 16px; font-weight: bold; letter-spacing: 2px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="label-box">
                <div class="title">PATHOLOGY CORE • ${settings.labId || 'TANG LAB'}</div>
                <div class="row"><strong>DONOR ID:</strong> <span>${specimen.donorId}</span></div>
                <div class="row"><strong>ORGAN:</strong> <span>${organLabel}</span></div>
                <div class="row"><strong>STATUS:</strong> <span>${statusText}</span></div>
                <div class="row"><strong>HISTOLOGY:</strong> <span>${specimen.histology ? 'YES' : 'NO'}</span></div>
                <div class="row"><strong>TYPE:</strong> <span>${specimen.preservation}</span></div>
                <div class="row"><strong>LOCATION:</strong> <span>${specimen.location}</span></div>
                <div class="row"><strong>COLD ISCH:</strong> <span>${specimen.coldIschemia || 'N/A'}</span></div>
                <div class="row"><strong>DATE:</strong> <span>${formatDateOnly(specimen.createdAt)}</span></div>
                <div class="barcode">||| |||||| |||| ||||| |||</div>
                <div style="text-align:center; font-size:10px;">${specimen.tid || specimen.id}</div>
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
}

// Confirm Delete Specimen
function confirmDeleteSpecimen(specimenId) {
    if (confirm('Are you sure you want to permanently delete this specimen record?')) {
        const deleted = SpecimenStore.delete(specimenId);
        if (deleted) {
            showToast('Specimen record deleted', 'success');
            const modal = document.getElementById('specimen-detail-modal');
            if (modal) modal.classList.add('hidden');
        } else {
            showToast('Failed to delete specimen', 'error');
        }
    }
}

// Notifications Dropdown Handler
function toggleNotificationsPopup() {
    let popup = document.getElementById('notifications-dropdown');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'notifications-dropdown';
        popup.className = 'absolute right-12 top-14 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl z-50 p-md flex flex-col gap-sm hidden';
        document.body.appendChild(popup);
    }

    if (popup.classList.contains('hidden')) {
        renderNotifications();
        popup.classList.remove('hidden');
    } else {
        popup.classList.add('hidden');
    }
}

function renderNotifications() {
    const popup = document.getElementById('notifications-dropdown');
    if (!popup) return;

    const list = SpecimenStore.getNotifications();
    const itemsHtml = list.length ? list.map(n => `
        <div class="p-xs rounded bg-surface-container-low border border-outline-variant/30 flex flex-col gap-0.5 text-xs">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-on-surface ${n.type === 'warning' ? 'text-tertiary-container' : 'text-primary'}">${n.title}</span>
                <span class="text-[10px] text-on-surface-variant">${n.time || 'Today'}</span>
            </div>
            <p class="text-on-surface-variant">${n.message}</p>
        </div>
    `).join('') : '<p class="text-xs text-on-surface-variant text-center py-4">No recent notifications</p>';

    popup.innerHTML = `
        <div class="flex justify-between items-center border-b border-outline-variant pb-xs">
            <span class="font-label-md font-bold text-on-surface text-sm">Notifications</span>
            <button onclick="SpecimenStore.markAllNotificationsRead(); renderNotifications();" class="text-[11px] text-primary hover:underline">Mark read</button>
        </div>
        <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            ${itemsHtml}
        </div>
    `;
}

// History Dropdown Handler
function toggleHistoryPopup() {
    let popup = document.getElementById('history-dropdown');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'history-dropdown';
        popup.className = 'absolute right-6 top-14 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl z-50 p-md flex flex-col gap-sm hidden';
        document.body.appendChild(popup);
    }

    if (popup.classList.contains('hidden')) {
        renderHistory();
        popup.classList.remove('hidden');
    } else {
        popup.classList.add('hidden');
    }
}

function renderHistory() {
    const popup = document.getElementById('history-dropdown');
    if (!popup) return;

    const history = SpecimenStore.getHistory();
    const itemsHtml = history.length ? history.map(h => `
        <div class="flex items-center justify-between text-xs py-1 border-b border-outline-variant/20">
            <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[14px] text-primary">history</span>
                <span class="text-on-surface font-medium">${h.action}</span>
                <span class="font-mono-data text-primary">${h.target}</span>
            </div>
            <span class="text-[10px] text-on-surface-variant">${formatRelativeTime(h.timestamp)}</span>
        </div>
    `).join('') : '<p class="text-xs text-on-surface-variant text-center py-4">No activity history</p>';

    popup.innerHTML = `
        <div class="flex justify-between items-center border-b border-outline-variant pb-xs">
            <span class="font-label-md font-bold text-on-surface text-sm">Activity Audit Log</span>
        </div>
        <div class="flex flex-col gap-1 max-h-64 overflow-y-auto">
            ${itemsHtml}
        </div>
    `;
}

// Emergency Log Modal
function openEmergencyLogModal() {
    let modal = document.getElementById('emergency-log-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emergency-log-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="glass-panel bg-surface-container-low border border-error/40 rounded-xl max-w-lg w-full p-lg glow-shadow flex flex-col gap-md">
            <div class="flex justify-between items-center border-b border-outline-variant pb-sm">
                <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-error text-[28px] animate-pulse">warning</span>
                    <div>
                        <h2 class="font-headline-sm text-headline-sm font-bold text-error">EMERGENCY SPECIMEN LOG</h2>
                        <span class="text-xs text-on-surface-variant">Rapid entry for time-critical transplant organs</span>
                    </div>
                </div>
                <button onclick="document.getElementById('emergency-log-modal').classList.add('hidden')" class="text-on-surface-variant hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="emergency-form" class="flex flex-col gap-sm">
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold uppercase text-on-surface-variant">Donor ID *</label>
                    <input type="text" id="emg-donor" required placeholder="e.g. D-EMG-9901" class="input-clinical rounded p-2 text-sm font-mono-data text-white uppercase bg-[#0F172A] border border-[#334155]">
                </div>
                <div class="grid grid-cols-2 gap-sm">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold uppercase text-on-surface-variant">Organ *</label>
                        <select id="emg-organ" class="input-clinical rounded p-2 text-sm text-white bg-[#0F172A] border border-[#334155]">
                            <option value="Kidney">Kidney</option>
                            <option value="Liver">Liver</option>
                            <option value="Heart">Heart</option>
                            <option value="Lung">Lung</option>
                            <option value="Pancreas">Pancreas</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold uppercase text-on-surface-variant">Preservation</label>
                        <select id="emg-preservation" class="input-clinical rounded p-2 text-sm text-white bg-[#0F172A] border border-[#334155]">
                            <option value="-80C Frozen">-80C Frozen</option>
                            <option value="Fixed">Fixed</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-sm">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold uppercase text-on-surface-variant">Clamp Time</label>
                        <input type="text" id="emg-clamp" placeholder="YYYY-MM-DD HH:mm" class="input-clinical rounded p-2 text-xs font-mono-data text-white bg-[#0F172A] border border-[#334155] cursor-pointer">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold uppercase text-on-surface-variant">Collection Time</label>
                        <input type="text" id="emg-collect" placeholder="YYYY-MM-DD HH:mm" class="input-clinical rounded p-2 text-xs font-mono-data text-white bg-[#0F172A] border border-[#334155] cursor-pointer">
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold uppercase text-on-surface-variant">Urgent Clinical Note</label>
                    <textarea id="emg-notes" placeholder="Immediate preservation or biopsy instructions..." rows="2" class="input-clinical rounded p-2 text-sm text-white bg-[#0F172A] border border-[#334155]"></textarea>
                </div>
                <div class="flex justify-end gap-sm mt-sm">
                    <button type="button" onclick="document.getElementById('emergency-log-modal').classList.add('hidden')" class="px-4 py-2 rounded text-xs text-on-surface-variant hover:text-white">Cancel</button>
                    <button type="submit" class="bg-error hover:bg-error/80 text-on-error font-bold px-4 py-2 rounded text-xs uppercase flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">priority_high</span> Log Emergency Specimen
                    </button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');

    if (typeof flatpickr !== 'undefined') {
        flatpickr("#emg-clamp", { enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true, allowInput: true });
        flatpickr("#emg-collect", { enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true, allowInput: true });
    }

    document.getElementById('emergency-form').onsubmit = (e) => {
        e.preventDefault();
        const donorId = document.getElementById('emg-donor').value.trim().toUpperCase();
        const organ = document.getElementById('emg-organ').value;
        const preservation = document.getElementById('emg-preservation').value;
        const clampTime = document.getElementById('emg-clamp').value.trim();
        const collectionTime = document.getElementById('emg-collect').value.trim();
        const remarks = document.getElementById('emg-notes').value.trim();

        let coldIschemia = 'N/A';
        let coldIschemiaMinutes = 0;
        if (clampTime && collectionTime) {
            const d1 = new Date(clampTime.replace(' ', 'T'));
            const d2 = new Date(collectionTime.replace(' ', 'T'));
            if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
                coldIschemiaMinutes = Math.floor((d2 - d1) / 60000);
                coldIschemia = `${Math.floor(coldIschemiaMinutes / 60)}h ${coldIschemiaMinutes % 60}min`;
            }
        }

        const newSpecimen = {
            donorId,
            organ,
            preservation,
            location: 'EMERGENCY BAY',
            clampTime,
            collectionTime,
            coldIschemia,
            coldIschemiaMinutes,
            statusOptions: ['NMP'],
            remarks: `[EMERGENCY LOG] ${remarks}`,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        SpecimenStore.save(newSpecimen);
        showToast(`Emergency Specimen ${donorId} registered in Tang Lab!`, 'warning');
        modal.classList.add('hidden');
    };
}

// Google Apps Script Template Code
const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * Tang Lab Pathology Core - Google Drive Auto-Backup & Sync Engine
 * Deploy as: Web app (Execute as: Me, Access: Anyone)
 */

function initialSetupAuth() {
  var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
  Logger.log('Google Drive permission authorized successfully! Target folder: ' + folder.getName());
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<h2>Tang Lab Pathology Core Backup Service is Active</h2>');
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var action = payload.action || 'backup';
    var userEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || 'Authenticated Google Account';

    if (action === 'ping') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      return createJsonResponse({
        success: true,
        message: 'Google Drive connection successful!',
        account: userEmail,
        folderName: folder.getName(),
        folderUrl: folder.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'backup') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      var timestampStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd_HH-mm');

      var excelFileUrl = '';
      if (payload.excelBase64) {
        var decodedExcel = Utilities.base64Decode(payload.excelBase64);
        var excelBlob = Utilities.newBlob(decodedExcel, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Tang_Lab_Specimens_Latest.xlsx');
        var existingExcelFiles = folder.getFilesByName('Tang_Lab_Specimens_Latest.xlsx');
        while (existingExcelFiles.hasNext()) {
          existingExcelFiles.next().setTrashed(true);
        }
        var newExcelFile = folder.createFile(excelBlob);
        excelFileUrl = newExcelFile.getUrl();

        var archiveFolder = getOrCreateSubFolder(folder, 'Archive_History');
        var archiveBlob = Utilities.newBlob(decodedExcel, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Tang_Lab_Specimens_' + timestampStr + '.xlsx');
        archiveFolder.createFile(archiveBlob);
      }

      var jsonFileUrl = '';
      if (payload.jsonBackup) {
        var jsonBlob = Utilities.newBlob(payload.jsonBackup, 'application/json', 'Tang_Lab_Pathology_Backup_Latest.json');
        var existingJsonFiles = folder.getFilesByName('Tang_Lab_Pathology_Backup_Latest.json');
        while (existingJsonFiles.hasNext()) {
          existingJsonFiles.next().setTrashed(true);
        }
        var newJsonFile = folder.createFile(jsonBlob);
        jsonFileUrl = newJsonFile.getUrl();
      }

      return createJsonResponse({
        success: true,
        message: 'Successfully backed up to Google Drive!',
        account: userEmail,
        folderUrl: folder.getUrl(),
        excelUrl: excelFileUrl,
        jsonUrl: jsonFileUrl,
        specimenCount: payload.specimenCount || 0,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'restore') {
      var folder = getOrCreateFolder('Tang_Lab_Pathology_Backups');
      var jsonFiles = folder.getFilesByName('Tang_Lab_Pathology_Backup_Latest.json');
      if (jsonFiles.hasNext()) {
        var file = jsonFiles.next();
        var content = file.getBlob().getDataAsString();
        var parsedData = JSON.parse(content);
        return createJsonResponse({
          success: true,
          message: 'Latest backup retrieved from Google Drive',
          data: parsedData,
          updatedAt: file.getLastUpdated().toISOString()
        });
      } else {
        return createJsonResponse({
          success: false,
          error: 'No backup file (Tang_Lab_Pathology_Backup_Latest.json) found in your Google Drive.'
        });
      }
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var folders = parentFolder.getFoldersByName(subFolderName);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(subFolderName);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

// Copy Apps Script Code to Clipboard
function copyAppsScriptCode() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE).then(() => {
            showToast('Google Apps Script code copied to clipboard!', 'success');
        }).catch(() => {
            prompt('Copy Google Apps Script code:', APPS_SCRIPT_CODE_TEMPLATE);
        });
    } else {
        prompt('Copy Google Apps Script code:', APPS_SCRIPT_CODE_TEMPLATE);
    }
}

// Google Drive Setup Modal
function openGoogleDriveSetupModal() {
    let modal = document.getElementById('gdrive-setup-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gdrive-setup-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    const config = SpecimenStore.getDriveConfig();

    modal.innerHTML = `
        <div class="glass-panel bg-surface-container-low border border-[#334155] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col glow-shadow overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-md border-b border-outline-variant bg-surface-container">
                <div class="flex items-center gap-sm">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-[20px]">cloud_sync</span>
                    </div>
                    <div>
                        <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Google Drive Auto-Backup Setup</h2>
                        <span class="text-xs text-on-surface-variant">Save Excel & JSON backups directly to your personal Google Drive</span>
                    </div>
                </div>
                <button class="text-on-surface-variant hover:text-white p-1 rounded-lg transition-colors" onclick="document.getElementById('gdrive-setup-modal').classList.add('hidden')">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-lg overflow-y-auto flex flex-col gap-md text-sm">
                <!-- Step 1 & 2 Instructions -->
                <div class="bg-surface-container/50 p-md rounded-lg border border-outline-variant/30 flex flex-col gap-sm">
                    <div class="flex items-start gap-2">
                        <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div>
                            <span class="font-bold text-on-surface">Open Google Apps Script:</span>
                            <p class="text-xs text-on-surface-variant mt-0.5">Log into the Google Account where you want to store your lab backups, then open <a href="https://script.google.com" target="_blank" class="text-primary underline hover:text-primary-fixed">script.google.com</a> and click <strong>"+ New project"</strong>.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-2 border-t border-outline-variant/20 pt-sm">
                        <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div class="flex-1">
                            <span class="font-bold text-on-surface">Paste the Backup Script:</span>
                            <p class="text-xs text-on-surface-variant mt-0.5">Delete any placeholder code in the editor, and paste our automated backup script.</p>
                            <button type="button" onclick="copyAppsScriptCode()" class="mt-2 px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5 transition-colors">
                                <span class="material-symbols-outlined text-[16px]">content_copy</span> Copy Script Code to Clipboard
                            </button>
                        </div>
                    </div>

                    <div class="flex items-start gap-2 border-t border-outline-variant/20 pt-sm">
                        <span class="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <div>
                            <span class="font-bold text-on-surface">Deploy as Web App:</span>
                            <p class="text-xs text-on-surface-variant mt-0.5">
                                Click <strong>Deploy</strong> &rarr; <strong>New deployment</strong> &rarr; Click gear icon (Web app).<br/>
                                Set <strong>Execute as: Me (your Google account)</strong> and <strong>Who has access: Anyone</strong>.<br/>
                                Click <strong>Deploy</strong>, grant permissions, and copy the <strong>Web app URL</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Webhook URL Configuration Form -->
                <div class="flex flex-col gap-sm">
                    <label class="text-xs uppercase font-semibold text-on-surface-variant flex items-center justify-between">
                        <span>Google Apps Script Web App URL</span>
                        ${config.lastAccount ? `<span class="text-[11px] text-secondary font-mono-data">Connected Account: ${config.lastAccount}</span>` : ''}
                    </label>
                    <input id="modal-gdrive-webhook-url" type="url" placeholder="https://script.google.com/macros/s/.../exec" value="${config.webhookUrl || ''}" class="input-clinical bg-[#0F172A] text-white w-full rounded-md p-2 font-mono-data text-xs"/>
                </div>

                <!-- Auto-Sync Toggle -->
                <label class="flex items-center gap-2 cursor-pointer bg-surface-container/30 p-sm rounded-lg border border-outline-variant/30">
                    <input id="modal-gdrive-autosync-cb" type="checkbox" class="checkbox-clinical" ${config.autoSync ? 'checked' : ''}/>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-on-surface">Auto-backup on specimen changes</span>
                        <span class="text-[11px] text-on-surface-variant">Automatically upload new Excel & JSON snapshots whenever specimens are added, edited, or removed.</span>
                    </div>
                </label>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-between items-center p-md border-t border-outline-variant bg-surface-container">
                <button type="button" onclick="document.getElementById('gdrive-setup-modal').classList.add('hidden')" class="px-4 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:text-white text-xs font-semibold">
                    Close
                </button>
                <div class="flex items-center gap-2">
                    <button type="button" id="btn-modal-test-gdrive" class="px-4 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface font-semibold flex items-center gap-1">
                        <span class="material-symbols-outlined text-[16px]">network_check</span> Test Connection
                    </button>
                    <button type="button" id="btn-modal-save-gdrive" class="px-4 py-1.5 rounded bg-primary hover:bg-primary-fixed text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                        <span class="material-symbols-outlined text-[16px]">save</span> Save & Sync Now
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('btn-modal-test-gdrive').onclick = async () => {
        const url = document.getElementById('modal-gdrive-webhook-url').value.trim();
        if (!url) {
            showToast('Please enter a Web App URL first.', 'error');
            return;
        }
        showToast('Testing Google Drive connection...', 'info');
        const res = await SpecimenStore.testDriveConnection(url);
        if (res.success) {
            showToast(`Connection verified! Target Account: ${res.account || 'Google Drive'}`, 'success');
        } else {
            showToast(`Connection failed: ${res.error}`, 'error');
        }
    };

    document.getElementById('btn-modal-save-gdrive').onclick = async () => {
        const url = document.getElementById('modal-gdrive-webhook-url').value.trim();
        const autoSync = document.getElementById('modal-gdrive-autosync-cb').checked;
        SpecimenStore.saveDriveConfig({ webhookUrl: url, autoSync });
        showToast('Google Drive settings saved!', 'success');
        if (url) {
            await SpecimenStore.syncToGoogleDrive({ manual: true });
        }
        modal.classList.add('hidden');
    };
}

// Cloud Sync Topbar Popup Dropdown
function toggleCloudSyncPopup() {
    let dropdown = document.getElementById('gdrive-sync-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'gdrive-sync-dropdown';
        dropdown.className = 'glass-panel bg-surface-container-low border border-outline-variant rounded-xl p-md glow-shadow absolute right-0 top-12 w-80 z-50 flex flex-col gap-sm shadow-xl hidden';
        
        const btn = document.getElementById('gdrive-cloud-btn');
        if (btn && btn.parentElement) {
            btn.parentElement.classList.add('relative');
            btn.parentElement.appendChild(dropdown);
        } else {
            document.body.appendChild(dropdown);
        }
    }

    const config = SpecimenStore.getDriveConfig();
    const isConnected = Boolean(config.webhookUrl);
    const lastSyncStr = config.lastSyncTime ? formatRelativeTime(config.lastSyncTime) : 'Never';

    let statusBadge = '<span class="bg-surface-container-high text-on-surface-variant text-[11px] px-2 py-0.5 rounded font-semibold">Not Configured</span>';
    if (isConnected) {
        if (config.lastStatus === 'syncing') {
            statusBadge = '<span class="bg-primary/20 text-primary text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Syncing...</span>';
        } else if (config.lastStatus === 'success') {
            statusBadge = '<span class="bg-secondary/20 text-secondary text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Connected</span>';
        } else if (config.lastStatus === 'error') {
            statusBadge = '<span class="bg-error/20 text-error text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> Sync Error</span>';
        }
    }

    dropdown.innerHTML = `
        <div class="flex items-center justify-between border-b border-outline-variant/30 pb-xs">
            <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-[18px]">cloud_sync</span>
                <span class="text-xs font-bold text-on-surface">Google Drive Cloud Sync</span>
            </div>
            ${statusBadge}
        </div>

        <div class="flex flex-col gap-1 text-xs">
            <div class="flex justify-between text-on-surface-variant">
                <span>Account / Target:</span>
                <span class="font-mono-data text-on-surface font-semibold truncate max-w-[150px]">${config.lastAccount || 'Tang Lab Drive'}</span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
                <span>Last Cloud Backup:</span>
                <span class="text-on-surface font-medium">${lastSyncStr}</span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
                <span>Auto-Backup:</span>
                <span class="${config.autoSync ? 'text-secondary' : 'text-on-surface-variant'} font-semibold">${config.autoSync ? 'Enabled' : 'Disabled'}</span>
            </div>
        </div>

        ${config.lastFolderUrl ? `
            <a href="${config.lastFolderUrl}" target="_blank" class="text-xs text-primary hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">folder_open</span> Open in Google Drive
            </a>
        ` : ''}

        <div class="flex flex-col gap-1.5 border-t border-outline-variant/30 pt-xs mt-1">
            ${isConnected ? `
                <button id="btn-popup-sync-now" class="w-full py-1.5 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[16px]">sync</span> Backup to Drive Now
                </button>
                <button id="btn-popup-restore-now" class="w-full py-1.5 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                    <span class="material-symbols-outlined text-[16px]">cloud_download</span> Restore from Drive
                </button>
            ` : ''}
            <button onclick="openGoogleDriveSetupModal(); document.getElementById('gdrive-sync-dropdown').classList.add('hidden');" class="w-full py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface font-semibold flex items-center justify-center gap-1 transition-colors">
                <span class="material-symbols-outlined text-[16px]">settings</span> ${isConnected ? 'Configure Sync' : 'Setup Google Drive'}
            </button>
        </div>
    `;

    dropdown.classList.toggle('hidden');

    if (isConnected) {
        const syncBtn = document.getElementById('btn-popup-sync-now');
        if (syncBtn) {
            syncBtn.onclick = async () => {
                await SpecimenStore.syncToGoogleDrive({ manual: true });
                toggleCloudSyncPopup();
            };
        }
        const restoreBtn = document.getElementById('btn-popup-restore-now');
        if (restoreBtn) {
            restoreBtn.onclick = async () => {
                if (confirm('Restore and merge all specimens from Google Drive backup?')) {
                    await SpecimenStore.restoreFromGoogleDrive();
                    toggleCloudSyncPopup();
                }
            };
        }
    }
}

// Update Topbar Cloud Sync Icon Badge
function renderCloudSyncIcon() {
    const btn = document.getElementById('gdrive-cloud-btn');
    if (!btn) return;

    const config = SpecimenStore.getDriveConfig();
    const icon = btn.querySelector('.material-symbols-outlined');
    if (!icon) return;

    if (!config.webhookUrl) {
        icon.textContent = 'cloud_off';
        icon.className = 'material-symbols-outlined text-on-surface-variant hover:text-white text-[20px] transition-colors';
        btn.title = 'Google Drive Auto-Backup: Not Configured (Click to setup)';
    } else if (config.lastStatus === 'syncing') {
        icon.textContent = 'cloud_sync';
        icon.className = 'material-symbols-outlined text-primary text-[20px] animate-spin';
        btn.title = 'Google Drive: Syncing in progress...';
    } else if (config.lastStatus === 'error') {
        icon.textContent = 'sync_problem';
        icon.className = 'material-symbols-outlined text-error text-[20px] animate-pulse';
        btn.title = `Google Drive Sync Error: ${config.lastError || 'Failed'}`;
    } else {
        icon.textContent = 'cloud_done';
        icon.className = 'material-symbols-outlined text-secondary text-[20px] transition-colors';
        btn.title = `Google Drive: Synced (${config.lastSyncTime ? formatRelativeTime(config.lastSyncTime) : 'Ready'})`;
    }
}

// Initialize Topbar Cloud Sync button if not present in markup
function initCloudSyncTopbarButton() {
    const headerActions = document.querySelector('header .flex.items-center.gap-sm.border-l');
    if (headerActions && !document.getElementById('gdrive-cloud-btn')) {
        const cloudBtnContainer = document.createElement('div');
        cloudBtnContainer.className = 'relative flex items-center';
        cloudBtnContainer.innerHTML = `
            <button id="gdrive-cloud-btn" class="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded-lg hover:bg-surface-container-high" title="Google Drive Cloud Sync">
                <span class="material-symbols-outlined text-[20px]">cloud_off</span>
            </button>
        `;
        headerActions.insertBefore(cloudBtnContainer, headerActions.firstChild);

        document.getElementById('gdrive-cloud-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCloudSyncPopup();
        });
    }
    renderCloudSyncIcon();
}

// Pathologist Profile Modal
function openProfileModal() {
    let modal = document.getElementById('profile-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    const settings = SpecimenStore.getSettings();

    modal.innerHTML = `
        <div class="glass-panel bg-surface-container-low border border-outline-variant rounded-xl max-w-sm w-full p-lg glow-shadow flex flex-col gap-md">
            <div class="flex items-center justify-between border-b border-outline-variant pb-sm">
                <span class="font-headline-sm font-bold text-on-surface text-base">Pathologist Profile</span>
                <button onclick="document.getElementById('profile-modal').classList.add('hidden')" class="text-on-surface-variant hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="flex flex-col items-center gap-sm text-center">
                <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary glow-shadow">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRN3y3HLc7R3kvx0_TjauE59FPhgewDG2LcjqwC2WlGUH_TmrieMeYy4GcNXMvRKubMPtFFFWbuHPKIdeI7V_SqSyZ2ElEEY7V1IK5ebfdDWjLfWRFo2Fxm_GoMQ5wrR0VUYsMG-rHNMAxB6UeBBOs8feKc8v87_JkuBa3twVYFRyYxBkgG7YfBW5qwrDJ25Y2NM1Ti8sVUHi8kn2QdrqU_RGe3KB1511_p7NZ5YjaMJcpxiZIpTX5QKSAdQ92ij0Cxg6F2ciqasY" class="w-full h-full object-cover">
                </div>
                <div>
                    <h3 class="font-bold text-on-surface text-base">${settings.leadPathologist || 'Dr. Qinggong Tang / Dr. Yan Cui'}</h3>
                    <span class="text-xs text-primary font-mono-data">${settings.institution || 'Pathology & Organ Viability Core'}</span>
                </div>
                <div class="w-full bg-surface-container p-sm rounded-lg border border-outline-variant/30 text-xs flex flex-col gap-1 text-left">
                    <div class="flex justify-between"><span class="text-on-surface-variant">Lab Station:</span> <span class="font-mono-data text-primary">Lab ID: ${settings.labId || 'Tang Lab'}</span></div>
                    <div class="flex justify-between"><span class="text-on-surface-variant">Role:</span> <span class="text-on-surface">Principal Investigator / Pathologist</span></div>
                    <div class="flex justify-between"><span class="text-on-surface-variant">System Version:</span> <span class="font-mono-data text-on-surface">v2.5.0 Live</span></div>
                </div>
            </div>
            <div class="flex justify-end">
                <button onclick="document.getElementById('profile-modal').classList.add('hidden')" class="w-full py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface rounded font-medium">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Global UI Initialization
document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('header input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                const isArchivePage = window.location.pathname.includes('archive.html');
                if (!isArchivePage) {
                    window.location.href = `archive.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    });

    document.querySelectorAll('header button').forEach(btn => {
        const text = btn.innerText || '';
        if (text.includes('notifications')) {
            btn.addEventListener('click', toggleNotificationsPopup);
        } else if (text.includes('history')) {
            btn.addEventListener('click', toggleHistoryPopup);
        } else if (text.includes('Emergency Log')) {
            btn.addEventListener('click', openEmergencyLogModal);
        }
    });

    const profileAvatars = document.querySelectorAll('header .w-8.h-8.rounded-full');
    profileAvatars.forEach(av => {
        av.addEventListener('click', openProfileModal);
    });

    // Initialize Cloud Sync Button
    initCloudSyncTopbarButton();

    document.addEventListener('click', (e) => {
        const notifPopup = document.getElementById('notifications-dropdown');
        const histPopup = document.getElementById('history-dropdown');
        const gdrivePopup = document.getElementById('gdrive-sync-dropdown');
        if (notifPopup && !notifPopup.classList.contains('hidden') && !notifPopup.contains(e.target) && !e.target.closest('button')?.innerText?.includes('notifications')) {
            notifPopup.classList.add('hidden');
        }
        if (histPopup && !histPopup.classList.contains('hidden') && !histPopup.contains(e.target) && !e.target.closest('button')?.innerText?.includes('history')) {
            histPopup.classList.add('hidden');
        }
        if (gdrivePopup && !gdrivePopup.classList.contains('hidden') && !gdrivePopup.contains(e.target) && !e.target.closest('#gdrive-cloud-btn')) {
            gdrivePopup.classList.add('hidden');
        }
    });

    // Listen for Cloud Sync status changes
    window.addEventListener('pathology_gdrive_config_change', renderCloudSyncIcon);
    window.addEventListener('pathology_gdrive_sync_start', renderCloudSyncIcon);
    window.addEventListener('pathology_gdrive_sync_success', renderCloudSyncIcon);
    window.addEventListener('pathology_gdrive_sync_error', renderCloudSyncIcon);
});

