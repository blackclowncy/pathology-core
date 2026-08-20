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

    document.addEventListener('click', (e) => {
        const notifPopup = document.getElementById('notifications-dropdown');
        const histPopup = document.getElementById('history-dropdown');
        if (notifPopup && !notifPopup.classList.contains('hidden') && !notifPopup.contains(e.target) && !e.target.closest('button')?.innerText?.includes('notifications')) {
            notifPopup.classList.add('hidden');
        }
        if (histPopup && !histPopup.classList.contains('hidden') && !histPopup.contains(e.target) && !e.target.closest('button')?.innerText?.includes('history')) {
            histPopup.classList.add('hidden');
        }
    });
});
