/**
 * Pathology Core - Data Storage & Specimen Management
 * Manages localStorage persistence, sample data seeding, Excel/CSV import/export,
 * activity logging, and search/filtering.
 */

const STORAGE_KEYS = {
    SPECIMENS: 'pathology_core_specimens_v2',
    SETTINGS: 'pathology_core_settings_v2',
    HISTORY: 'pathology_core_history_v2',
    NOTIFICATIONS: 'pathology_core_notifications_v2',
    GDRIVE: 'pathology_core_gdrive_config_v1'
};

const DEFAULT_GDRIVE_CONFIG = {
    webhookUrl: '',
    autoSync: true,
    lastSyncTime: null,
    lastFolderUrl: '',
    lastAccount: '',
    lastStatus: 'idle', // 'idle', 'syncing', 'success', 'error'
    lastError: ''
};

// Default seed specimens with updated Lab and Status options (NMP, HMP, Structure Image)
const DEFAULT_SPECIMENS = [
    {
        id: 'SPEC-1724001',
        tid: 'T-2026-0819-01',
        donorId: 'D-8832-LN',
        organ: 'Lung',
        position: 'Right',
        preservation: '-80C Frozen',
        location: 'S2/R4/B12',
        age: 54,
        gender: 'Male',
        bmi: 26.2,
        causeOfDeath: 'Traumatic Brain Injury',
        warmIschemia: 18,
        warmIschemiaNA: false,
        clampTime: '2026-08-19T12:30',
        collectionTime: '2026-08-19T14:32',
        coldIschemia: '2h 2min',
        coldIschemiaMinutes: 122,
        medicalHistory: ['HTN', 'Tobacco'],
        statusOptions: ['NMP', 'Structure Image'],
        histology: true,
        remarks: 'Left lower lobe wedge biopsy, tissue architecture intact, clear margins.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724002',
        tid: 'T-2026-0819-02',
        donorId: 'D-8831-LV',
        organ: 'Liver',
        position: '',
        preservation: 'Fixed',
        location: 'Processing',
        age: 62,
        gender: 'Female',
        bmi: 28.5,
        causeOfDeath: 'Anoxic Encephalopathy',
        warmIschemia: 25,
        warmIschemiaNA: false,
        clampTime: '2026-08-19T09:00',
        collectionTime: '2026-08-19T11:15',
        coldIschemia: '2h 15min',
        coldIschemiaMinutes: 135,
        medicalHistory: ['Diabetes', 'CAD', 'Obesity'],
        statusOptions: ['HMP'],
        histology: true,
        remarks: 'Segment IV core sample for trichrome & PAS staining, steatosis evaluation.',
        status: 'Pending',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724003',
        tid: 'T-2026-0819-03',
        donorId: 'D-8830-KD',
        organ: 'Kidney',
        position: 'Left',
        preservation: '-80C Frozen',
        location: 'S1/R1/B04',
        age: 47,
        gender: 'Male',
        bmi: 23.8,
        causeOfDeath: 'Cerebrovascular Accident',
        warmIschemia: 12,
        warmIschemiaNA: false,
        clampTime: '2026-08-19T07:15',
        collectionTime: '2026-08-19T09:45',
        coldIschemia: '2h 30min',
        coldIschemiaMinutes: 150,
        medicalHistory: ['HTN'],
        statusOptions: ['NMP', 'Structure Image'],
        histology: false,
        remarks: 'Cortico-medullary junction section preserved for glomerulosclerosis & IFTA mapping.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724004',
        tid: 'T-2026-0818-01',
        donorId: 'D-8829-HT',
        organ: 'Heart',
        position: '',
        preservation: '-80C Frozen',
        location: 'S1/R3/B08',
        age: 39,
        gender: 'Male',
        bmi: 24.1,
        causeOfDeath: 'Head Trauma',
        warmIschemia: 15,
        warmIschemiaNA: false,
        clampTime: '2026-08-18T14:00',
        collectionTime: '2026-08-18T16:20',
        coldIschemia: '2h 20min',
        coldIschemiaMinutes: 140,
        medicalHistory: ['Tobacco', 'Alcohol'],
        statusOptions: ['HMP', 'Structure Image'],
        histology: false,
        remarks: 'Left ventricular apex biopsy, rapid freezing protocol applied.',
        status: 'Clear',
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 'SPEC-1724005',
        tid: 'T-2026-0818-02',
        donorId: 'D-8828-PA',
        organ: 'Pancreas',
        position: '',
        preservation: 'Fixed',
        location: 'S3/R2/B02',
        age: 51,
        gender: 'Female',
        bmi: 31.0,
        causeOfDeath: 'Intracranial Hemorrhage',
        warmIschemia: 30,
        warmIschemiaNA: false,
        clampTime: '2026-08-18T10:10',
        collectionTime: '2026-08-18T14:40',
        coldIschemia: '4h 30min',
        coldIschemiaMinutes: 270,
        medicalHistory: ['Diabetes', 'Obesity', 'HTN'],
        statusOptions: ['NMP'],
        histology: false,
        remarks: 'Tail of pancreas specimen; prolonged cold ischemia flagged for islet assessment.',
        status: 'Flagged',
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString()
    }
];

const DEFAULT_SETTINGS = {
    labId: 'Tang Lab',
    institution: 'Pathology & Organ Viability Core',
    leadPathologist: 'Dr. Qinggong Tang / Dr. Yan Cui',
    defaultPreservation: '-80C Frozen',
    defaultStorageSector: 'S1',
    autoGenerateTID: true,
    ischemiaAlertThresholdHours: 24,
    theme: 'dark'
};

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'notif-1',
        title: 'Specimen Registry Active',
        message: 'Tang Lab specimen database loaded successfully.',
        type: 'info',
        time: 'Today',
        unread: true
    },
    {
        id: 'notif-2',
        title: 'Specimen Batch Registered',
        message: 'Successfully archived new specimens from Organ Assessment Platform.',
        type: 'info',
        time: 'Today',
        unread: false
    }
];

const DEFAULT_HISTORY = [
    { action: 'Registered', target: 'D-8832-LN', user: 'Tang Lab', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { action: 'Registered', target: 'D-8831-LV', user: 'Tang Lab', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { action: 'Registered', target: 'D-8830-KD', user: 'Tang Lab', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() }
];

// Data Store Object
const SpecimenStore = {
    // Initializer
    init() {
        // Unconditionally wipe any old legacy keys so they can never resurrect deleted items
        const legacyKeys = [
            'pathology_core_specimens',
            'pathology_specimens',
            'specimens',
            'pathology_core_samples',
            'pathology_specimens_v1',
            'pathology_core_specimens_v1'
        ];
        legacyKeys.forEach(k => {
            try { localStorage.removeItem(k); } catch (e) {}
        });

        let currentList = [];
        const rawCurrent = localStorage.getItem(STORAGE_KEYS.SPECIMENS);
        if (rawCurrent !== null) {
            try {
                currentList = JSON.parse(rawCurrent);
                if (!Array.isArray(currentList)) currentList = [];
            } catch (e) {
                currentList = [];
            }
        } else {
            // First time ever visiting
            currentList = DEFAULT_SPECIMENS;
            localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(currentList));
        }

        // Settings init & migration
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            const oldSettings = localStorage.getItem('pathology_core_settings') || localStorage.getItem('pathology_settings');
            if (oldSettings) {
                try {
                    const s = JSON.parse(oldSettings);
                    s.labId = 'Tang Lab';
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
                } catch (e) {
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
                }
            } else {
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
            }
        } else {
            // Ensure Lab ID is updated to Tang Lab
            try {
                const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
                if (s.labId === '772-B') {
                    s.labId = 'Tang Lab';
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
                }
            } catch (e) {}
        }

        if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
            const oldNotifs = localStorage.getItem('pathology_core_notifications');
            if (oldNotifs) {
                localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, oldNotifs);
            } else {
                localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
            }
        }
        if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
            const oldHist = localStorage.getItem('pathology_core_history');
            if (oldHist) {
                localStorage.setItem(STORAGE_KEYS.HISTORY, oldHist);
            } else {
                localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
            }
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
        if (!specimen.statusOptions) {
            specimen.statusOptions = [];
        }
        specimen.position = specimen.position || '';
        specimen.histology = Boolean(specimen.histology);
        if (!specimen.status) {
            // Auto determine status based on cold ischemia (>24h flagged)
            if (specimen.coldIschemiaMinutes && specimen.coldIschemiaMinutes > 1440) {
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
            this.addNotification('New Specimen Registered', `Specimen ${specimen.donorId} (${specimen.organ}) has been logged in Tang Lab.`, 'success');
        }

        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
        this.dispatchChangeEvent();
        this.triggerAutoDriveSync();
        return specimen;
    },

    // Delete specimen
    delete(id) {
        let list = this.getAll();
        const target = list.find(item => item.id === id || item.donorId === id);
        if (target) {
            list = list.filter(item => item.id !== target.id && item.donorId !== target.donorId);
            localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
            this.addHistory('Deleted', target.donorId);
            this.dispatchChangeEvent();
            this.triggerAutoDriveSync();
            return true;
        }
        return false;
    },

    // Batch delete
    deleteBatch(ids) {
        let list = this.getAll();
        const initialCount = list.length;
        const idSet = new Set(ids);
        list = list.filter(item => !idSet.has(item.id) && !idSet.has(item.donorId));
        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(list));
        this.addHistory('Batch Deleted', `${initialCount - list.length} records`);
        this.dispatchChangeEvent();
        this.triggerAutoDriveSync();
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
                    (item.position && item.position.toLowerCase().includes(q)) ||
                    (item.location && item.location.toLowerCase().includes(q)) ||
                    (item.preservation && item.preservation.toLowerCase().includes(q)) ||
                    (item.causeOfDeath && item.causeOfDeath.toLowerCase().includes(q)) ||
                    (item.remarks && item.remarks.toLowerCase().includes(q)) ||
                    (item.statusOptions && item.statusOptions.some(s => s.toLowerCase().includes(q))) ||
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

        // Updated Cold Ischemia Time criteria: <12h, 12-24h, >24h
        if (criteria.coldIschemia && criteria.coldIschemia !== '') {
            if (criteria.coldIschemia === '<12h' || criteria.coldIschemia === '<2h') {
                list = list.filter(item => item.coldIschemiaMinutes !== undefined && item.coldIschemiaMinutes < 720);
            } else if (criteria.coldIschemia === '12-24h' || criteria.coldIschemia === '2-4h') {
                list = list.filter(item => item.coldIschemiaMinutes !== undefined && item.coldIschemiaMinutes >= 720 && item.coldIschemiaMinutes <= 1440);
            } else if (criteria.coldIschemia === '>24h' || criteria.coldIschemia === '>4h') {
                list = list.filter(item => item.coldIschemiaMinutes !== undefined && item.coldIschemiaMinutes > 1440);
            }
        }

        if (criteria.statusOption && criteria.statusOption !== '') {
            list = list.filter(item => item.statusOptions && item.statusOptions.includes(criteria.statusOption));
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
    exportToExcel(specimens = null, filename = 'Tang_Lab_Specimens.xlsx') {
        const data = specimens || this.getAll();
        const exportData = data.map(item => ({
            'Tracking ID': item.tid || item.id,
            'Donor ID': item.donorId,
            'Organ Type': item.organ,
            'Position': item.position || '',
            'Preservation Method': item.preservation,
            'Storage Location': item.location,
            'Status / Modality': (item.statusOptions || []).join('; '),
            'Histology': item.histology ? 'Yes' : 'No',
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
            'Registered Date': item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 19) : ''
        }));

        if (typeof XLSX !== 'undefined') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Specimens');
            XLSX.writeFile(workbook, filename);
            this.addHistory('Exported', `${data.length} records to Excel`);
            return true;
        } else {
            this.exportToCSV(exportData, filename.replace('.xlsx', '.csv'));
            return true;
        }
    },

    // CSV Fallback export
    exportToCSV(data, filename = 'Tang_Lab_Specimens.csv') {
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
                        const position = row['Position'] || row['position'] || '';
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
                        
                        const statusOptRaw = row['Status / Modality'] || row['statusOptions'] || '';
                        const statusOptions = Array.isArray(statusOptRaw) ? statusOptRaw : (typeof statusOptRaw === 'string' ? statusOptRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : []);

                        const medHistRaw = row['Medical History'] || row['medicalHistory'] || '';
                        const medicalHistory = Array.isArray(medHistRaw) ? medHistRaw : (typeof medHistRaw === 'string' ? medHistRaw.split(/[;,]/).map(s => s.trim()).filter(Boolean) : []);
                        const remarks = row['Clinical Remarks'] || row['remarks'] || '';
                        const status = row['Status'] || row['status'] || 'Clear';

                        return {
                            id: 'SPEC-' + (Date.now() + idx).toString(36).toUpperCase(),
                            tid: row['Tracking ID'] || row['tid'] || `T-${new Date().getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
                            donorId,
                            organ,
                            position,
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
                            statusOptions,
                            histology: row['Histology'] === 'Yes' || row['histology'] === true,
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
                const index = current.findIndex(c => c.donorId === item.donorId);
                current[index] = { ...current[index], ...item };
            } else {
                current.unshift(item);
            }
        }

        localStorage.setItem(STORAGE_KEYS.SPECIMENS, JSON.stringify(current));
        this.addHistory('Imported', `${importedList.length} records`);
        this.addNotification('Batch Import Successful', `Imported ${importedList.length} specimen records into Tang Lab.`, 'info');
        this.dispatchChangeEvent();
        this.triggerAutoDriveSync();
    },

    // Google Drive Cloud Auto-Backup & Sync Engine
    getDriveConfig() {
        this.init();
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.GDRIVE);
            return raw ? { ...DEFAULT_GDRIVE_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_GDRIVE_CONFIG };
        } catch (e) {
            return { ...DEFAULT_GDRIVE_CONFIG };
        }
    },

    saveDriveConfig(config) {
        const current = this.getDriveConfig();
        const updated = { ...current, ...config };
        localStorage.setItem(STORAGE_KEYS.GDRIVE, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('pathology_gdrive_config_change', { detail: updated }));
        return updated;
    },

    _gdriveDebounceTimer: null,

    triggerAutoDriveSync() {
        try {
            const config = this.getDriveConfig();
            if (config.webhookUrl && config.autoSync) {
                if (this._gdriveDebounceTimer) clearTimeout(this._gdriveDebounceTimer);
                this._gdriveDebounceTimer = setTimeout(() => {
                    this.syncToGoogleDrive({ manual: false, silent: true });
                }, 3000); // 3-second debounce
            }
        } catch (e) {
            console.error('Error triggering auto drive sync:', e);
        }
    },

    async testDriveConnection(webhookUrl) {
        const url = (webhookUrl || this.getDriveConfig().webhookUrl || '').trim();
        if (!url) {
            return { success: false, error: 'Google Drive Webhook URL is empty.' };
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'ping',
                    timestamp: new Date().toISOString()
                })
            });

            if (!res.ok) {
                return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
            }

            const data = await res.json();
            if (data.success) {
                this.saveDriveConfig({
                    webhookUrl: url,
                    lastFolderUrl: data.folderUrl || '',
                    lastAccount: data.account || '',
                    lastStatus: 'success',
                    lastError: ''
                });
            }
            return data;
        } catch (err) {
            return { success: false, error: err.message || 'Network error connecting to Google Apps Script.' };
        }
    },

    async syncToGoogleDrive({ manual = false, silent = false } = {}) {
        const config = this.getDriveConfig();
        const url = (config.webhookUrl || '').trim();
        if (!url) {
            if (manual && !silent && typeof showToast === 'function') {
                showToast('Please configure your Google Drive Webhook in Settings first.', 'warning');
            }
            return { success: false, error: 'Webhook URL not configured' };
        }

        this.saveDriveConfig({ lastStatus: 'syncing' });
        window.dispatchEvent(new CustomEvent('pathology_gdrive_sync_start'));

        try {
            const specimens = this.getAll();
            const settings = this.getSettings();
            const history = this.getHistory();

            // 1. Generate Excel Base64
            let excelBase64 = '';
            if (typeof XLSX !== 'undefined') {
                const exportData = specimens.map(item => ({
                    'Tracking ID': item.tid || item.id,
                    'Donor ID': item.donorId,
                    'Organ Type': item.organ,
                    'Position': item.position || '',
                    'Preservation Method': item.preservation,
                    'Storage Location': item.location,
                    'Status / Modality': (item.statusOptions || []).join('; '),
                    'Histology': item.histology ? 'Yes' : 'No',
                    'Age': item.age || '',
                    'Gender': item.gender || '',
                    'BMI (kg/m²)': item.bmi || '',
                    'Cause of Death': item.causeOfDeath || '',
                    'Warm Ischemia (min)': item.warmIschemiaNA ? 'N/A' : (item.warmIschemia || ''),
                    'Clamp Time': item.clampTime || '',
                    'Collection Time': item.collectionTime || '',
                    'Cold Ischemia Duration': item.coldIschemia || '',
                    'Cold Ischemia (mins)': item.coldIschemiaMinutes || 0,
                    'Medical History': (item.medicalHistory || []).join('; '),
                    'Clinical Remarks': item.remarks || '',
                    'Status': item.status || 'Clear',
                    'Registered Date': item.createdAt || ''
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Specimens');
                excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            }

            // 2. Generate JSON snapshot
            const jsonBackup = JSON.stringify({
                version: '2.0',
                exportedAt: new Date().toISOString(),
                specimens,
                settings,
                history
            }, null, 2);

            const payload = {
                action: 'backup',
                labId: settings.labId || 'Tang Lab',
                specimenCount: specimens.length,
                excelBase64,
                jsonBackup,
                timestamp: new Date().toISOString()
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const result = await res.json();
            if (!result.success) {
                throw new Error(result.error || 'Google Drive backup failed.');
            }

            const now = new Date().toISOString();
            this.saveDriveConfig({
                lastSyncTime: now,
                lastFolderUrl: result.folderUrl || config.lastFolderUrl || '',
                lastAccount: result.account || config.lastAccount || '',
                lastStatus: 'success',
                lastError: ''
            });

            this.addHistory('Cloud Synced', `${specimens.length} specimens to Google Drive`);
            if (manual && !silent && typeof showToast === 'function') {
                showToast(`Backed up ${specimens.length} specimens to Google Drive!`, 'success');
            }
            window.dispatchEvent(new CustomEvent('pathology_gdrive_sync_success', { detail: result }));
            return result;

        } catch (err) {
            console.error('Google Drive Sync Error:', err);
            this.saveDriveConfig({
                lastStatus: 'error',
                lastError: err.message || 'Sync failed'
            });
            if (manual && !silent && typeof showToast === 'function') {
                showToast(`Google Drive sync error: ${err.message}`, 'error');
            }
            window.dispatchEvent(new CustomEvent('pathology_gdrive_sync_error', { detail: err }));
            return { success: false, error: err.message };
        }
    },

    async restoreFromGoogleDrive() {
        const config = this.getDriveConfig();
        const url = (config.webhookUrl || '').trim();
        if (!url) {
            if (typeof showToast === 'function') {
                showToast('Google Drive Webhook is not configured.', 'error');
            }
            return { success: false, error: 'Webhook URL missing' };
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'restore',
                    timestamp: new Date().toISOString()
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const result = await res.json();
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to retrieve backup from Google Drive.');
            }

            const backup = result.data;
            if (backup.specimens && Array.isArray(backup.specimens)) {
                this.mergeImported(backup.specimens);
                if (backup.settings) {
                    this.saveSettings({ ...this.getSettings(), ...backup.settings });
                }
                if (typeof showToast === 'function') {
                    showToast(`Restored ${backup.specimens.length} specimens from Google Drive!`, 'success');
                }
                this.dispatchChangeEvent();
                return { success: true, count: backup.specimens.length };
            } else {
                throw new Error('Invalid backup structure in Google Drive.');
            }
        } catch (err) {
            if (typeof showToast === 'function') {
                showToast(`Restore failed: ${err.message}`, 'error');
            }
            return { success: false, error: err.message };
        }
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

    addHistory(action, target, user = 'Tang Lab') {
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
            version: '2.0',
            exportedAt: new Date().toISOString(),
            specimens: this.getAll(),
            settings: this.getSettings(),
            history: this.getHistory()
        };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Tang_Lab_Pathology_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
