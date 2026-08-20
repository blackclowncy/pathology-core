/**
 * Pathology Core - Data Storage & Specimen Management
 * Manages localStorage persistence, sample data seeding, Excel/CSV import/export,
 * activity logging, and search/filtering.
 */

const STORAGE_KEYS = {
    SPECIMENS: 'pathology_core_specimens_v1',
    SETTINGS: 'pathology_core_settings_v1',
    HISTORY: 'pathology_core_history_v1',
    NOTIFICATIONS: 'pathology_core_notifications_v1'
};

// Default seed specimens (including those from the original template)
const DEFAULT_SPECIMENS = [
    {
        id: 'SPEC-1724001',
        tid: 'T-2026-0819-01',
        donorId: 'D-8832-LN',
        organ: 'Lung',
        preservation: '-80C Frozen',
        location: 'S2/R4/B12',
        age: 54,
        gender: 'Male',
        bmi: 26.2,
        causeOfDeath: 'Traumatic Brain Injury',
        warmIschemia: 18,
        warmIschemiaNA: false,
        clampTime: '12:30',
        collectionTime: '14:32',
        coldIschemia: '2h 2min',
        coldIschemiaMinutes: 122,
        medicalHistory: ['HTN', 'Tobacco'],
        remarks: 'Left lower lobe wedge biopsy, tissue architecture intact, clear margins.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724002',
        tid: 'T-2026-0819-02',
        donorId: 'D-8831-LV',
        organ: 'Liver',
        preservation: 'Fixed',
        location: 'Processing',
        age: 62,
        gender: 'Female',
        bmi: 28.5,
        causeOfDeath: 'Anoxic Encephalopathy',
        warmIschemia: 25,
        warmIschemiaNA: false,
        clampTime: '09:00',
        collectionTime: '11:15',
        coldIschemia: '2h 15min',
        coldIschemiaMinutes: 135,
        medicalHistory: ['Diabetes', 'CAD', 'Obesity'],
        remarks: 'Segment IV core sample for trichrome & PAS staining, steatosis evaluation.',
        status: 'Pending',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724003',
        tid: 'T-2026-0819-03',
        donorId: 'D-8830-KD',
        organ: 'Kidney',
        preservation: '-80C Frozen',
        location: 'S1/R1/B04',
        age: 47,
        gender: 'Male',
        bmi: 23.8,
        causeOfDeath: 'Cerebrovascular Accident',
        warmIschemia: 12,
        warmIschemiaNA: false,
        clampTime: '07:15',
        collectionTime: '09:45',
        coldIschemia: '2h 30min',
        coldIschemiaMinutes: 150,
        medicalHistory: ['HTN'],
        remarks: 'Cortico-medullary junction section preserved for glomerulosclerosis & IFTA mapping.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724004',
        tid: 'T-2026-0818-01',
        donorId: 'D-8829-HT',
        organ: 'Heart',
        preservation: '-80C Frozen',
        location: 'S1/R3/B08',
        age: 39,
        gender: 'Male',
        bmi: 24.1,
        causeOfDeath: 'Head Trauma',
        warmIschemia: 15,
        warmIschemiaNA: false,
        clampTime: '14:00',
        collectionTime: '16:20',
        coldIschemia: '2h 20min',
        coldIschemiaMinutes: 140,
        medicalHistory: ['Tobacco', 'Alcohol'],
        remarks: 'Left ventricular apex biopsy, rapid freezing protocol applied.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724005',
        tid: 'T-2026-0818-02',
        donorId: 'D-8828-PA',
        organ: 'Pancreas',
        preservation: 'Fixed',
        location: 'S3/R2/B02',
        age: 51,
        gender: 'Female',
        bmi: 31.0,
        causeOfDeath: 'Intracranial Hemorrhage',
        warmIschemia: 30,
        warmIschemiaNA: false,
        clampTime: '10:10',
        collectionTime: '14:40',
        coldIschemia: '4h 30min',
        coldIschemiaMinutes: 270,
        medicalHistory: ['Diabetes', 'Obesity', 'HTN'],
        remarks: 'Tail of pancreas specimen; prolonged cold ischemia flagged for islet assessment.',
        status: 'Flagged',
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString()
    }
];

const DEFAULT_SETTINGS = {
    labId: '772-B',
    institution: 'Pathology & Organ Viability Core',
    leadPathologist: 'Dr. Yan Cui, MD/PhD',
    defaultPreservation: '-80C Frozen',
    defaultStorageSector: 'S1',
    autoGenerateTID: true,
    ischemiaAlertThresholdHours: 4,
    theme: 'dark'
};

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'notif-1',
        title: 'Prolonged Ischemia Alert',
        message: 'Specimen D-8828-PA exceeded 4h cold ischemia time (4h 30m).',
        type: 'warning',
        time: 'Yesterday',
        unread: true
    },
    {
        id: 'notif-2',
        title: 'Specimen Batch Registered',
        message: 'Successfully archived 3 new specimens from Transplant Suite 2.',
        type: 'info',
        time: 'Today',
        unread: false
    }
];

const DEFAULT_HISTORY = [
    { action: 'Registered', target: 'D-8832-LN', user: 'Pathologist', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { action: 'Registered', target: 'D-8831-LV', user: 'Pathologist', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { action: 'Registered', target: 'D-8830-KD', user: 'Pathologist', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() }
];

// Data Store Object
const SpecimenStore = {
    // Initializer
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.SPECIMENS)) {
            localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(DEFAULT_SPECIMENS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
        }
    },

    // Get all specimens
    getAll() {
        this.init();
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SPECIMENS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse specimens from localStorage:', e);
            return DEFAULT_SPECIMENS;
        }
    },

    // Get single specimen by ID
    getById(id) {
        const list = this.getAll();
        return list.find(item => item.id === id || item.tid === id || item.donorId === id) || null;
    },

    // Save or update specimen
    save(specimen) {
        const list = this.getAll();
        const now = new Date();

        if (!specimen.id) {
            specimen.id = 'SPEC-' + Date.now().toString(36).toUpperCase();
        }
        if (!specimen.createdAt) {
            specimen.createdAt = now.toISOString();
        }
        if (!specimen.status) {
            // Auto determine status based on cold ischemia
            if (specimen.coldIschemiaMinutes && specimen.coldIschemiaMinutes > 240) {
                specimen.status = 'Flagged';
            } else if (specimen.preservation === 'Fixed' && specimen.location === 'Processing') {
                specimen.status = 'Pending';
            } else {
                specimen.status = 'Clear';
            }
        }

        const existingIndex = list.findIndex(item => item.id === specimen.id);
        if (existingIndex >= 0) {
            list[existingIndex] = { ...list[existingIndex], ...specimen, updatedAt: now.toISOString() };
            this.addHistory('Updated', specimen.donorId);
        } else {
            list.unshift(specimen);
            this.addHistory('Registered', specimen.donorId);
            this.addNotification('New Specimen Registered', `Specimen ${specimen.donorId} (${specimen.organ}) has been logged.`, 'success');
        }

        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
        this.dispatchChangeEvent();
        return specimen;
    },

    // Delete specimen
    delete(id) {
        let list = this.getAll();
        const target = list.find(item => item.id === id);
        if (target) {
            list = list.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
            this.addHistory('Deleted', target.donorId);
            this.dispatchChangeEvent();
            return true;
        }
        return false;
    },

    // Batch delete
    deleteBatch(ids) {
        let list = this.getAll();
        const initialCount = list.length;
        list = list.filter(item => !ids.includes(item.id));
        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
        this.addHistory('Batch Deleted', `${initialCount - list.length} records`);
        this.dispatchChangeEvent();
        return true;
    },

    // Generate next Transaction / Tracking ID
    getNextTrackingId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const prefix = `T-${year}-${month}${day}-`;

        const list = this.getAll();
        const todaySpecimens = list.filter(item => item.tid && item.tid.startsWith(prefix));
        const nextSeq = String(todaySpecimens.length + 1).padStart(2, '0');
        return `${prefix}${nextSeq}`;
    },

    // Filter specimens by query and multi-attributes
    filter(criteria = {}) {
        let list = this.getAll();

        if (criteria.query && criteria.query.trim()) {
            const q = criteria.query.toLowerCase().trim();
            list = list.filter(item => {
                return (
                    (item.donorId && item.donorId.toLowerCase().includes(q)) ||
                    (item.tid && item.tid.toLowerCase().includes(q)) ||
                    (item.organ && item.organ.toLowerCase().includes(q)) ||
                    (item.location && item.location.toLowerCase().includes(q)) ||
                    (item.preservation && item.preservation.toLowerCase().includes(q)) ||
                    (item.causeOfDeath && item.causeOfDeath.toLowerCase().includes(q)) ||
                    (item.remarks && item.remarks.toLowerCase().includes(q)) ||
                    (item.medicalHistory && item.medicalHistory.some(m => m.toLowerCase().includes(q)))
                );
            });
        }

        if (criteria.year && criteria.year !== 'Year' && criteria.year !== '') {
            list = list.filter(item => {
                const itemYear = new Date(item.createdAt).getFullYear().toString();
                return itemYear === criteria.year;
            });
        }

        if (criteria.organ && criteria.organ !== 'Organ Type' && criteria.organ !== '') {
            list = list.filter(item => item.organ && item.organ.toLowerCase() === criteria.organ.toLowerCase());
        }

        if (criteria.gender && criteria.gender !== 'Gender' && criteria.gender !== '') {
            list = list.filter(item => {
                if (criteria.gender === 'M') return item.gender === 'Male';
                if (criteria.gender === 'F') return item.gender === 'Female';
                if (criteria.gender === 'O') return item.gender === 'Other';
                return item.gender === criteria.gender;
            });
        }

        if (criteria.ageRange && criteria.ageRange.trim()) {
            const parts = criteria.ageRange.split('-').map(p => parseInt(p.trim(), 10));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                list = list.filter(item => item.age >= parts[0] && item.age <= parts[1]);
            } else if (parts.length === 1 && !isNaN(parts[0])) {
                list = list.filter(item => item.age === parts[0]);
            }
        }

        if (criteria.bmiRange && criteria.bmiRange.trim()) {
            const parts = criteria.bmiRange.split('-').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                list = list.filter(item => item.bmi >= parts[0] && item.bmi <= parts[1]);
            }
        }

        if (criteria.diagnosis && criteria.diagnosis !== '') {
            list = list.filter(item => item.medicalHistory && item.medicalHistory.includes(criteria.diagnosis));
        }

        if (criteria.coldIschemia && criteria.coldIschemia !== '') {
            if (criteria.coldIschemia === '<2h') {
                list = list.filter(item => item.coldIschemiaMinutes && item.coldIschemiaMinutes < 120);
            } else if (criteria.coldIschemia === '2-4h') {
                list = list.filter(item => item.coldIschemiaMinutes && item.coldIschemiaMinutes >= 120 && item.coldIschemiaMinutes <= 240);
            } else if (criteria.coldIschemia === '>4h') {
                list = list.filter(item => item.coldIschemiaMinutes && item.coldIschemiaMinutes > 240);
            }
        }

        if (criteria.preservation && criteria.preservation !== '') {
            list = list.filter(item => item.preservation === criteria.preservation);
        }

        if (criteria.status && criteria.status !== '') {
            list = list.filter(item => item.status === criteria.status);
        }

        return list;
    },

    // Export specimens to Excel / CSV
    exportToExcel(specimens = null, filename = 'Pathology_Core_Specimens.xlsx') {
        const data = specimens || this.getAll();
        const exportData = data.map(item => ({
            'Tracking ID': item.tid || item.id,
            'Donor ID': item.donorId,
            'Organ Type': item.organ,
            'Preservation Method': item.preservation,
            'Storage Location': item.location,
            'Age': item.age || '',
            'Gender': item.gender || '',
            'BMI (kg/m²)': item.bmi || '',
            'Cause of Death': item.causeOfDeath || '',
            'Warm Ischemia (min)': item.warmIschemiaNA ? 'N/A' : (item.warmIschemia || ''),
            'Clamp Time': item.clampTime || '',
            'Collection Time': item.collectionTime || '',
            'Cold Ischemia Duration': item.coldIschemia || '',
            'Cold Ischemia (mins)': item.coldIschemiaMinutes || '',
            'Medical History': (item.medicalHistory || []).join('; '),
            'Clinical Remarks': item.remarks || '',
            'Status': item.status || 'Clear',
            'Registered Date': item.createdAt ? new Date(item.createdAt).toLocaleString() : ''
        }));

        if (typeof XLSX !== 'undefined') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Specimens');
            XLSX.writeFile(workbook, filename);
            this.addHistory('Exported', `${data.length} records to Excel`);
            return true;
        } else {
            // Fallback to CSV
            this.exportToCSV(exportData, filename.replace('.xlsx', '.csv'));
            return true;
        }
    },

    // CSV Fallback export
    exportToCSV(data, filename = 'Pathology_Core_Specimens.csv') {
        if (!data || !data.length) return;
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                const val = ('' + (row[header] || '')).replace(/"/g, '""');
                return `"${val}"`;
            });
            csvRows.push(values.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        this.addHistory('Exported', `${data.length} records to CSV`);
    },

    // Import from Excel or CSV file
    importFile(file, callback) {
        const reader = new FileReader();
        const isJSON = file.name.endsWith('.json');

        if (isJSON) {
            reader.onload = (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    if (Array.isArray(parsed)) {
                        this.mergeImported(parsed);
                        if (callback) callback({ success: true, count: parsed.length });
                    } else if (parsed.specimens && Array.isArray(parsed.specimens)) {
                        this.mergeImported(parsed.specimens);
                        if (callback) callback({ success: true, count: parsed.specimens.length });
                    } else {
                        if (callback) callback({ success: false, error: 'Invalid JSON format' });
                    }
                } catch (err) {
                    if (callback) callback({ success: false, error: err.message });
                }
            };
            reader.readAsText(file);
            return;
        }

        if (typeof XLSX !== 'undefined') {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet);

                    const imported = rows.map((row, idx) => {
                        const donorId = row['Donor ID'] || row['donorId'] || `D-IMP-${idx + 1}`;
                        const organ = row['Organ Type'] || row['organ'] || 'Other';
                        const preservation = row['Preservation Method'] || row['preservation'] || '-80C Frozen';
                        const location = row['Storage Location'] || row['location'] || 'Unassigned';
                        const age = parseInt(row['Age'] || row['age'], 10) || null;
                        const gender = row['Gender'] || row['gender'] || '';
                        const bmi = parseFloat(row['BMI (kg/m²)'] || row['BMI'] || row['bmi']) || null;
                        const causeOfDeath = row['Cause of Death'] || row['causeOfDeath'] || '';
                        const clampTime = row['Clamp Time'] || row['clampTime'] || '';
                        const collectionTime = row['Collection Time'] || row['collectionTime'] || '';
                        const coldIschemia = row['Cold Ischemia Duration'] || row['coldIschemia'] || '';
                        const coldIschemiaMinutes = parseInt(row['Cold Ischemia (mins)'] || row['coldIschemiaMinutes'], 10) || 0;
                        const medHistRaw = row['Medical History'] || row['medicalHistory'] || '';
                        const medicalHistory = Array.isArray(medHistRaw) ? medHistRaw : (typeof medHistRaw === 'string' ? medHistRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : []);
                        const remarks = row['Clinical Remarks'] || row['remarks'] || '';
                        const status = row['Status'] || row['status'] || 'Clear';

                        return {
                            id: 'SPEC-' + (Date.now() + idx).toString(36).toUpperCase(),
                            tid: row['Tracking ID'] || row['tid'] || `T-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
                            donorId,
                            organ,
                            preservation,
                            location,
                            age,
                            gender,
                            bmi,
                            causeOfDeath,
                            warmIschemia: parseInt(row['Warm Ischemia (min)'] || row['warmIschemia'], 10) || null,
                            warmIschemiaNA: row['Warm Ischemia (min)'] === 'N/A',
                            clampTime,
                            collectionTime,
                            coldIschemia,
                            coldIschemiaMinutes,
                            medicalHistory,
                            remarks,
                            status,
                            createdAt: new Date().toISOString()
                        };
                    });

                    this.mergeImported(imported);
                    if (callback) callback({ success: true, count: imported.length });
                } catch (err) {
                    if (callback) callback({ success: false, error: err.message });
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            if (callback) callback({ success: false, error: 'XLSX library not loaded.' });
        }
    },

    // Merge imported specimens
    mergeImported(importedList) {
        const current = this.getAll();
        const donorIdMap = new Map(current.map(item => [item.donorId, item]));

        for (const item of importedList) {
            if (item.donorId && donorIdMap.has(item.donorId)) {
                // Update existing
                const index = current.findIndex(c => c.donorId === item.donorId);
                current[index] = { ...current[index], ...item };
            } else {
                current.unshift(item);
            }
        }

        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(current));
        this.addHistory('Imported', `${importedList.length} records`);
        this.addNotification('Batch Import Successful', `Imported ${importedList.length} specimen records.`, 'info');
        this.dispatchChangeEvent();
    },

    // Settings helpers
    getSettings() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    },

    saveSettings(settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        this.addHistory('Configured', 'System Settings Updated');
        this.dispatchChangeEvent();
    },

    // History Log
    getHistory() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
        } catch (e) {
            return [];
        }
    },

    addHistory(action, target, user = 'Current User') {
        const history = this.getHistory();
        history.unshift({
            action,
            target,
            user,
            timestamp: new Date().toISOString()
        });
        if (history.length > 50) history.pop();
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    },

    // Notifications
    getNotifications() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
        } catch (e) {
            return [];
        }
    },

    addNotification(title, message, type = 'info') {
        const list = this.getNotifications();
        list.unshift({
            id: 'notif-' + Date.now(),
            title,
            message,
            type,
            time: 'Just now',
            unread: true,
            timestamp: new Date().toISOString()
        });
        if (list.length > 20) list.pop();
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    },

    markAllNotificationsRead() {
        const list = this.getNotifications().map(n => ({ ...n, unread: false }));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
        this.dispatchChangeEvent();
    },

    // Reset / Backup / Clear
    resetDemoData() {
        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(DEFAULT_SPECIMENS));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
        this.dispatchChangeEvent();
    },

    clearAllData() {
        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
        this.dispatchChangeEvent();
    },

    exportBackupJSON() {
        const backup = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            specimens: this.getAll(),
            settings: this.getSettings(),
            history: this.getHistory()
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Pathology_Core_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    },

    // Event Dispatcher for multi-component sync
    dispatchChangeEvent() {
        window.dispatchEvent(new CustomEvent('pathology_store_change'));
    }
};

// Auto init on load
SpecimenStore.init();

// Export globally
window.SpecimenStore = SpecimenStore;
